# Bricksmith

A lightweight, extensible library for object mapping in JavaScript and TypeScript with transformation support.

## Features

- 🚀 **High Performance**: Optimized for speed even with large datasets
- 🔍 **Strict Typing**: Full TypeScript support with compile-time type checking
- 🧩 **Lightweight**: Minimal size and zero dependencies
- 🔄 **Flexible Transformation**: Powerful data transformation functions
- ⚙️ **Additional Options**: Fine-grained mapper behavior configuration
- 🔒 **Reliability**: Test coverage and stable operation
- 🛠️ **Workspace Tools**: Support for preprocessing and postprocessing
- 🔄 **Array Processing**: Built-in support for array transformations
- 🏗️ **Construction Tools**: Advanced building and transformation capabilities

## Installation

```bash
npm install bricksmith
```

## Quick Start

```javascript
import { Bricksmith } from 'bricksmith';

// Source data
const source = {
  firstName: 'John',
  lastName: 'Doe',
  age: 30,
  email: 'john@example.com'
};

// Create blueprint
const blueprint = {
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
    },
    {
      source: 'email',
      target: 'contactEmail',
      condition: (source) => source.age >= 18 // Only for adults
    }
  ]
};

// Create bricksmith
const bricksmith = new Bricksmith(blueprint);

// Transform data
const result = bricksmith.build(source);
console.log(result);
/* Result:
{
  name: 'John',
  surname: 'Doe',
  isAdult: true,
  fullName: 'John Doe',
  contactEmail: 'john@example.com'
}
*/
```

## TypeScript Example

```typescript
import { Bricksmith } from 'bricksmith';

// Define data types
interface Person {
  firstName: string;
  lastName: string;
  age: number;
  email: string;
}

interface FormattedPerson {
  name: string;
  surname: string;
  isAdult: boolean;
  fullName: string;
  contactEmail?: string;
}

// Create blueprint
const blueprint = {
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
    },
    {
      source: 'email',
      target: 'contactEmail',
      condition: (source) => source.age >= 18
    }
  ]
};

// Create bricksmith with types
const bricksmith = new Bricksmith<Person, FormattedPerson>(blueprint);

// Transform data
const person: Person = {
  firstName: 'John',
  lastName: 'Doe',
  age: 30,
  email: 'john@example.com'
};

const result = bricksmith.build(person);
// Type: result is FormattedPerson
```

## Documentation

### Blueprint

The core concept of the library is the blueprint that defines how data is transformed:

```typescript
interface Blueprint<Source, Target> {
  // Array of bricks for construction
  bricks: Array<Brick<Source, Target>>;
}
```

### Brick

Each brick defines a single transformation rule:

```typescript
interface Brick<Source, Target> {
  // Source property (where to get data from)
  source?: keyof Source | undefined;
  
  // Target property (where to put data)
  target: keyof Target;
  
  // Value transformation function
  transform?: (value: unknown, source: Source) => unknown;
  
  // Default value if source is missing
  fallback?: unknown;
  
  // Preserve null values (works with skipNull)
  preserveNull?: boolean;
  
  // Rule application condition
  condition?: (source: Source) => boolean;
}
```

### Construction Options

Additional options can be passed when creating a bricksmith:

```typescript
interface Construction<Source, Target> {
  // Strict mode - don't skip null/undefined values
  strict?: boolean;
  
  // Skip undefined values in result
  skipUndefined?: boolean;
  
  // Skip null values in result
  skipNull?: boolean;
  
  // Skip holes in result
  skipHoles?: boolean;
  
  // Array of tools for preprocessing and postprocessing
  tools?: BrickTool<Source, Target>[];
}
```

### Workspace Tools

The library supports preprocessing and postprocessing through workspace tools:

```typescript
interface BrickTool<Source, Target> {
  // Tool name for identification
  name: string;
  
  // Preprocess materials before building
  beforeBuild?: (materials: Source, workspace: WorkSpace<Source, Target>) => Source | null;
  
  // Process result after building
  afterBuild?: (result: Target, workspace: WorkSpace<Source, Target>) => void;
}
```

### WorkSpace

The workspace provides context for the transformation process:

```typescript
interface WorkSpace<Source, Target> {
  // Source materials
  materials: Source;
  
  // Blueprint for construction
  blueprint: Blueprint<Source, Target>;
  
  // Construction options
  construction: Construction<Source, Target>;
  
  // Current material being processed
  currentMaterial?: unknown;
  
  // Additional properties
  [key: string]: unknown;
}
```

## Architecture

### Core Concepts

#### Materials
Materials are the source data that needs to be transformed. They represent the input data for the transformation process. In the library's terminology, these are the "raw materials" from which the target object will be built.

