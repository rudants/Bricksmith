/**
 * Bricksmith - a library for data transformation using plugins
 */

import { Bricksmith, BrickResult, ExtractResultType } from './bricksmith';
import {
  BricksmithPlugin,
  BricksmithConfig,
  BricksmithResult,
  TransformContext,
  PluginResult,
  Path,
  Hook,
  PluginType,
  ValueType,
  WithTransformedValue,
  BricksmithHooks,
  SplitPath,
  GetValueByPath,
  GetValueByPathParts
} from './types';
import { getValueByPath, setValueByPath, parsePath } from './utils';

/**
 * Factory for creating a new Bricksmith instance
 */
export function bricksmith<T = any>(config?: BricksmithConfig): Bricksmith<T> {
  return new Bricksmith<T>(config);
}

// Export the main class
export { Bricksmith, BrickResult, ExtractResultType };

// Export types
export type {
  BricksmithPlugin,
  PluginType,
  BricksmithConfig,
  BricksmithHooks,
  BricksmithResult,
  TransformContext,
  PluginResult,
  Path,
  Hook,
  ValueType,
  WithTransformedValue,
  SplitPath,
  GetValueByPath,
  GetValueByPathParts
};

// Export utilities
export { getValueByPath, setValueByPath, parsePath };