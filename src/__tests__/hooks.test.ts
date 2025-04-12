import { Bricksmith } from '../bricksmith';
import type { Brick, Blueprint, Construction, BrickTool } from '../types';

interface Source {
  firstName: string;
  lastName: string;
  age: number;
  rawData?: {
    firstName: string;
    lastName: string;
    age: number;
  };
}

interface Target {
  name: string;
  surname: string;
  isAdult: boolean;
  fullName: string;
  years?: number;
}

describe('Bricksmith Hooks', () => {
  const source: Source = {
    firstName: 'John',
    lastName: 'Doe',
    age: 30
  };

  const blueprint: Blueprint<Source, Target> = {
    bricks: [
      { source: 'firstName', target: 'name' },
      { source: 'lastName', target: 'surname' },
      { 
        source: 'age', 
        target: 'isAdult',
        transform: (age) => age >= 18
      },
      { 
        source: 'firstName', 
        target: 'fullName',
        transform: (firstName, source) => `${firstName} ${source.lastName}`
      }
    ]
  };

  describe('beforeBrick hook', () => {
    it('should modify materials before each brick', () => {
      const modifiedMaterials: Source[] = [];
      const processedBricks: string[] = [];

      const tool: BrickTool<Source, Target> = {
        name: 'testTool',
        beforeBrick: (brick, materials, workspace) => {
          processedBricks.push(brick.target as string);
          modifiedMaterials.push({ ...materials });
          return materials;
        }
      };

      const bricksmith = new Bricksmith(blueprint, { tools: [tool] });
      bricksmith.build(source);

      expect(processedBricks).toEqual(['name', 'surname', 'isAdult', 'fullName']);
      expect(modifiedMaterials).toHaveLength(4);
      expect(modifiedMaterials[0]).toEqual(source);
    });

    it('should allow modifying materials for specific bricks', () => {
      const tool: BrickTool<Source, Target> = {
        name: 'testTool',
        beforeBrick: (brick, materials) => {
          if (brick.target === 'name') {
            return { ...materials, firstName: 'Modified' };
          }
          return materials;
        }
      };

      const bricksmith = new Bricksmith(blueprint, { tools: [tool] });
      const result = bricksmith.build(source);

      expect(result.name).toBe('Modified');
      expect(result.surname).toBe('Doe');
      expect(result.fullName).toBe('Modified Doe');
    });
  });

  describe('afterBrick hook', () => {
    it('should be called after each brick processing', () => {
      const processedBricks: string[] = [];
      const processedValues: unknown[] = [];

      const tool: BrickTool<Source, Target> = {
        name: 'testTool',
        afterBrick: (brick, value, result, workspace) => {
          processedBricks.push(brick.target as string);
          processedValues.push(value);
        }
      };

      const bricksmith = new Bricksmith(blueprint, { tools: [tool] });
      bricksmith.build(source);

      expect(processedBricks).toEqual(['name', 'surname', 'isAdult', 'fullName']);
      expect(processedValues).toEqual(['John', 'Doe', true, 'John Doe']);
    });

    it('should allow modifying result after each brick', () => {
      const tool: BrickTool<Source, Target> = {
        name: 'testTool',
        afterBrick: (brick, value, result, workspace) => {
          if (brick.target === 'name') {
            (result as any).nameModified = true;
          }
        }
      };

      const bricksmith = new Bricksmith(blueprint, { tools: [tool] });
      const result = bricksmith.build(source);

      expect(result.name).toBe('John');
      expect((result as any).nameModified).toBe(true);
    });
  });

  describe('workspace tools', () => {
    it('should support workspace tools for preprocessing', () => {
      const source: Source = {
        firstName: '',
        lastName: '',
        age: 0,
        rawData: {
          firstName: 'John',
          lastName: 'Smith',
          age: 30
        }
      };

      const blueprint: Blueprint<Source, Target> = {
        bricks: [
          { source: 'firstName', target: 'name' },
          { source: 'lastName', target: 'surname' },
          { source: 'age', target: 'years' }
        ]
      };

      const construction: Construction<Source, Target> = {
        tools: [{
          name: 'preprocessor',
          beforeBuild: (materials, workspace) => ({
            ...materials,
            firstName: materials.rawData?.firstName || '',
            lastName: materials.rawData?.lastName || '',
            age: materials.rawData?.age || 0
          })
        }]
      };

      const bricksmith = new Bricksmith<Source, Target>(blueprint, construction);
      const result = bricksmith.build(source);

      expect(result.name).toBe('John');
      expect(result.surname).toBe('Smith');
      expect(result.years).toBe(30);
    });

    it('should support workspace tools for postprocessing', () => {
      const source: Source = {
        firstName: 'John',
        lastName: 'Smith',
        age: 30
      };

      const blueprint: Blueprint<Source, Target> = {
        bricks: [
          { source: 'firstName', target: 'name' },
          { source: 'lastName', target: 'surname' },
          { source: 'age', target: 'years' }
        ]
      };

      const construction: Construction<Source, Target> = {
        tools: [{
          name: 'postprocessor',
          afterBuild: (result) => {
            (result as Target & { fullName: string }).fullName = `${result.name} ${result.surname}`;
          }
        }]
      };

      const bricksmith = new Bricksmith<Source, Target>(blueprint, construction);
      const result = bricksmith.build(source);

      expect(result.name).toBe('John');
      expect(result.surname).toBe('Smith');
      expect(result.years).toBe(30);
      expect(result.fullName).toBe('John Smith');
    });
  });

  describe('combined hooks', () => {
    it('should work together with beforeBuild and afterBuild', () => {
      const executionOrder: string[] = [];

      const tool: BrickTool<Source, Target> = {
        name: 'testTool',
        beforeBuild: () => {
          executionOrder.push('beforeBuild');
          return null;
        },
        beforeBrick: () => {
          executionOrder.push('beforeBrick');
          return null;
        },
        afterBrick: () => {
          executionOrder.push('afterBrick');
        },
        afterBuild: () => {
          executionOrder.push('afterBuild');
        }
      };

      const bricksmith = new Bricksmith(blueprint, { tools: [tool] });
      bricksmith.build(source);

      expect(executionOrder).toEqual([
        'beforeBuild',
        'beforeBrick', 'afterBrick',
        'beforeBrick', 'afterBrick',
        'beforeBrick', 'afterBrick',
        'beforeBrick', 'afterBrick',
        'afterBuild'
      ]);
    });
  });
}); 