```typescript
// Example of materials
const materials = {
    firstName: 'John',
    lastName: 'Smith',
    age: 30
};
```

#### Bricks
Bricks are the basic building blocks for data transformation. Each brick defines a single transformation rule:
- Where to get data from (`source`)
- Where to place it (`target`)
- How to transform it (`transform`)
- When to apply it (`condition`)

```typescript
// Example of a brick
const brick = {
    source: 'firstName',  // Where to get from
    target: 'name',       // Where to place
    transform: (value) => value.toUpperCase(), // How to transform
    condition: (source) => source.age >= 18    // When to apply
};
```

#### Blueprint
A blueprint is a set of bricks that defines the structure of the target object. It describes exactly how to transform the source data.

```typescript
// Example of a blueprint
const blueprint = {
    bricks: [
        { source: 'firstName', target: 'name' },
        { source: 'lastName', target: 'surname' },
        { 
            source: 'age', 
            target: 'isAdult',
            transform: (age) => age >= 18
        }
    ]
};
```

#### Construction
Construction is the process of applying the blueprint to the materials. It includes:
- Process settings (`strict`, `skipNull`, `skipUndefined`)
- Tools for pre- and post-processing (`tools`)

```typescript
// Example of construction settings
const construction = {
    strict: true,           // Strict mode
    skipNull: false,        // Don't skip null
    skipUndefined: false,   // Don't skip undefined
    tools: []              // Processing tools
};
```

### Execution Order

1. **Initialization**
   ```typescript
   const bricksmith = new Bricksmith(blueprint, construction);
   ```

2. **Material Preprocessing** (`beforeBuild`)
   - Executed for each tool
   - Can modify source materials
   - Executed once before building begins

3. **Structure Building**
   - For each brick in the blueprint:
     - Check application condition (`condition`)
     - Get value from materials
     - Transform value (`transform`)
     - Set value in target structure

4. **Result Postprocessing** (`afterBuild`)
   - Executed for each tool
   - Can modify the result
   - Executed once after building is complete

### Tools

Tools are plugins that extend the transformation process functionality:

```typescript
interface BrickTool<Source, Target> {
    // Tool name
    name: string;
    
    // Preprocessing before building
    beforeBuild?: (materials: Source, workspace: WorkSpace<Source, Target>) => Source | null;
    
    // Postprocessing after building
    afterBuild?: (result: Target, workspace: WorkSpace<Source, Target>) => void;
}
```

#### Example of Tool Usage

```typescript
const tools = [{
    name: 'preprocessor',
    beforeBuild: (materials) => ({
        ...materials,
        fullName: `${materials.firstName} ${materials.lastName}`
    })
}, {
    name: 'postprocessor',
    afterBuild: (result) => {
        result.timestamp = new Date().toISOString();
    }
}];
```

### Workspace

The workspace provides context for the transformation process:

```typescript
interface WorkSpace<Source, Target> {
    // Source materials
    materials: Source;
    
    // Blueprint for building
    blueprint: Blueprint<Source, Target>;
    
    // Construction settings
    construction: Construction<Source, Target>;
    
    // Currently processed material
    currentMaterial?: unknown;
    
    // Current position in structure
    currentPosition?: TargetPath<Target>;
    
    // Additional data
    [key: string]: unknown;
}
```

### Complete Process Example

```typescript
// 1. Define types
interface Source {
    firstName: string;
    lastName: string;
    age: number;
}

interface Target {
    name: string;
    surname: string;
    isAdult: boolean;
    fullName: string;
    timestamp: string;
}

// 2. Create blueprint
const blueprint: Blueprint<Source, Target> = {
    bricks: [
        { source: 'firstName', target: 'name' },
        { source: 'lastName', target: 'surname' },
        { 
            source: 'age', 
            target: 'isAdult',
            transform: (age) => age >= 18
        }
    ]
};

// 3. Configure construction
const construction: Construction<Source, Target> = {
    strict: true,
    tools: [{
        name: 'preprocessor',
        beforeBuild: (materials) => ({
            ...materials,
            fullName: `${materials.firstName} ${materials.lastName}`
        })
    }, {
        name: 'postprocessor',
        afterBuild: (result) => {
            result.timestamp = new Date().toISOString();
        }
    }]
};

// 4. Create Bricksmith instance
const bricksmith = new Bricksmith<Source, Target>(blueprint, construction);

// 5. Transform data
const source: Source = {
    firstName: 'John',
    lastName: 'Smith',
    age: 30
};

const result = bricksmith.build(source);
// Result:
// {
//     name: 'John',
//     surname: 'Smith',
//     isAdult: true,
//     fullName: 'John Smith',
//     timestamp: '2024-03-14T12:00:00.000Z'
// }
```

## License

MIT 
