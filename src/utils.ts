/**
 * Utilities for working with data
 */

/**
 * Checks if a key is escaped (containing dots as part of the key)
 * @param path Path to check
 * @returns true if the path contains escaped dots
 */
function isEscapedPath(path: string): boolean {
  // If the key exists as is in the object, it's escaped
  return path.includes('\\.');
}

/**
 * Splits a path into parts considering array access and nested objects
 * @param path Path to split
 * @returns Array of path parts
 */
export function parsePath(path: string): string[] {
  if (!path) return [];
  
  // Handle escaped dots
  if (isEscapedPath(path)) {
    return [path.replace(/\\\./g, '.')];
  }
  
  const parts: string[] = [];
  let currentPart = '';
  let inBrackets = false;
  
  for (let i = 0; i < path.length; i++) {
    const char = path[i];
    
    if (char === '\\' && i + 1 < path.length && path[i + 1] === '.') {
      // Escaped dot
      currentPart += '.';
      i++; // Skip the next character (dot)
    } else if (char === '[' && !inBrackets) {
      // Start of array access
      if (currentPart) {
        parts.push(currentPart);
        currentPart = '';
      }
      currentPart += char;
      inBrackets = true;
    } else if (char === ']' && inBrackets) {
      // End of array access
      currentPart += char;
      parts.push(currentPart);
      currentPart = '';
      inBrackets = false;
    } else if (char === '.' && !inBrackets) {
      // Path part separator
      if (currentPart) {
        parts.push(currentPart);
        currentPart = '';
      }
    } else {
      // Regular character
      currentPart += char;
    }
  }
  
  // Add the last part if it exists
  if (currentPart) {
    parts.push(currentPart);
  }
  
  return parts;
}

/**
 * Checks if a path is an array wildcard path
 * @param part Path part to check
 * @returns true if the path is a wildcard for arrays
 */
function isArrayWildcard(part: string): boolean {
  return part === '[*]' || part === '*';
}

/**
 * Checks if a path is an object wildcard path
 * @param part Path part to check
 * @returns true if the path is a wildcard for objects
 */
function isObjectWildcard(part: string): boolean {
  return part === '.*.' || part === '*';
}

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
 * Gets a value by path from an object
 * @param obj Object to get value from
 * @param path Path to property (with support for nested paths via dots, arrays via [index], and wildcards)
 * @returns Value at the specified path or undefined
 */
export function getValueByPath(obj: any, path: string): any {
  if (!obj || !path) {
    return undefined;
  }

  // First check if such a key exists directly
  // This is important for keys with dots like 'complex.key'
  if (Object.prototype.hasOwnProperty.call(obj, path)) {
    return obj[path];
  }

  // Parse the path into components
  const parts = parsePath(path);
  let current = obj;

  for (let i = 0; i < parts.length; i++) {
    if (current === null || current === undefined) {
      return undefined;
    }

    const part = parts[i];
    const isLastPart = i === parts.length - 1;

    // Handle wildcards for arrays [*]
    if (isArrayWildcard(part)) {
      if (Array.isArray(current)) {
        // If this is the last part of the path, return the entire array
        if (isLastPart) {
          return current;
        }
        
        // Otherwise, process each array element with the remaining path
        const nextParts = parts.slice(i + 1);
        const nextPath = nextParts.join('.');
        
        // If the next part is also a wildcard, process array elements recursively
        if (nextParts.length > 0) {
          // Apply the remaining path to each array element
          return current.map(item => getValueByPath(item, nextPath));
        }
        
        return current;
      }
      return undefined;
    }
    
    // Handle wildcards for object keys .*.
    else if (isObjectWildcard(part)) {
      if (typeof current === 'object' && !Array.isArray(current)) {
        // If this is the last part of the path, return the entire object
        if (isLastPart) {
          return current;
        }
        
        // Otherwise, process each object property with the remaining path
        const nextParts = parts.slice(i + 1);
        const nextPath = nextParts.join('.');
        
        const result: Record<string, any> = {};
        for (const key in current) {
          result[key] = getValueByPath(current[key], nextPath);
        }
        
        return result;
      }
      return undefined;
    }
    
    // Handle array access [index]
    else if (isArrayIndex(part)) {
      const index = getArrayIndex(part);
      if (Array.isArray(current)) {
        current = current[index];
      } else {
        return undefined;
      }
    }
    // Regular object property
    else {
      current = current[part];
    }
  }

  return current;
}

