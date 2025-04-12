/**
 * Types for working with materials and bricks
 */
// Key for accessing material
export type MaterialKey<S = any> = keyof S;

// Template for brick paths
export type BrickPath = 
  | `${string}.${string}` 
  | `${string}[${number}]` 
  | `${string}[${string}]`;

// Path to target brick
export type TargetPath<T = any> = T extends Record<any, any> ? (keyof T | BrickPath) : string | number;

/**
 * Functions for working with bricks
 */
// Brick processing function
export type BrickTransform<S = any, V = any, R = any> = (value: V, source: S) => R;

// Brick applicability check function
export type BrickCondition<S = any> = (source: S) => boolean;

/**
 * Base brick - main building block
 * 
 * @template Source - Source material type
 * @template Target - Target structure type
 * @template Value - Extracted value type
 * @template Result - Processing result type
 */
export interface Brick<Source = any, Target = any, Value = any, Result = any> {
  /**
   * Source material for brick
   */
  source?: MaterialKey<Source> | BrickPath | undefined;

  /**
   * Position of brick in target structure
   */
  target: TargetPath<Target>;

  /**
   * Brick processing function
   */
  transform?: BrickTransform<Source, Value, Result>;

  /**
   * Fallback brick if material is not found
   */
  fallback?: Result;

  /**
   * Preserve empty bricks
   */
  preserveNull?: boolean;

  /**
   * Brick usage condition
   */
  condition?: BrickCondition<Source>;
}

/**
 * Blueprint - structure description
 */
export interface Blueprint<Source = any, Target = any> {
  /**
   * Array of bricks for construction
   */
  bricks: Array<Brick<Source, Target, any, any>>;
}

/**
 * Construction settings
 */
export interface Construction<Source = any, Target = any> {
  /**
   * Strict mode - do not skip empty bricks
   */
  strict?: boolean;
  
  /**
   * Skip empty bricks
   */
  skipUndefined?: boolean;
  
  /**
   * Skip holes in structure
   */
  skipNull?: boolean;
  
  /**
   * Skip holes in structure
   */
  skipHoles?: boolean;
  
  /**
   * Construction tools
   */
  tools?: BrickTool<Source, Target>[];
  
  /**
   * Additional settings
   */
  [key: string]: unknown;
}

/**
 * Build result
 */
export type BuildResult<T> = T;

/**
 * Workspace
 */
export interface WorkSpace<Source = any, Target = any> {
  /**
   * Source material
   */
  materials: Source;
  
  /**
   * Blueprint
   */
  blueprint: Blueprint<Source, Target>;
  
  /**
   * Construction settings
   */
  construction: Construction<Source, Target>;
  
  /**
   * Current processed material
   */
  currentMaterial?: unknown;
  
  /**
   * Current position in structure
   */
  currentPosition?: TargetPath<Target>;
  
  /**
   * Additional data
   */
  [key: string]: unknown;
}

/**
 * Tool for working with bricks
 */
export interface BrickTool<Source = any, Target = any> {
  /**
   * Tool name
   */
  name: string;
  
  /**
   * Global preprocessing
   */
  beforeBuild?: (materials: Source, workspace: WorkSpace<Source, Target>) => Source | null;
  
  /**
   * Preprocessing before each brick
   */
  beforeBrick?: (brick: Brick<Source, Target>, materials: Source, workspace: WorkSpace<Source, Target>) => Source | null;
  
  /**
   * Postprocessing after each brick
   */
  afterBrick?: (brick: Brick<Source, Target>, value: unknown, result: Target, workspace: WorkSpace<Source, Target>) => void;
  
  /**
   * Global postprocessing
   */
  afterBuild?: (result: Target, workspace: WorkSpace<Source, Target>) => void;
}

/**
 * Types for tool extensions
 */
// Brick extension with additional properties
export type ExtendedBrick<Source = any, Target = any, E = Record<string, unknown>> = Brick<Source, Target> & E;

// Workspace extension
export type ExtendedWorkSpace<Source = any, Target = any, E = Record<string, unknown>> = WorkSpace<Source, Target> & E; 