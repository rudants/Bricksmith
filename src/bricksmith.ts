import {
  BricksmithPlugin,
  BricksmithConfig,
  BricksmithResult,
  TransformContext,
  PluginResult,
  Path,
  WithTransformedValue
} from './types';
import { getValueByPath, setValueByPath, deepClone, parsePath } from './utils';

// Need to import isArrayIndex and getArrayIndex functions
// Since they're not exported in utils.ts, we'll add their implementation here

/**
 * Checks if a path is accessing an array element
 * @param part Path part to check
 * @returns true if the path is accessing an array element
 */
function isArrayIndex(part: string): boolean {
  return part.startsWith('[') && part.endsWith(']');
}

/**
 * Gets index from an array access path
 * @param part Path part with index
 * @returns Numeric index
 */
function getArrayIndex(part: string): number {
  return Number(part.slice(1, -1));
}

/**
 * Helper type for extracting the result type from BricksmithPlugin
 */
export type ExtractResultType<P> = P extends BricksmithPlugin<any, any, any, any, infer A> ? WithTransformedValue<any, any, A> : never;

/**
 * Helper type for determining the result of the brick method
 */
export type BrickResult<T, P> = P extends BricksmithPlugin<any, any, any, any, infer A> 
  ? Bricksmith<WithTransformedValue<T, any, A>> 
  : Bricksmith<T>;

/**
 * Type for moving value from one path to another
 * If source and target paths differ, the value will be removed from the source path
 * @template T Input data type
 * @template S Source path
 * @template T2 Target path
 * @template V Value type
 * @template K Flag to keep source value (true - keep, false - remove)
 */
export type WithMovedValue<T, S extends Path, T2 extends Path, V, K extends boolean = false> = 
  S extends T2 
    ? WithTransformedValue<T, T2, V> 
    : K extends true
      ? WithTransformedValue<T, T2, V>
      : OmitNestedPath<WithTransformedValue<T, T2, V>, S>;

/**
 * Type helper for removing a nested path from an object type
 * @template T Input data type
 * @template P Path to remove
 */
export type OmitNestedPath<T, P extends Path> = P extends string
  ? P extends `${infer Head}.${infer Tail}`
    ? {
        [K in keyof T]: K extends Head
          ? OmitNestedPath<T[K & keyof T], Tail>
          : T[K]
      }
    : {
        [K in keyof T as K extends P ? never : K]: T[K]
      }
  : T;

/**
 * Bricksmith - data processor with plugin support
 */
export class Bricksmith<T = any> {
  private plugins: BricksmithPlugin<any, any, any, any, any>[] = [];
  private config: BricksmithConfig = {};

  /**
   * Creates a new Bricksmith instance
   * @param config Configuration
   */
  constructor(config?: BricksmithConfig) {
    if (config) {
      this.config = { ...this.config, ...config };
    }
  }

  /**
   * Adds a plugin to the processing chain
   * If source path and target path differ,
   * the value will be moved from source path to target path (removed from source)
   * This behavior can be changed with keepSource=true parameter
   * @param plugin Plugin
   * @returns Bricksmith instance for method chaining with updated type
   */
  brick<
    S extends Path,
    T2 extends Path = S,
    V = any,
    A = V,
    K extends boolean = false,
    R = S extends T2 
      ? WithTransformedValue<T, T2, A> 
      : WithMovedValue<T, S, T2, A, K>
  >(
    plugin: BricksmithPlugin<T, S, T2, V, A> & { keepSource?: K }
  ): Bricksmith<R> {
    // Check that both required fields are specified
    if (!plugin.source) {
      throw new Error('Plugin must contain a source path');
    }
    
    // If target is not specified, use source as target
    if (!plugin.target) {
      plugin.target = plugin.source as unknown as T2;
    }
    
    // Single plugin
    this.plugins.push(plugin);
    return this as unknown as Bricksmith<R>;
  }

  /**
   * Clears the list of plugins
   * @returns Bricksmith instance for method chaining
   */
  clear(): Bricksmith<T> {
    this.plugins = [];
    return this;
  }

