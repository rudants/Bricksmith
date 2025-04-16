import { Bricksmith } from '../bricksmith';
import type { Brick, Blueprint, Construction, BrickTool } from '../types';

interface Source {
  firstName: string;
  lastName: string;
  age: number;
  gender: string;
  fullName?: string;
  middleName?: string;
  value1?: null;
  value2?: string | undefined;
  contact: {
    email: string;
    phone: string;
  };
  address: {
    city: string;
    street: string;
    building: number;
    apartment: number;
  };
  contacts: Array<{
    type: string;
    value: string;
  }>;
  hobbies: string[];
}

interface Target {
  name?: string;
  surname?: string;
  years?: number;
  middleName?: string;
  firstName?: string;
  nameUpper?: string;
  nameLower?: string;
  isAdult?: boolean;
  timestamp?: string;
  fullName?: string;
  mainContact?: string;
  firstHobby?: string;
  mainEmail?: string;
  formattedContacts?: string[];
  formattedHobbies?: string;
  nullValue?: null;
  undefinedValue?: undefined;
  notNullValue?: string;
}

describe('Basic mapping functionality', () => {
  const source: Source = {
    firstName: 'John',
    lastName: 'Smith',
    age: 30,
    gender: 'male',
    contact: {
      email: 'john@example.com',
      phone: '+79991234567'
    },
    address: {
      city: 'London',
      street: 'Baker',
      building: 10,
      apartment: 5
    },
    contacts: [
      { type: 'email', value: 'john@example.com' },
      { type: 'phone', value: '+79991234567' }
    ],
    hobbies: ['sport', 'music', 'programming']
  };

  describe('Global hooks', () => {
    test('should apply beforeBuild hook', () => {
      const tool: BrickTool<Source, Target> = {
        name: 'preprocessor',
        beforeBuild: (materials) => ({
          ...materials,
          fullName: `${materials.firstName} ${materials.lastName}`
        })
      };

      const blueprint: Blueprint<Source, Target> = {
        bricks: [
          { source: 'fullName', target: 'name' }
        ]
      };

      const construction: Construction<Source, Target> = {
        tools: [tool]
      };

      const bricksmith = new Bricksmith<Source, Target>(blueprint, construction);
      const result = bricksmith.build(source);

      expect(result.name).toBe('John Smith');
    });

    test('should apply afterBuild hook', () => {
      const tool: BrickTool<Source, Target> = {
        name: 'postprocessor',
        afterBuild: (result) => {
          (result as Target & { timestamp: string }).timestamp = new Date().toISOString();
        }
      };

      const blueprint: Blueprint<Source, Target> = {
        bricks: [
          { source: 'firstName', target: 'name' }
        ]
      };

      const construction: Construction<Source, Target> = {
        tools: [tool]
      };

      const bricksmith = new Bricksmith<Source, Target>(blueprint, construction);
      const result = bricksmith.build(source);

      expect(result.name).toBe('John');
      expect((result as Target & { timestamp: string }).timestamp).toBeDefined();
    });
  });

  describe('Basic mapping', () => {
    test('should copy properties directly', () => {
      const blueprint: Blueprint<Source, Target> = {
        bricks: [
          { source: 'firstName', target: 'name' },
          { source: 'lastName', target: 'surname' },
          { source: 'age', target: 'years' }
        ]
      };

      const bricksmith = new Bricksmith<Source, Target>(blueprint);
      const result = bricksmith.build(source);

      expect(result.name).toBe('John');
      expect(result.surname).toBe('Smith');
      expect(result.years).toBe(30);
    });
  });

  describe('Default values', () => {
    test('should use fallback when source property is missing', () => {
      const blueprint: Blueprint<Source, Target> = {
        bricks: [
          { source: 'middleName', target: 'middleName', fallback: 'Unknown' },
          { source: 'firstName', target: 'firstName' }
        ]
      };

      const bricksmith = new Bricksmith<Source, Target>(blueprint);
      const result = bricksmith.build(source);

      expect(result.middleName).toBe('Unknown');
      expect(result.firstName).toBe('John');
    });
  });

  describe('Value transformation', () => {
    test('should apply transform function to values', () => {
      const blueprint: Blueprint<Source, Target> = {
        bricks: [
          {
            source: 'firstName',
            target: 'nameUpper',
            transform: (value: string) => value.toUpperCase()
          },
          {
            source: 'age',
            target: 'isAdult',
            transform: (value: number) => value >= 18
          }
        ]
      };

      const bricksmith = new Bricksmith<Source, Target>(blueprint);
      const result = bricksmith.build(source);

      expect(result.nameUpper).toBe('JOHN');
      expect(result.isAdult).toBe(true);
    });
  });

  describe('Conditional rules', () => {
    test('should apply brick only if condition is true', () => {
      const blueprint: Blueprint<Source, Target> = {
        bricks: [
          {
            source: 'firstName',
            target: 'nameUpper',
            transform: (value) => value.toUpperCase(),
            condition: (src) => src.age > 18
          },
          {
            source: 'firstName',
            target: 'nameLower',
            transform: (value) => value.toLowerCase(),
            condition: (src) => src.age < 18
          }
        ]
      };

      const bricksmith = new Bricksmith<Source, Target>(blueprint);
      const result = bricksmith.build(source);

      expect(result.nameUpper).toBe('JOHN');
      expect(result.nameLower).toBeUndefined();
    });
  });

  describe('Complex mapping', () => {
    test('should support multiple bricks and transformations', () => {
      const blueprint: Blueprint<Source, Target> = {
        bricks: [
          {
            source: 'firstName',
            target: 'fullName',
            transform: (value, src) => `${value} ${src.lastName}`
          },
          {
            source: 'age',
            target: 'isAdult',
            transform: (value) => value >= 18
          },
          {
            source: 'contact',
            target: 'mainContact',
            transform: (contact) => contact.email
          }
        ]
      };

      const bricksmith = new Bricksmith<Source, Target>(blueprint);
      const result = bricksmith.build(source);

      expect(result.fullName).toBe('John Smith');
      expect(result.isAdult).toBe(true);
      expect(result.mainContact).toBe('john@example.com');
    });

    test('should support array access and transformations', () => {
      const blueprint: Blueprint<Source, Target> = {
        bricks: [
          {
            source: 'hobbies',
            target: 'firstHobby',
            transform: (hobbies) => hobbies?.[0]
          },
          {
            source: 'contacts',
            target: 'mainEmail',
            transform: (contacts) => {
              const emailContact = contacts?.find(c => c.type === 'email');
              return emailContact ? emailContact.value : undefined;
            }
          }
        ]
      };

      const bricksmith = new Bricksmith<Source, Target>(blueprint);
      const result = bricksmith.build(source);

      expect(result.firstHobby).toBe('sport');
      expect(result.mainEmail).toBe('john@example.com');
    });
  });

  describe('Array of objects processing', () => {
    test('should transform arrays of objects correctly', () => {
      const blueprint: Blueprint<Source, Target> = {
        bricks: [
          {
            source: 'contacts',
            target: 'formattedContacts',
            transform: (contacts) =>
              contacts.map(c => `${c.type}: ${c.value}`) || []
          },
          {
            source: 'hobbies',
            target: 'formattedHobbies',
            transform: (hobbies) => hobbies.join(', ') || ''
          }
        ]
      };

      const bricksmith = new Bricksmith<Source, Target>(blueprint);
      const result = bricksmith.build(source);

      expect(result.formattedContacts).toEqual([
        'email: john@example.com',
        'phone: +79991234567'
      ]);
      expect(result.formattedHobbies).toBe('sport, music, programming');
    });
  });

  describe('Construction options', () => {
    describe('Option strict = true', () => {
      test('should preserve null and undefined when strict = true', () => {
        const nullSource: Source = {
          firstName: 'John',
          lastName: 'Smith',
          age: 30,
          gender: 'male',
          value1: null,
          value2: undefined,
          contact: {
            email: 'john@example.com',
            phone: '+79991234567'
          },
          address: {
            city: 'London',
            street: 'Baker',
            building: 10,
            apartment: 5
          },
          contacts: [
            { type: 'email', value: 'john@example.com' },
            { type: 'phone', value: '+79991234567' }
          ],
          hobbies: ['sport', 'music', 'programming']
        };

        const blueprint: Blueprint<Source, Target> = {
          bricks: [
            { source: 'value1', target: 'nullValue' },
            { source: 'value2', target: 'undefinedValue' }
          ]
        };

        const construction: Construction<Source, Target> = {
          strict: true
        };

        const bricksmith = new Bricksmith<Source, Target>(blueprint, construction);
        const result = bricksmith.build(nullSource);

        expect(result.nullValue).toBeNull();
        expect(result.undefinedValue).toBeUndefined();
      });
    });

    describe('Option skipEmpty = true', () => {
      test('should skip empty values when skipEmpty is true', () => {
        const nullSource: Source = {
          firstName: 'John',
          lastName: 'Smith',
          age: 30,
          gender: 'male',
          value1: null,
          value2: 'notNull',
          contact: {
            email: 'john@example.com',
            phone: '+79991234567'
          },
          address: {
            city: 'London',
            street: 'Baker',
            building: 10,
            apartment: 5
          },
          contacts: [
            { type: 'email', value: 'john@example.com' },
            { type: 'phone', value: '+79991234567' }
          ],
          hobbies: ['sport', 'music', 'programming']
        };

        const blueprint: Blueprint<Source, Target> = {
          bricks: [
            { source: 'value1', target: 'nullValue' },
            { source: 'value2', target: 'notNullValue' }
          ]
        };

        const construction: Construction<Source, Target> = {
          skipNull: true,
          skipUndefined: true
        };

        const bricksmith = new Bricksmith<Source, Target>(blueprint, construction);
        const result = bricksmith.build(nullSource);

        expect(result.nullValue).toBeUndefined();
        expect(result.notNullValue).toBe('notNull');
      });
    });
  });
});