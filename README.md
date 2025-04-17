# Bricksmith

A library for data transformation using plugins. Bricksmith allows you to create chains of data transformations using plugins with hook support.

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

## Core Concepts

- **Bricksmith** - main class for data processing
- **BricksmithPlugin** - plugin for data transformation
- **Path** - path to data for transformation (string or function)
- **Hook** - hooks for execution before and after transformation

## Usage Example

```typescript
import { bricksmith, BricksmithPlugin } from 'bricksmith';

// Data to process
const data = {
  user: {
    firstName: 'John',
    lastName: 'Smith'
  }
};

// Plugin for name transformation
const NameFormatterPlugin: BricksmithPlugin = {
  name: 'name-formatter',
  path: 'user.firstName',
  transform: ({ value }) => {
    return value.toUpperCase();
  }
};

// Plugin for creating full name
const FullNamePlugin: BricksmithPlugin = {
  name: 'full-name-creator',
  path: 'user.fullName',
  transform: ({ data }) => {
    const firstName = data.user.firstName;
    const lastName = data.user.lastName;
    return `${firstName} ${lastName}`;
  }
};

// Using the library
const processor = bricksmith()
  .brick([NameFormatterPlugin, FullNamePlugin]);

// Start processing
const result = processor.build(data);

console.log(result.data);
// {
//   user: {
//     firstName: 'JOHN',
//     lastName: 'Smith',
//     fullName: 'JOHN Smith'
//   }
// }
```

## API

### Function bricksmith

Creates a new instance of Bricksmith.

```typescript
bricksmith<T = any>(config?: BricksmithConfig): Bricksmith<T>
```

#### Parameters

- `config` - Bricksmith configuration
  - `strict` (boolean, default: false) - Strict mode. Throws errors when data is missing.
  - `collectLogs` (boolean, default: false) - Collect transformation logs.

### Bricksmith Class

#### Methods

- `brick(plugins: BricksmithPlugin<T> | BricksmithPlugin<T>[]): Bricksmith<T>` - Adds plugin(s) to the processing chain.
- `clear(): Bricksmith<T>` - Clears the list of plugins.
- `build(data: T): BricksmithResult<T>` - Transforms data by applying the plugin chain.

### BricksmithPlugin Interface

```typescript
interface BricksmithPlugin<T = any> {
  name: string;
  path: Path;
  transform: (context: TransformContext<T>) => any;
  hooks?: {
    before?: (context: TransformContext<T>) => TransformContext<T>;
    after?: (context: TransformContext<T>, result: any) => any;
  };
}
```

#### Properties

- `name` - Unique plugin name.
- `path` - Path to data that will be transformed. Can be a string or function.
- `transform` - Transformation function.
- `hooks` - Hooks to execute before or after transformation.

### TransformContext Interface

```typescript
interface TransformContext<T = any> {
  data: T;
  path: string;
  pluginName: string;
  value: any;
}
```

#### Properties

- `data` - Complete data set.
- `path` - Path to the value being transformed.
- `pluginName` - Name of the current plugin.
- `value` - Current value.

## Path Support

Bricksmith supports various path formats:

- Simple properties: `'user.firstName'`
- Array indices: `'users[0].firstName'`
- Nested paths: `'user.contacts.email'`
- Wildcard arrays: `'users[*].contacts'` - select all contacts for all users
- Wildcard keys in objects: `'user.*'` - select all properties of the user object
- Combined nested paths: `'users[*].posts[*].comments[0]'` - select the first comment in each post of each user
- Dynamic paths: `(data) => data.someProp ? 'path1' : 'path2'`

### Example of using nested paths

```typescript
// Create a Bricksmith instance
const brick = new Bricksmith();

// Apply a chain of transformations using nested paths
const result = brick
  // Working with arrays - transform all post titles to uppercase
  .brick({
    source: 'user.posts[*].title',
    target: 'user.posts[*].title',
    transform: ({ sourceValue }) => 
      sourceValue.toUpperCase()
  })
  
  // Access to a specific array element
  .brick({
    source: 'user.posts[0]',
    target: 'user.firstPost',
    transform: ({ sourceValue }) => sourceValue
  })
  
  // Working with nested arrays
  .brick({
    source: 'user.posts[*].comments[*].text',
    target: 'user.posts[*].comments[*].text',
    transform: ({ sourceValue }) => 
      `>> ${sourceValue} <<`
  })
  
  // Start the transformation chain
  .build(inputData);
```

## License

MIT 