  /**
   * Transforms data by applying the plugin chain
   * @param data Data to transform
   * @returns Transformation result
   */
  build(data: any): BricksmithResult<T> {
    // Use typing for transformed data
    type ProcessedData = T;
    
    // Create a copy of the source data
    let processedData = deepClone(data);
    
    // Apply the global beforeBuild hook if it exists
    if (this.config.hooks?.beforeBuild) {
      processedData = this.config.hooks.beforeBuild(processedData, this.plugins);
    }
    
    // Apply all plugins sequentially
    for (const plugin of this.plugins) {
      this.applyPlugin(plugin, processedData);
    }
    
    // Apply the global afterBuild hook if it exists
    if (this.config.hooks?.afterBuild) {
      processedData = this.config.hooks.afterBuild(processedData, this.plugins);
    }
    
    const result: BricksmithResult<ProcessedData> = {
      data: processedData
    };

    // Return the result with explicit type casting
    // TypeScript doesn't always correctly infer types when using after hooks
    // especially when they add new fields to objects
    return result as BricksmithResult<T>;
  }

  /**
   * Applies a single plugin to the data
   * If source and target differ and keepSource is not set to true,
   * the value will be moved (removed from the source path)
   * @param plugin Plugin to apply
   * @param data Data to process
   * @returns Result of applying the plugin
   */
  private applyPlugin(plugin: BricksmithPlugin<any, any, any, any, any>, data: any): PluginResult {
    const pluginResult: PluginResult = {
      source: String(plugin.source),
      target: String(plugin.target),
      result: null,
      applied: false
    };

    try {
      // Get source and target values using nested paths
      const sourceValue = getValueByPath(data, String(plugin.source));
      const targetValue = getValueByPath(data, String(plugin.target));
      
      // Create context for transformation
      let context: TransformContext<any, typeof plugin.source, typeof plugin.target> = {
        data,
        source: plugin.source,
        sourceValue,
        target: plugin.target,
        targetValue
      };

      // If sourceValue is undefined, skip transformation
      if (context.sourceValue === undefined) {
        pluginResult.applied = false;
        return pluginResult;
      }

      // Apply local before hook if it exists
      if (plugin.hooks?.before) {
        context = plugin.hooks.before(context);
      }

      // Apply transformation
      let transformedValue = plugin.transform(context);
      pluginResult.result = transformedValue;
      
      // Apply local after hook if it exists
      if (plugin.hooks?.after) {
        transformedValue = plugin.hooks.after(context, transformedValue);
        pluginResult.result = transformedValue;
      }

      // Create a new object for the result
      let updatedData = JSON.parse(JSON.stringify(data));
      
      // Set transformed value to the target path
      updatedData = setValueByPath(updatedData, String(plugin.target), transformedValue);
      
      // If source and target paths differ and keepSource is not true, remove the source value
      if (String(plugin.source) !== String(plugin.target) && !plugin.keepSource) {
        const sourcePath = String(plugin.source);
        const parts = parsePath(sourcePath);
        
        // If there are no parts, do nothing
        if (parts.length > 0) {
          // Get parent object and last part of the path
          const lastPart = parts[parts.length - 1];
          const parentParts = parts.slice(0, -1);
          let parent = updatedData;
          
          // Navigate to parent object
          for (const part of parentParts) {
            if (isArrayIndex(part)) {
              const index = getArrayIndex(part);
              if (Array.isArray(parent) && index >= 0 && index < parent.length) {
                parent = parent[index];
              } else {
                // If we can't navigate to parent, exit
                break;
              }
            } else if (parent && typeof parent === 'object') {
              parent = parent[part];
            } else {
              // If we can't navigate to parent, exit
              break;
            }
          }
          
          // Remove value depending on the type of parent object and last part of the path
          if (parent && typeof parent === 'object') {
            if (isArrayIndex(lastPart) && Array.isArray(parent)) {
              // For arrays, use splice to remove element
              const index = getArrayIndex(lastPart);
              if (index >= 0 && index < parent.length) {
                parent.splice(index, 1);
              }
            } else if (!Array.isArray(parent)) {
              // For objects, delete the property
              delete parent[lastPart];
            }
          }
        }
      }
      
      // Copy properties from updatedData to data
      Object.keys(data).forEach(key => {
        delete data[key];
      });
      Object.keys(updatedData).forEach(key => {
        data[key] = updatedData[key];
      });
      
      pluginResult.applied = true;
    } catch (error) {
      // In case of error, log it and skip transformation
      console.error(`[Bricksmith] Error transforming from source "${pluginResult.source}" to target "${pluginResult.target}":`, error);
      pluginResult.applied = false;
    }

    return pluginResult;
  }
} 