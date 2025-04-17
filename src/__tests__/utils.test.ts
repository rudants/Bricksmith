import { getValueByPath, setValueByPath, deepClone, parsePath } from '../utils';

describe('Utils', () => {
  describe('getValueByPath', () => {
    const testObj = {
      name: 'John',
      user: { firstName: 'Ivan', age: 30 },
      items: ['one', 'two', 'three'],
      'complex.key': 'value with dots'
    };

    it('should get value by simple key', () => {
      expect(getValueByPath(testObj, 'name')).toBe('John');
    });

    it('should return undefined for non-existent key', () => {
      expect(getValueByPath(testObj, 'nonexistent')).toBeUndefined();
    });

    it('should work with keys containing escaped dots', () => {
      const obj = { 'complex.key': 'value with dots' };
      expect(getValueByPath(obj, 'complex.key')).toBe('value with dots');
    });

    it('should return undefined for null or undefined object', () => {
      expect(getValueByPath(null, 'name')).toBeUndefined();
      expect(getValueByPath(undefined, 'name')).toBeUndefined();
    });

    it('should process nested paths through dot notation', () => {
      expect(getValueByPath(testObj, 'user.firstName')).toBe('Ivan');
    });

    it('should return undefined for non-existent nested paths', () => {
      expect(getValueByPath(testObj, 'user.lastName')).toBeUndefined();
      expect(getValueByPath(testObj, 'nonexistent.property')).toBeUndefined();
    });

    it('should correctly work with arrays by index', () => {
      expect(getValueByPath(testObj, 'items.0')).toBe('one');
      expect(getValueByPath(testObj, 'items.1')).toBe('two');
    });
  });

  describe('setValueByPath', () => {
    const testObj = {
      name: 'John',
      user: { firstName: 'Ivan', age: 30 },
      items: ['one', 'two', 'three']
    };

    it('should set value by simple key', () => {
      const result = setValueByPath(testObj, 'name', 'Peter');

      expect(result.name).toBe('Peter');
      expect(testObj.name).toBe('John');
    });

    it('should create a new key if it does not exist', () => {
      const result = setValueByPath(testObj, 'newKey', 'newValue');

      expect(result.newKey).toBe('newValue');
      expect((testObj as any).newKey).toBeUndefined();
    });

    it('should preserve keys with special characters as is if they are escaped', () => {
      const testObj = { name: 'Test' };
      const result = setValueByPath(testObj, 'key\\.with\\.dots', 'value');

      expect(result['key.with.dots']).toBe('value');
    });

    it('should create nested objects for paths with dots', () => {
      const testObj = { name: 'Test' };
      const result = setValueByPath(testObj, 'key.with.dots', 'value');

      expect(result.key.with.dots).toBe('value');
    });

    it('should process nested paths through dot notation', () => {
      const result = setValueByPath(testObj, 'user.firstName', 'Peter');

      expect(result.user.firstName).toBe('Peter');
      expect(testObj.user.firstName).toBe('Ivan');
    });

    it('should create nested objects for non-existent paths', () => {
      const result = setValueByPath(testObj, 'user.contact.email', 'test@example.com');

      expect(result.user.contact.email).toBe('test@example.com');
      expect(typeof result.user.contact).toBe('object');
    });

    it('should correctly work with arrays by index', () => {
      const result = setValueByPath(testObj, 'items.0', 'new');

      expect(result.items[0]).toBe('new');
      expect(testObj.items[0]).toBe('one');
    });
  });

  describe('deepClone', () => {
    it('should create a deep copy of an object', () => {
      const original = {
        name: 'John',
        user: { firstName: 'Ivan', age: 30 },
        items: ['one', 'two', 'three']
      };
      
      const clone = deepClone(original);
      
      clone.name = 'Peter';
      clone.user.firstName = 'Alex';
      clone.items[0] = 'new';
      
      expect(original.name).toBe('John');
      expect(original.user.firstName).toBe('Ivan');
      expect(original.items[0]).toBe('one');
      expect(clone.name).toBe('Peter');
      expect(clone.user.firstName).toBe('Alex');
      expect(clone.items[0]).toBe('new');
    });
  });

  describe('parsePath', () => {
    it('should correctly split a simple path', () => {
      expect(parsePath('user.name')).toEqual(['user', 'name']);
    });

    it('should correctly split a path with array indices', () => {
      expect(parsePath('users[0].name')).toEqual(['users', '[0]', 'name']);
    });

    it('should correctly split a path with wildcards', () => {
      expect(parsePath('users[*].name')).toEqual(['users', '[*]', 'name']);
    });

    it('should handle escaped dots', () => {
      expect(parsePath('user\\.name')).toEqual(['user.name']);
    });

    it('should correctly split complex paths', () => {
      expect(parsePath('users[0].posts[*].comments[2].text')).toEqual(
        ['users', '[0]', 'posts', '[*]', 'comments', '[2]', 'text']
      );
    });
  });

  describe('getValueByPath with nested paths', () => {
    const complexObj = {
      users: [
        {
          id: 1,
          name: 'User 1',
          posts: [
            { id: 101, title: 'Post 1', comments: [
              { id: 1001, text: 'Comment 1-1' },
              { id: 1002, text: 'Comment 1-2' }
            ]},
            { id: 102, title: 'Post 2', comments: [
              { id: 1003, text: 'Comment 2-1' },
              { id: 1004, text: 'Comment 2-2' }
            ]}
          ]
        },
        {
          id: 2,
          name: 'User 2',
          posts: [
            { id: 201, title: 'Post 3', comments: [
              { id: 2001, text: 'Comment 3-1' },
              { id: 2002, text: 'Comment 3-2' }
            ]}
          ]
        }
      ],
      settings: {
        theme: {
          colors: {
            primary: '#000',
            secondary: '#fff'
          },
          fonts: ['Arial', 'Helvetica']
        }
      }
    };

    it('should get value by specific index in an array', () => {
      expect(getValueByPath(complexObj, 'users[0].name')).toBe('User 1');
      expect(getValueByPath(complexObj, 'users[1].name')).toBe('User 2');
    });

    it('should get value from a nested array by index', () => {
      expect(getValueByPath(complexObj, 'users[0].posts[1].title')).toBe('Post 2');
      expect(getValueByPath(complexObj, 'users[1].posts[0].comments[0].text')).toBe('Comment 3-1');
    });

    it('should get value by deeply nested path', () => {
      expect(getValueByPath(complexObj, 'settings.theme.colors.primary')).toBe('#000');
      expect(getValueByPath(complexObj, 'settings.theme.fonts[1]')).toBe('Helvetica');
    });

    it('should correctly handle wildcard selectors for arrays', () => {
      const userPosts = getValueByPath(complexObj, 'users[0].posts[*]');
      expect(Array.isArray(userPosts)).toBe(true);
      expect(userPosts.length).toBe(2);
      expect(userPosts[0].id).toBe(101);
      expect(userPosts[1].id).toBe(102);
    });

    it('should correctly handle nested wildcard selectors', () => {
      const commentsIds = getValueByPath(complexObj, 'users[*].posts[*].comments[*].id');
      expect(Array.isArray(commentsIds)).toBe(true);

      const expectedIds = [1001, 1002, 1003, 1004, 2001, 2002];
      const flattenedIds = commentsIds.flat(3).filter((id: any) => typeof id === 'number');
      expectedIds.forEach(id => {
        expect(flattenedIds.includes(id)).toBe(true);
      });
    });

    it('should return undefined for non-existent paths with wildcard', () => {
      expect(getValueByPath(complexObj, 'nonexistent[*].key')).toBeUndefined();
    });
  });

  describe('setValueByPath with nested paths', () => {
    const complexObj = {
      users: [
        {
          id: 1,
          name: 'User 1',
          posts: [
            { id: 101, title: 'Post 1', tags: ['tag1', 'tag2'] }
          ]
        },
        {
          id: 2,
          name: 'User 2',
          posts: []
        }
      ],
      settings: {
        theme: 'light'
      }
    };

    it('should set value by specific index in an array', () => {
      const result = setValueByPath(complexObj, 'users[0].name', 'Updated User 1');

      expect(result.users[0].name).toBe('Updated User 1');
      expect(complexObj.users[0].name).toBe('User 1');
    });

    it('should set value in a nested array by index', () => {
      const result = setValueByPath(complexObj, 'users[0].posts[0].title', 'Updated Post 1');

      expect(result.users[0].posts[0].title).toBe('Updated Post 1');
      expect(complexObj.users[0].posts[0].title).toBe('Post 1');
    });

    it('should create nested structures when they are missing', () => {
      const result = setValueByPath(complexObj, 'users[1].posts[0].title', 'New Post');

      expect(result.users[1].posts[0].title).toBe('New Post');
      expect(complexObj.users[1].posts.length).toBe(0);
    });

    it('should set value by deeply nested path', () => {
      const result = setValueByPath(complexObj, 'settings.theme.colors.primary', '#000');

      expect(result.settings.theme.colors.primary).toBe('#000');
      expect(typeof complexObj.settings.theme).toBe('string');
    });

    it('should handle wildcard selectors for arrays', () => {
      const result = setValueByPath(complexObj, 'users[*].verified', true);

      expect(result.users[0].verified).toBe(true);
      expect(result.users[1].verified).toBe(true);
      expect((complexObj.users[0] as any).verified).toBeUndefined();
    });

    it('should handle nested wildcard selectors', () => {
      const result = setValueByPath(complexObj, 'users[*].posts[*].featured', true);
      
      expect(result.users[0].posts[0].featured).toBe(true);
      expect(result.users[1].posts.length).toBe(0);
    });

    it('should handle arrays with different nesting levels', () => {
      const result = setValueByPath(complexObj, 'users[0].posts[0].tags[2]', 'tag3');

      expect(result.users[0].posts[0].tags).toEqual(['tag1', 'tag2', 'tag3']);
      expect(complexObj.users[0].posts[0].tags).toEqual(['tag1', 'tag2']);
    });
  });

  describe('getValueByPath with complex nested paths', () => {
    const deeplyNestedObj = {
      shop: {
        departments: [
          {
            name: 'Electronics',
            categories: [
              {
                name: 'Computers',
                products: [
                  { id: 101, name: 'Laptop', price: 1200, tags: ['sale', 'new'] },
                  { id: 102, name: 'Desktop', price: 1500, tags: ['popular'] }
                ]
              },
              {
                name: 'Phones',
                products: [
                  { id: 201, name: 'Smartphone', price: 800, tags: ['sale'] },
                  { id: 202, name: 'Tablet', price: 600, tags: ['new', 'popular'] }
                ]
              }
            ]
          },
          {
            name: 'Clothing',
            categories: [
              {
                name: 'Men',
                products: [
                  { id: 301, name: 'Shirt', price: 50, tags: ['popular'] },
                  { id: 302, name: 'Pants', price: 70, tags: ['sale'] }
                ]
              },
              {
                name: 'Women',
                products: [
                  { id: 401, name: 'Dress', price: 90, tags: ['new'] },
                  { id: 402, name: 'Skirt', price: 60, tags: ['sale', 'popular'] }
                ]
              }
            ]
          }
        ]
      }
    };

    it('should get values from triple nested wildcards', () => {
      const productNames = getValueByPath(deeplyNestedObj, 'shop.departments[*].categories[*].products[*].name');
      expect(Array.isArray(productNames)).toBe(true);
      
      const flattenedNames: string[] = [];
      const flatten = (arr: any): void => {
        arr.forEach((item: any) => {
          if (Array.isArray(item)) {
            flatten(item);
          } else if (typeof item === 'string') {
            flattenedNames.push(item);
          }
        });
      };
      flatten(productNames);

      expect(flattenedNames).toContain('Laptop');
      expect(flattenedNames).toContain('Desktop');
      expect(flattenedNames).toContain('Smartphone');
      expect(flattenedNames).toContain('Tablet');
      expect(flattenedNames).toContain('Shirt');
      expect(flattenedNames).toContain('Pants');
      expect(flattenedNames).toContain('Dress');
      expect(flattenedNames).toContain('Skirt');
      expect(flattenedNames.length).toBe(8);
    });
    
    it('should get values with a combination of specific indices and wildcards', () => {
      const firstDeptProducts = getValueByPath(deeplyNestedObj, 'shop.departments[0].categories[*].products[*].name');
      const names: string[] = [];
      const flatten = (arr: any): void => {
        arr.forEach((item: any) => {
          if (Array.isArray(item)) {
            flatten(item);
          } else if (typeof item === 'string') {
            names.push(item);
          }
        });
      };
      flatten(firstDeptProducts);
      
      expect(names).toContain('Laptop');
      expect(names).toContain('Desktop');
      expect(names).toContain('Smartphone');
      expect(names).toContain('Tablet');
      expect(names).not.toContain('Shirt'); // No clothing
      expect(names.length).toBe(4);
    });
    
    it('should get data by specific path after wildcards', () => {
      const productsWithSaleTag = getValueByPath(deeplyNestedObj, 'shop.departments[*].categories[*].products[*]');
      const products: any[] = [];
      const flatten = (arr: any): void => {
        arr.forEach((item: any) => {
          if (Array.isArray(item)) {
            flatten(item);
          } else if (item && typeof item === 'object') {
            products.push(item);
          }
        });
      };
      flatten(productsWithSaleTag);
      
      const saleProducts = products.filter(product => 
        product.tags && product.tags.includes('sale')
      );
      
      expect(saleProducts.length).toBe(4);
      expect(saleProducts.some(p => p.id === 101)).toBe(true); // Laptop
      expect(saleProducts.some(p => p.id === 201)).toBe(true); // Smartphone
      expect(saleProducts.some(p => p.id === 302)).toBe(true); // Pants
      expect(saleProducts.some(p => p.id === 402)).toBe(true); // Skirt
    });
  });

  describe('setValueByPath with complex nested paths', () => {
    const deeplyNestedObj = {
      shop: {
        departments: [
          {
            name: 'Electronics',
            categories: [
              {
                name: 'Computers',
                products: [
                  { id: 101, name: 'Laptop', price: 1200 },
                  { id: 102, name: 'Desktop', price: 1500 }
                ]
              }
            ]
          },
          {
            name: 'Clothing',
            categories: [
              {
                name: 'Men',
                products: [
                  { id: 301, name: 'Shirt', price: 50 }
                ]
              }
            ]
          }
        ]
      }
    };
    
    it('should set values in deeply nested structures with wildcards', () => {
      const result = setValueByPath(deeplyNestedObj, 'shop.departments[*].categories[*].products[*].discount', 10);
      
      const electronics = result.shop.departments[0];
      const clothing = result.shop.departments[1];
      
      expect(electronics.categories[0].products[0].discount).toBe(10);
      expect(electronics.categories[0].products[1].discount).toBe(10);
      expect(clothing.categories[0].products[0].discount).toBe(10);
      
      expect((deeplyNestedObj.shop.departments[0].categories[0].products[0] as any).discount).toBeUndefined();
    });
    
    it('should set values at specific indices after wildcards', () => {
      const result = setValueByPath(deeplyNestedObj, 'shop.departments[*].categories[*].products[0].featured', true);
      
      const electronics = result.shop.departments[0];
      const clothing = result.shop.departments[1];
      
      expect(electronics.categories[0].products[0].featured).toBe(true);
      expect((electronics.categories[0].products[1] as any).featured).toBeUndefined();
      expect(clothing.categories[0].products[0].featured).toBe(true);
      expect((deeplyNestedObj.shop.departments[0].categories[0].products[0] as any).featured).toBeUndefined();
    });
    
    it('should create nested structures when setting values in new paths', () => {
      const result = setValueByPath(deeplyNestedObj, 'shop.departments[*].categories[*].products[*].shipping.info', 'Free shipping');
      const product = result.shop.departments[0].categories[0].products[0];
      
      expect(product.shipping).toBeDefined();
      expect(product.shipping.info).toBe('Free shipping');
      expect((deeplyNestedObj.shop.departments[0].categories[0].products[0] as any).shipping).toBeUndefined();
    });
    
    it('should handle cases with empty arrays for wildcards', () => {
      const objWithEmptyArray = {
        departments: [
          {
            name: 'Test',
            products: []
          }
        ]
      };
      
      const result = setValueByPath(objWithEmptyArray, 'departments[*].products[*].price', 100);
      
      expect(result.departments[0].products).toEqual([]);
    });
  });
}); 