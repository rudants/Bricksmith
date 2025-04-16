import { 
  Brick, 
  Blueprint, 
  Construction, 
  BuildResult, 
  WorkSpace, 
  BrickTool 
} from './types';

/**
 * Bricksmith - data bricks master
 * 
 * Main class for transforming data from one format to another
 * using the concept of "bricks" and "construction"
 */
export class Bricksmith<Source = Record<string, unknown>, Target = Record<string, unknown>> {
  private readonly blueprint: Blueprint<Source, Target>;
  private readonly construction: Construction<Source, Target>;
  private readonly tools: BrickTool<Source, Target>[];

  /**
   * New Bricksmith instance
   * 
   * @param blueprint - Blueprint for construction
   * @param construction - Construction settings
   */
  constructor(
    blueprint: Blueprint<Source, Target>,
    construction: Construction<Source, Target> = {}
  ) {
    this.blueprint = blueprint;
    this.construction = construction;
    this.tools = construction.tools || [];
  }

  /**
   * Builds structure from source materials
   * 
   * @param materials - Source materials
   * @returns Built structure
   */
  build(materials: Source): BuildResult<Target> {
    const workspace: WorkSpace<Source, Target> = {
      materials,
      blueprint: this.blueprint,
      construction: this.construction
    };

    materials = this.runBeforeBuild(materials, workspace);
    
    const result = {} as Target;

    for (const brick of this.blueprint.bricks) {
      if (!this.shouldApplyBrick(brick, materials, workspace)) {
        continue;
      }

      // Call beforeBrick hook for each tool
      for (const tool of this.tools) {
        if (tool.beforeBrick) {
          const newMaterials = tool.beforeBrick(brick, materials, workspace);
          if (newMaterials !== null) {
            materials = newMaterials;
          }
        }
      }

      const value = this.getValueFromMaterials(brick, materials);
      
      if (!this.shouldSkipValue(value, brick)) {
        const transformedValue = this.transformValue(value, materials, brick);
        this.setValueInStructure(brick.target, transformedValue, result);
        
        // Call afterBrick hook for each tool
        for (const tool of this.tools) {
          if (tool.afterBrick) {
            tool.afterBrick(brick, transformedValue, result, workspace);
          }
        }
      }
    }

    this.runAfterBuild(result, workspace);

    return result;
  }

  /**
   * Performs global preprocessing
   */
  private runBeforeBuild(
    materials: Source,
    workspace: WorkSpace<Source, Target>
  ): Source {
    for (const tool of this.tools) {
      if (tool.beforeBuild) {
        const result = tool.beforeBuild(materials, workspace);
        if (result !== null) {
          materials = result;
        }
      }
    }
    return materials;
  }

  /**
   * Performs global postprocessing
   */
  private runAfterBuild(
    result: Target,
    workspace: WorkSpace<Source, Target>
  ): void {
    for (const tool of this.tools) {
      if (tool.afterBuild) {
        tool.afterBuild(result, workspace);
      }
    }
  }

  /**
   * Checks if brick should be applied
   */
  private shouldApplyBrick(
    brick: Brick<Source, Target>,
    materials: Source,
    _workspace: WorkSpace<Source, Target>
  ): boolean {
    if (brick.condition && !brick.condition(materials)) {
      return false;
    }

    return true;
  }

  /**
   * Gets value from materials
   */
  private getValueFromMaterials<K extends keyof Source>(
    brick: Brick<Source, Target>,
    materials: Source
  ): Source[K] | undefined {
    if (!brick.source) {
      return brick.fallback;
    }

    // Check type and property existence
    const key = typeof brick.source === 'string' ? brick.source : String(brick.source);
    const value = materials[key as K];
    if (value === undefined) {
      return brick.fallback;
    }

    return value;
  }

  /**
   * Checks if empty value should be skipped
   */
  private shouldSkipValue(value: unknown, brick: Brick<Source, Target>): boolean {
    if (brick.preserveNull) {
      return false;
    }

    if (this.construction.strict) {
      return false;
    }

    if (this.construction.skipNull && value === null) {
      return true;
    }

    if (this.construction.skipUndefined && value === undefined) {
      return true;
    }

    return false;
  }

  /**
   * Transforms value
   */
  private transformValue(
    value: unknown,
    materials: Source,
    brick: Brick<Source, Target>
  ): unknown {
    if (brick.transform) {
      return brick.transform(value, materials);
    }
    return value;
  }

  /**
   * Sets value in structure
   */
  private setValueInStructure(
    path: string | number | symbol,
    value: unknown,
    structure: Target
  ): void {
    (structure as Record<string | number | symbol, unknown>)[path] = value;
  }
} 