/**
 * Sets a value by path in an object
 * @param obj Object to set value in
 * @param path Path to property (with support for nested paths via dots, arrays via [index], and wildcards)
 * @param value Value to set
 * @returns New object with set value
 */
export function setValueByPath(obj: any, path: string, value: any): any {
  if (!obj || !path) {
    return obj;
  }
  
  // Create a deep copy of the object
  const result = deepClone(obj);
  
  // First check if such a key exists directly
  // This is important for keys with dots like 'complex.key'
  if (Object.prototype.hasOwnProperty.call(obj, path)) {
    result[path] = value;
    return result;
  }
  
  // Parse the path into components
  const parts = parsePath(path);
  
  // If there are no parts, return the original object
  if (parts.length === 0) {
    return result;
  }
  
  // Function for recursively setting value
  const setValueRecursively = (obj: any, parts: string[], value: any, index: number): any => {
    // If we've reached the end of the path, set the value
    if (index >= parts.length) {
      return value;
    }
    
    const part = parts[index];
    const isLast = index === parts.length - 1;
    
    // Handle wildcards for arrays [*]
    if (isArrayWildcard(part)) {
      if (Array.isArray(obj)) {
        if (isLast) {
          // Replace all array elements with the value
          return obj.map(() => deepClone(value));
        } else {
          // Apply changes recursively to each array element
          return obj.map(item => setValueRecursively(item, parts, value, index + 1));
        }
      }
      return obj;
    }
    // Handle wildcards for object keys .*.
    else if (isObjectWildcard(part)) {
      if (typeof obj === 'object' && !Array.isArray(obj)) {
        if (isLast) {
          // Set value for all object keys
          const result = { ...obj };
          for (const key in result) {
            result[key] = deepClone(value);
          }
          return result;
        } else {
          // Apply changes recursively to each object property
          const result = { ...obj };
          for (const key in result) {
            result[key] = setValueRecursively(result[key], parts, value, index + 1);
          }
          return result;
        }
      }
      return obj;
    }
    // Handle array access [index]
    else if (isArrayIndex(part)) {
      const arrIndex = getArrayIndex(part);
      if (Array.isArray(obj)) {
        const newArray = [...obj];
        
        // If index is out of array bounds, expand the array
        while (newArray.length <= arrIndex) {
          newArray.push(undefined);
        }
        
        // Set value or recursively continue setting
        if (isLast) {
          newArray[arrIndex] = value;
        } else {
          // If the next part doesn't exist, create an object or array
          const nextPart = parts[index + 1];
          if (newArray[arrIndex] === undefined) {
            newArray[arrIndex] = isArrayIndex(nextPart) || isArrayWildcard(nextPart) ? [] : {};
          }
          
          newArray[arrIndex] = setValueRecursively(newArray[arrIndex], parts, value, index + 1);
        }
        
        return newArray;
      }
      // If obj is not an array but needs access by index, create an array
      else {
        const newArray = [];
        
        // Expand array to the desired size
        while (newArray.length <= arrIndex) {
          newArray.push(undefined);
        }
        
        // Set value or recursively continue setting
        if (isLast) {
          newArray[arrIndex] = value;
        } else {
          // Create object or array for the next part
          const nextPart = parts[index + 1];
          newArray[arrIndex] = isArrayIndex(nextPart) || isArrayWildcard(nextPart) ? [] : {};
          
          newArray[arrIndex] = setValueRecursively(newArray[arrIndex], parts, value, index + 1);
        }
        
        return newArray;
      }
    }
    // Regular object property
    else {
      // Create new object/array if the current object doesn't exist or isn't an object
      const newObj = (obj === null || typeof obj !== 'object') ? {} : { ...obj };
      
      if (isLast) {
        newObj[part] = value;
      } else {
        // If the next part doesn't exist, create an object or array
        const nextPart = parts[index + 1];
        if (newObj[part] === undefined) {
          newObj[part] = isArrayIndex(nextPart) || isArrayWildcard(nextPart) ? [] : {};
        }
        
        newObj[part] = setValueRecursively(newObj[part], parts, value, index + 1);
      }
      
      return newObj;
    }
  };
  
  // Call the recursive function to set the value
  return setValueRecursively(result, parts, value, 0);
}

/**
 * Creates a deep copy of an object
 * @param obj Object to copy
 * @returns Deep copy of the object
 */
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => deepClone(item)) as unknown as T;
  }

  const cloned = {} as Record<string, any>;
  
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      cloned[key] = deepClone((obj as Record<string, any>)[key]);
    }
  }
  
  return cloned as T;
} 