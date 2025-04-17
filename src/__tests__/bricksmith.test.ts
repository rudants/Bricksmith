import { bricksmith } from '../index';

describe('Bricksmith', () => {
  interface TestData {
    firstName: string;
    lastName: string;
    age: number;
    email: string;
    skills: string[];
  }

  const testData: TestData = {
    firstName: 'John',
    lastName: 'Smith',
    age: 30,
    email: 'john@example.com',
    skills: ['JavaScript', 'TypeScript', 'React']
  };

  describe('Bricksmith Initialization', () => {
    it('should create an instance', () => {
      const bs = bricksmith();
      expect(bs).toBeDefined();
    });
  })

  describe('Transformation Flow (basic use)', () => {
    it('should transform data using plugins', () => {
      const result = bricksmith<typeof testData>()
        .brick({
          source: 'firstName',
          transform: ({ sourceValue }) => {
            return `Hello, ${sourceValue}`;
          }
        })
        .build(testData);
      
      expect(result.data.firstName).toBe('Hello, John');
    });
  
    it('should correctly change data type during transformation', () => {
      const result = bricksmith<typeof testData>()
        .brick({
          source: 'firstName',
          transform: ({ sourceValue }) => {
            return sourceValue.length;
          }
        })
        .build(testData);
      
      expect(typeof result.data.firstName).toBe('number');
      expect(result.data.firstName).toBe(4);
    });

    it('should demonstrate sequential type transformations', () => {
      const result = bricksmith<typeof testData>()
        .brick({
          source: 'firstName',
          transform: ({ sourceValue }) => {
            // String -> Number
            return sourceValue.length;
          }
        })
        .brick({
          source: 'firstName',
          transform: ({ sourceValue }) => {
            // Number -> Number * 2
            return sourceValue * 2; 
          }
        })
        .build(testData);
      
      expect(typeof result.data.firstName).toBe('number');
      expect(result.data.firstName).toBe(8);
    });

    it('should support array processing', () => {
      const result = bricksmith<typeof testData>()
        .brick({
          source: 'skills',
          transform: ({ sourceValue }) => {
            return sourceValue.length;
          }
        })
        .build(testData)
      
      expect(typeof result.data.skills).toBe('number');
      expect(result.data.skills).toBe(3);
    });

    it('should support multiple transformations', () => {
      const data = {
        name: 'John Doe',
        email: 'john.DOE@example.com',
        age: '25'
      };

      const result = bricksmith<typeof data>()
        .brick({
          source: 'name',
          target: 'nameParts',
          transform: ({ sourceValue }) => sourceValue.split(' '),
          keepSource: true
        })
        .brick({
          source: 'nameParts',
          target: 'firstName',
          transform: ({ sourceValue }) => sourceValue[0],
          keepSource: true
        })
        .brick({
          source: 'nameParts',
          target: 'lastName',
          transform: ({ sourceValue }) => sourceValue[1],
          keepSource: true
        })
        .brick({
          source: 'email',
          target: 'emailNormalized',
          transform: ({ sourceValue }) => sourceValue.toLowerCase(),
          keepSource: true 
        })
        .brick({
          source: 'age',
          target: 'ageNumber',
          transform: ({ sourceValue }) => parseInt(sourceValue, 10),
          keepSource: true
        })
        .build(data);

      expect(result.data.firstName).toBe('John');
      expect(result.data.lastName).toBe('Doe');
      expect(result.data.emailNormalized).toBe('john.doe@example.com');
      expect(result.data.ageNumber).toBe(25);
      expect(typeof result.data.ageNumber).toBe('number');
    });
  })

  describe('source parameter workability', () => {
    it('should save value in the same path if target is not specified', () => {
      const result = bricksmith<typeof testData>()
        .brick({
          source: 'firstName',
          transform: ({ sourceValue }) => sourceValue.toUpperCase()
        })
        .build(testData);

      expect(result.data.firstName).toBe('JOHN');
    });

    it('should skip transformation for missing sources', () => {
      const testObject = {
        name: 'test'
      };

      const result = bricksmith()
        .brick({
          source: 'missingField',
          target: 'processedField',
          transform: ({ sourceValue }) => {
            return String(sourceValue);
          }
        })
        .build(testObject);

      expect(Object.keys(result.data)).not.toContain('processedField');
    });
  });

  describe('target parameter workability', () => {
    it('should move value from one path to another', () => {
      const result = bricksmith<typeof testData>()
        .brick({
          source: 'firstName',
          target: 'copiedName',
          transform: ({ sourceValue }) => sourceValue,
        })
        .build(testData);

      expect(result.data.copiedName).toBe('John');
      expect(Object.prototype.hasOwnProperty.call(result.data, 'firstName')).toBe(false);
    });

    it('should add new fields', () => {
      const result = bricksmith<typeof testData>()
        .brick({
          source: 'firstName',
          target: 'fullName',
          transform: ({ data }) => {
            return `${data.firstName} ${data.lastName}`;
          }
        })
        .build(testData);
      
      expect(result.data.fullName).toBe('John Smith');
    });
  })

  describe('transform parameter workability', () => {
    it('should correctly handle errors in transformation', () => {
      const testObject = {
        value: 'test'
      };

      const result = bricksmith()
        .brick({
          source: 'value',
          target: 'processedValue',
          transform: () => {
            throw new Error('Test error');
          }
        })
        .build(testObject);


      expect(Object.keys(result.data)).not.toContain('processedValue');
      expect(result.data.value).toBe('test');
    });
  })

  describe('keepSource parameter workability', () => {
    it('should copy value without removing the original', () => {
      const result = bricksmith<typeof testData>()
        .brick({
          source: 'firstName',
          target: 'copiedName',
          transform: ({ sourceValue }) => sourceValue,
          keepSource: true
        })
        .build(testData);

      expect(result.data.copiedName).toBe('John');
      expect((result.data as any).firstName).toBe('John');
    });
  })
  
  describe('transform context workability', () => {
    it('should correctly work with objects as field values', () => {
      const data = {
        person: {
          name: 'John',
          age: 30
        }
      };

      const result = bricksmith<typeof data>()
        .brick({
          source: 'person',
          target: 'transformedPerson',
          transform: ({ sourceValue }) => {
            const person = sourceValue;
            return {
              ...person,
              greet: `Hello, my name is ${person.name}!`
            };
          }
        })
        .build(data);

      expect(result.data.transformedPerson.name).toBe('John');
      expect(result.data.transformedPerson.age).toBe(30);
      expect(result.data.transformedPerson.greet).toBe('Hello, my name is John!');
    });

    it('should work with computed values based on multiple fields', () => {
      const userData = {
        personalInfo: {
          firstName: 'John',
          lastName: 'Smith',
          age: 35
        },
        work: {
          company: 'Horns and Hooves LLC',
          position: 'Developer',
          experience: 10
        }
      };

      const result = bricksmith<typeof userData>()
        .brick({
          source: 'personalInfo',
          target: 'summary',
          transform: ({ data }) => {
            const { personalInfo, work } = data;
            return `${personalInfo.firstName} ${personalInfo.lastName}, ${personalInfo.age} years old, ${work.position} at ${work.company} with ${work.experience} years of experience`;
          }
        })
        .build(userData);

      expect(result.data.summary).toBe('John Smith, 35 years old, Developer at Horns and Hooves LLC with 10 years of experience');
    });
  })

  describe('nested paths (objects) workability', () => {
    it('should move values from nested structures', () => {
      const nestedData = {
        user: {
          name: 'John',
          contacts: {
            email: 'john@example.com',
            phone: '123456789'
          }
        },
        meta: {
          created: '2023-01-01'
        }
      };

      const result = bricksmith<typeof nestedData>()
        .brick({
          source: 'user.contacts.email',
          target: 'user.emailNormalized',
          transform: ({ sourceValue }) => sourceValue.toLowerCase(),
        })
        .build(nestedData);

      expect(result.data.user.emailNormalized).toBe('john@example.com');
      expect(result.data.user.contacts.email).toBeUndefined();
    });

    it('should copy values from nested structures without removing', () => {
      const nestedData = {
        user: {
          name: 'John',
          contacts: {
            email: 'john@example.com',
            phone: '123456789'
          }
        },
        meta: {
          created: '2023-01-01'
        }
      };

      const result = bricksmith<typeof nestedData>()
        .brick({
          source: 'user.contacts.email',
          target: 'user.emailNormalized',
          transform: ({ sourceValue }) => sourceValue.toLowerCase(),
          keepSource: true
        })
        .build(nestedData);

      expect(result.data.user.emailNormalized).toBe('john@example.com');
      expect(result.data.user.contacts.email).toBe('john@example.com');
    });
  })

  describe('nested paths (arrays) workability', () => {
    const nestedData = {
      user: {
        profile: {
          firstName: 'John',
          lastName: 'Smith',
          contacts: {
            email: 'john@example.com',
            phone: '+7 123 456 78 90'
          }
        },
        settings: {
          theme: 'dark',
          notifications: {
            email: true,
            push: false
          }
        },
        posts: [
          { 
            id: 1, 
            title: 'First post',
            comments: [
              { id: 101, text: 'Comment 1' },
              { id: 102, text: 'Comment 2' }
            ] 
          },
          { 
            id: 2, 
            title: 'Second post',
            comments: [
              { id: 201, text: 'Comment 3' },
              { id: 202, text: 'Comment 4' }
            ] 
          }
        ]
      }
    };

    it('should copy array elements without removing', () => {
      const result = bricksmith<typeof testData>()
        .brick({
          source: 'skills.0',
          target: 'primarySkill',
          transform: ({ sourceValue }) => sourceValue,
          keepSource: true
        })
        .build(testData);

      expect(result.data.primarySkill).toBe('JavaScript');
      expect(Array.isArray(result.data.skills)).toBe(true);
      expect(result.data.skills.length).toBe(3);
      expect(result.data.skills[0]).toBe('JavaScript');
    });

    it('should support array processing', () => {
      const dataWithArray = {
        numbers: [10, 20, 30, 40, 50]
      };

      const resultCopy = bricksmith<typeof dataWithArray>()
        .brick({
          source: 'numbers.2',
          target: 'middleNumber',
          transform: ({ sourceValue }) => sourceValue,
          keepSource: true
        })
        .build(dataWithArray);

      // Check the result of copying
      expect(resultCopy.data.middleNumber).toBe(30);
      expect(resultCopy.data.numbers.length).toBe(5);
      expect(resultCopy.data.numbers[2]).toBe(30);
    });

    it('should get data from an array by index', () => {
      const result = bricksmith()
        .brick({
          source: 'user.posts[0]',
          target: 'user.firstPost',
          transform: ({ sourceValue }) => sourceValue,
          keepSource: true
        })
        .build(nestedData);

      expect(result.data.user.firstPost.id).toBe(1);
      expect(result.data.user.firstPost.title).toBe('First post');
    });

    it('should process deeply nested paths with arrays', () => {
      const result = bricksmith()
        .brick({
          source: 'user.posts[1].comments[0].text',
          target: 'user.firstCommentOfSecondPost',
          transform: ({ sourceValue }) => sourceValue,
          keepSource: true
        })
        .build(nestedData);

      expect(result.data.user.firstCommentOfSecondPost).toBe('Comment 3');
    });
    
    it('should count the number of comments in posts', () => {
      const result = bricksmith()
        .brick({
          source: 'user.posts[*].comments',
          target: 'user.commentCount',
          transform: ({ data }) => {
            let count = 0;
            data.user.posts.forEach((post: any) => {
              count += post.comments.length;
            });
            return count;
          }
        })
        .build(nestedData);

      expect(result.data.user.commentCount).toBe(4);
    });
    
    it('should extract all comment identifiers', () => {
      const result = bricksmith()
        .brick({
          source: 'user.posts[*].comments[*].id',
          target: 'user.commentIds',
          transform: ({ data }) => {
            const ids: number[] = [];
            data.user.posts.forEach((post: any) => {
              post.comments.forEach((comment: any) => {
                ids.push(comment.id);
              });
            });
            return ids;
          }
        })
        .build(nestedData);

      expect(result.data.user.commentIds).toEqual([101, 102, 201, 202]);
    });
    
    it('should apply transformation to results of previous transformations', () => {
      const result = bricksmith()
        .brick({
          source: 'user.posts[*].comments[*].id',
          target: 'user.commentIds',
          transform: ({ data }) => {
            const ids: number[] = [];
            data.user.posts.forEach((post: any) => {
              post.comments.forEach((comment: any) => {
                ids.push(comment.id);
              });
            });
            return ids;
          }
        })
        .brick({
          source: 'user.commentIds',
          target: 'user.commentIdsMap',
          transform: ({ sourceValue }) => 
            sourceValue.reduce((acc: Record<string, boolean>, id: number) => {
              acc[id] = true;
              return acc;
            }, {})
        })
        .build(nestedData);

      expect(result.data.user.commentIdsMap).toEqual({
        '101': true,
        '102': true,
        '201': true,
        '202': true
      });
    });
    
    it('should modify post titles', () => {
      const result = bricksmith()
        .brick({
          source: 'user.posts',
          transform: ({ data }) => {
            data.user.posts.forEach((post: any) => {
              post.title = post.title.toUpperCase();
            });
            return data.user.posts;
          }
        })
        .build(nestedData);

      expect(result.data.user.posts[0].title).toBe('FIRST POST');
      expect(result.data.user.posts[1].title).toBe('SECOND POST');
    });
    
    it('should create data structure based on nested paths', () => {
      const result = bricksmith()
        .brick({
          source: 'user.posts[*]',
          target: 'user.postsInfo',
          transform: ({ data }) => {
            return data.user.posts.map((post: any) => ({
              id: post.id,
              title: post.title,
              commentsCount: post.comments.length
            }));
          }
        })
        .build(nestedData);

      expect(result.data.user.postsInfo).toEqual([
        { id: 1, title: 'First post', commentsCount: 2 },
        { id: 2, title: 'Second post', commentsCount: 2 }
      ]);
    });
    
    it('should support chain transformations with data changes between steps', () => {
      const result = bricksmith()
        .brick({
          source: 'user.profile',
          target: 'userInfo.profile',
          transform: ({ sourceValue }) => ({
            name: `${sourceValue.firstName} ${sourceValue.lastName}`,
            contact: sourceValue.contacts.email
          })
        })
        .brick({
          source: 'user.posts',
          target: 'userInfo.postStats',
          transform: ({ sourceValue, data }) => ({
            totalPosts: sourceValue.length,
            totalComments: sourceValue.reduce((sum: number, post: any) => 
              sum + post.comments.length, 0),
            author: data.userInfo.profile.name
          })
        })
        .build(nestedData);

      expect(result.data.userInfo.profile.name).toBe('John Smith');
      expect(result.data.userInfo.profile.contact).toBe('john@example.com');
      expect(result.data.userInfo.postStats.totalPosts).toBe(2);
      expect(result.data.userInfo.postStats.totalComments).toBe(4);
      expect(result.data.userInfo.postStats.author).toBe('John Smith');
    });
  })

  describe('hooks parameter workability', () => {
    it('should transform catalog data with hooks for formatting prices and ratings', () => {
      const catalogData = {
        products: [
          {
            id: 1,
            name: 'Galaxy Pro Smartphone',
            price: 59990,
            reviews: [
              {score: 5, text: 'Excellent phone'},
              {score: 4, text: 'Good, but expensive'},
              {score: 5, text: 'Amazing camera!'}
            ],
            discount: 10
          },
          {
            id: 2,
            name: 'UltraBook Laptop',
            price: 89990,
            reviews: [
              {score: 5, text: 'Fast and lightweight'},
              {score: 5, text: 'Best purchase!'}
            ],
            discount: 5,
          }
        ]
      };

      const result = bricksmith<typeof catalogData>()
        .brick({
          source: 'products',
          transform: ({ sourceValue }) => {
            // Process all products at once
            const processedProducts = sourceValue.map(product => {
              const validDiscount = product.discount && (product.discount >= 0 && product.discount <= 90) 
                ? product.discount 
                : 0;
              const discountedPrice = product.price * (1 - validDiscount / 100);
              
              return {
                ...product,
                currency: '₽',
                finalPrice: `${discountedPrice.toFixed(0)} ₽`,
                discount: validDiscount
              };
            });
            
            return processedProducts.sort((a, b) => {
              const priceA = parseInt(a.finalPrice.replace(/[^\d]/g, ''), 10);
              const priceB = parseInt(b.finalPrice.replace(/[^\d]/g, ''), 10);
              return priceA - priceB;
            });
          }
        })
        .build(catalogData);
      
      expect(result.data.products.length).toBe(2);
      expect(result.data.products[0].id).toBe(1);
      expect(result.data.products[0].currency).toBe('₽');
      expect(result.data.products[0].finalPrice).toBe('53991 ₽');
      expect(result.data.products[1].id).toBe(2);
      expect(result.data.products[1].currency).toBe('₽');
      expect(result.data.products[1].finalPrice).toBe('85491 ₽');
    });

    it('should execute global hooks beforeBuild and afterBuild', () => {
      let beforeBuildCalled = false;
      let afterBuildCalled = false;

      const processor = bricksmith<typeof testData>({
        hooks: {
          beforeBuild: (data, _plugins) => {
            beforeBuildCalled = true;
            expect(_plugins.length).toBe(1);
            return data;
          },
          afterBuild: (data, _plugins) => {
            afterBuildCalled = true;
            expect(_plugins.length).toBe(1);
            return data;
          }
        }
      });

      // Apply plugin
      const result = processor
        .brick({
          source: 'firstName',
          transform: ({ sourceValue }) => sourceValue.toUpperCase()
        })
        .build(testData);

      expect(beforeBuildCalled).toBe(true);
      expect(afterBuildCalled).toBe(true);
      expect(result.data.firstName).toBe('JOHN');
    });

    it('should apply local hooks and global hooks in the correct order', () => {
      const order: string[] = [];

      const processor = bricksmith<typeof testData>({
        hooks: {
          beforeBuild: (data, _plugins) => {
            order.push('beforeBuild');
            return data;
          },
          afterBuild: (data, _plugins) => {
            order.push('afterBuild');
            return data;
          }
        }
      });

      const result = processor
        .brick({
          source: 'firstName',
          transform: ({ sourceValue }) => {
            order.push('transform');
            return sourceValue.toUpperCase();
          },
          hooks: {
            before: (context) => {
              order.push('localBefore');
              return context;
            },
            after: (context, result) => {
              order.push('localAfter');
              return result;
            }
          }
        })
        .build(testData);

      expect(order).toEqual([
        'beforeBuild',
        'localBefore',
        'transform',
        'localAfter',
        'afterBuild'
      ]);
      expect(result.data.firstName).toBe('JOHN');
    });

    it('should allow data modification using hooks beforeBuild and afterBuild', () => {
      const data = {
        name: 'John',
        age: 30
      };

      interface ExtendedData {
        name: string;
        age: number;
        prefix?: string;
        fullName?: string;
      }

      const processor = bricksmith<ExtendedData>({
        hooks: {
          beforeBuild(inputData: ExtendedData, _plugins: any) {
            return {
              ...inputData,
              prefix: 'Mr.'
            };
          },
          afterBuild(processedData: ExtendedData, _plugins: any) {
            return {
              ...processedData,
              fullName: `${processedData.prefix} ${processedData.name.toLowerCase()}`
            };
          }
        }
      });

      const result = processor
        .brick({
          source: 'name',
          transform: ({ sourceValue }) => sourceValue.toUpperCase()
        })
        .build(data);

      expect(result.data.name).toBe('JOHN');
      expect(result.data.prefix).toBe('Mr.');
      expect(result.data.fullName).toBe('Mr. john');
    });

    it('should support hooks beforeBuild and afterBuild', () => {
      const beforeBuildHooks: string[] = [];
      const afterBuildHooks: string[] = [];

      const processor = bricksmith<typeof testData>({
        hooks: {
          beforeBuild(inputData, _plugins) {
            beforeBuildHooks.push('beforeBuild');
            return inputData;
          },
          afterBuild(processedData, _plugins) {
            afterBuildHooks.push('afterBuild');
            return processedData;
          }
        }
      });

      const result = processor
        .brick({
          source: 'firstName',
          transform: ({ sourceValue }) => sourceValue.toUpperCase()
        })
        .build(testData);

      expect(beforeBuildHooks).toEqual(['beforeBuild']);
      expect(afterBuildHooks).toEqual(['afterBuild']);
      expect(result.data.firstName).toBe('JOHN');
    });
  });
}); 