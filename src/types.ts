/**
 * Types for Bricksmith
 */

/**
 * Data type for path in plugin
 * String representing an object key
 */
export type Path = string | number | symbol;

/**
 * Splits path into parts for navigating nested objects
 */
export type SplitPath<Path extends string> = Path extends `${infer Head}.${infer Tail}`
  ? [...SplitPath<Head>, ...SplitPath<Tail>]
  : Path extends `${infer Key}[*]${infer Rest}`
    ? [Key, '*', ...SplitPath<Rest>]
    : Path extends `${infer Key}[${infer Index}]${infer Rest}`
      ? [Key, Index, ...SplitPath<Rest>]
      : Path extends `[${infer Index}]${infer Rest}`
        ? [Index, ...SplitPath<Rest>]
        : Path extends ''
          ? []
          : [Path];

/**
 * Gets value type by path parts
 */
export type GetValueByPathParts<T, Parts extends readonly any[]> = Parts extends [
  infer Head,
  ...infer Tail,
]
  ? Head extends keyof T
    ? GetValueByPathParts<T[Head], Tail>
    : Head extends '*'
      ? T extends Array<infer U>
        ? Tail['length'] extends 0
          ? U
          : GetValueByPathParts<U, Tail>
        : never
      : Head extends `${number}`
        ? T extends Array<infer U>
          ? GetValueByPathParts<U, Tail>
          : never
        : never
  : T;

/**
 * Gets value type by path string
 */
export type GetValueByPath<T, Path extends string> = GetValueByPathParts<
  T,
  SplitPath<Path>
>;

/**
 * Gets value type by key
 */
export type ValueType<T, P extends Path> = P extends keyof T
  ? T[P]
  : P extends string 
    ? GetValueByPath<T, P>
    : any;

/**
 * Type for setting value in an object by path
 * Recursively builds a new type with added property
 */
export type SetValueByPath<T, P extends string, V> = 
  P extends `${infer Head}.${infer Tail}`
    ? {
        [K in keyof T | Head]: K extends Head
          ? Head extends keyof T
            ? SetValueByPath<T[Head], Tail, V>
            : SetValueByPath<Record<string, never>, Tail, V>
          : K extends keyof T
            ? T[K]
            : never
      }
    : P extends keyof T
      ? { [K in keyof T]: K extends P ? V : T[K] } & { [K in P]: V }
      : T & { [K in P]: V };

/**
 * Type for object with transformed value by key
 */
export type WithTransformedValue<T, _S extends Path, T2 extends Path, V> = T2 extends keyof T
  ? { [K in keyof T]: K extends T2 ? V : T[K] }
  : T2 extends string
    ? SetValueByPath<T, T2, V>
    : T & { [K in T2 & string]: V };

/**
 * Plugin hooks
 */
export type Hook = 'before' | 'after';

/**
 * Transform context
 */
export interface TransformContext<T = any, S extends Path = string, T2 extends Path = string, V = any> {
  /** Complete data set */
  data: T;
  /** Target path for saving the result */
  target: T2;
  /** Target value (if already exists) */
  targetValue?: V;
  /** Source path for getting data */
  source: S;
  /** Source value */
  sourceValue: S extends keyof T 
    ? T[S] 
    : S extends string 
      ? S extends `${string}[*]${string}` | `${string}[*]`
        ? S extends `${string}[*]`
          ? T extends Record<string, any[]>
            ? T[keyof T] extends Array<infer U> ? U : any
            : any
          : any
        : GetValueByPath<T, S>
      : any;
}

/**
 * Bricksmith plugin interface
 * @template T Input data type
 * @template S Source path for getting data
 * @template T2 Target path for saving the result
 * @template V Transformation result type
 * @template A Type returned by the after hook (default V)
 */
export interface BricksmithPlugin<
  T = any, 
  S extends Path = string,
  T2 extends Path = string,
  V = any,
  A = V // Type returned by the after hook (default V)
> {
  /** 
   * Source path for getting data
   * Supports nested paths with dots, array access via [index], and wildcards [*]
   */
  source: S;
  
  /** 
   * Target path for saving transformed data
   * If not specified, source value is used
   * Supports nested paths with dots, array access via [index], and wildcards [*]
   */
  target?: T2;
  
  /** Transformation function */
  transform: (context: TransformContext<T, S, T2>) => V;
  
  /** Hooks to execute before or after transformation */
  hooks?: {
    before?: (context: TransformContext<T, S, T2>) => TransformContext<T, S, T2>;
    after?: (context: TransformContext<T, S, T2>, result: V) => A;
  };
  
  /**
   * Flag indicating whether to keep the source value when copying to a new path
   * If true and source != target, the source value will be preserved
   * If false or not specified, the source value is removed (move instead of copy)
   * Works only if target differs from source
   * @default false
   */
  keepSource?: boolean;
}

/**
 * Plugin type
 * @template T Input data type
 * @template S Source path for getting data
 * @template T2 Target path for saving the result
 * @template V Transformation result type
 * @template A Type returned by the after hook (default V)
 */
export type PluginType<
  T = any, 
  S extends Path = string,
  T2 extends Path = string,
  V = any,
  A = V // Type returned by the after hook (default V)
> = BricksmithPlugin<T, S, T2, V, A>;

/**
 * Type for global hooks
 */
export interface BricksmithHooks {
  /** 
   * Global beforeBuild hook - called once before all transformations
   * @param data Source data
   * @param plugins List of plugins that will be applied
   * @returns Modified source data
   */
  beforeBuild?(
    data: any, 
    plugins: BricksmithPlugin[]
  ): any;
  
  /** 
   * Global afterBuild hook - called once after all transformations
   * @param data Resulting data after all transformations
   * @param plugins List of plugins that were applied
   * @returns Final modified data
   */
  afterBuild?(
    data: any, 
    plugins: BricksmithPlugin[]
  ): any;
}

/**
 * Bricksmith configuration
 */
export interface BricksmithConfig {
  /** Global hooks for all plugins */
  hooks?: BricksmithHooks;
}

/**
 * Plugin execution result (for internal use)
 */
export interface PluginResult {
  /** Source data key */
  source: string;
  
  /** Target data key */
  target: string;
  
  /** Transformation result */
  result: any;
  
  /** Whether the transformation was applied */
  applied: boolean;
}

/**
 * Result of executing the plugin chain
 * @template T Result type after all transformations
 */
export interface BricksmithResult<T = any> {
  /** Transformed data */
  data: T;
} 