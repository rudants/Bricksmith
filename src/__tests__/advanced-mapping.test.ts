import { Bricksmith } from '../bricksmith';
import type { Blueprint, Construction } from '../types';

interface User {
  id: number;
  name: string;
  email: string;
}

interface Source {
  users: User[];
  items: Array<{
    id: number;
    price: number;
    quantity: number;
  }>;
  customer: {
    id: number;
    name: string;
    type: string;
  };
  date: string;
  rawData?: {
    firstName: string;
    lastName: string;
    age: number;
  };
  firstName?: string;
  lastName?: string;
  age?: number;
  price?: number;
  quantity?: number;
  discount?: number;
  tax?: number;
}

interface Target {
  mappedUsers?: Array<{
    userId: number;
    userName: string;
    userEmail: string;
  }>;
  userNames?: string[];
  filteredUsers?: User[];
  totalAmount?: number;
  enrichedItems?: Array<{
    id: number;
    price: number;
    quantity: number;
    description: string;
    subtotal: number;
  }>;
  formattedDate?: string;
  baseAmount?: number;
  discountAmount?: number;
  subtotal?: number;
  taxAmount?: number;
  name?: string;
  surname?: string;
  years?: number;
  fullName?: string;
}

describe('Advanced mapping scenarios', () => {
  describe('Mapping arrays of objects', () => {
    test('should transform an array of objects', () => {
      const source: Source = {
        users: [
          { id: 1, name: 'John', email: 'john@example.com' },
          { id: 2, name: 'Maria', email: 'maria@example.com' },
          { id: 3, name: 'Alex', email: 'alex@example.com' }
        ],
        items: [],
        customer: { id: 0, name: '', type: '' },
        date: ''
      };
      
      const blueprint: Blueprint<Source, Target> = {
        bricks: [
          { 
            source: 'users', 
            target: 'mappedUsers',
            transform: (users) => users.map(user => ({ 
              userId: user.id,
              userName: user.name,
              userEmail: user.email 
            }))
          },
          { 
            source: 'users', 
            target: 'userNames',
            transform: (users) => users.map(user => user.name)
          },
          { 
            source: 'users', 
            target: 'filteredUsers',
            transform: (users) => users.filter(user => user.id > 1)
          }
        ]
      };

      const bricksmith = new Bricksmith<Source, Target>(blueprint);
      const result = bricksmith.build(source);
      
      expect(result.mappedUsers).toEqual([
        { userId: 1, userName: 'John', userEmail: 'john@example.com' },
        { userId: 2, userName: 'Maria', userEmail: 'maria@example.com' },
        { userId: 3, userName: 'Alex', userEmail: 'alex@example.com' }
      ]);
      expect(result.filteredUsers).toEqual([
        { id: 2, name: 'Maria', email: 'maria@example.com' },
        { id: 3, name: 'Alex', email: 'alex@example.com' }
      ]);
    });
  });
  
  describe('Mapping with transformation functions', () => {
    test('should support complex transformations', () => {
      const source: Source = {
        users: [],
        items: [
          { id: 1, price: 100, quantity: 2 },
          { id: 2, price: 150, quantity: 1 },
          { id: 3, price: 200, quantity: 3 }
        ],
        customer: {
          id: 123,
          name: 'John Smith',
          type: 'vip'
        },
        date: '2023-05-15'
      };
      
      const blueprint: Blueprint<Source, Target> = {
        bricks: [
          { 
            source: 'items',
            target: 'totalAmount',
            transform: (items) => items.reduce((sum, item) => sum + item.price * item.quantity, 0)
          },
          { 
            source: 'items',
            target: 'enrichedItems',
            transform: (items) => items.map(item => ({
              ...item,
              description: `Product #${item.id}`,
              subtotal: item.price * item.quantity
            }))
          },
          { 
            source: 'date',
            target: 'formattedDate',
            transform: (dateStr) => {
              const date = new Date(dateStr);
              return `${date.getDate().toString().padStart(2, '0')}.${(date.getMonth() + 1).toString().padStart(2, '0')}.${date.getFullYear()}`;
            }
          }
        ]
      };

      const bricksmith = new Bricksmith<Source, Target>(blueprint);
      const result = bricksmith.build(source);
      
      expect(result.totalAmount).toBe(950);
      expect(result.enrichedItems?.[0].subtotal).toBe(200);
      expect(result.enrichedItems?.[1].description).toBe('Product #2');
      expect(result.formattedDate).toBe('15.05.2023');
    });
  });
  
  describe('Mapping with calculated values', () => {
    test('should support complex calculations', () => {
      const source: Source = {
        users: [],
        items: [],
        customer: { id: 0, name: '', type: '' },
        date: '',
        price: 1000,
        quantity: 5,
        discount: 15,
        tax: 20
      };
      
      const blueprint: Blueprint<Source, Target> = {
        bricks: [
          { 
            source: 'price',
            target: 'baseAmount',
            transform: (price, src) => {
              if (!price || !src.quantity) return 0;
              return price * src.quantity;
            }
          },
          { 
            source: 'price',
            target: 'discountAmount',
            transform: (price, src) => {
              if (!price || !src.quantity || !src.discount) return 0;
              const baseAmount = price * src.quantity;
              return baseAmount * (src.discount / 100);
            }
          },
          { 
            source: 'price',
            target: 'subtotal',
            transform: (price, src) => {
              if (!price || !src.quantity || !src.discount) return 0;
              const baseAmount = price * src.quantity;
              const discountAmount = baseAmount * (src.discount / 100);
              return baseAmount - discountAmount;
            }
          },
          { 
            source: 'price',
            target: 'taxAmount',
            transform: (price, src) => {
              if (!price || !src.quantity || !src.discount || !src.tax) return 0;
              const baseAmount = price * src.quantity;
              const discountAmount = baseAmount * (src.discount / 100);
              const subtotal = baseAmount - discountAmount;
              return subtotal * (src.tax / 100);
            }
          },
          { 
            source: 'price',
            target: 'totalAmount',
            transform: (price, src) => {
              if (!price || !src.quantity || !src.discount || !src.tax) return 0;
              const baseAmount = price * src.quantity;
              const discountAmount = baseAmount * (src.discount / 100);
              const subtotal = baseAmount - discountAmount;
              const taxAmount = subtotal * (src.tax / 100);
              return subtotal + taxAmount;
            }
          }
        ]
      };

      const bricksmith = new Bricksmith<Source, Target>(blueprint);
      const result = bricksmith.build(source);
      
      expect(result.baseAmount).toBe(5000);
      expect(result.discountAmount).toBe(750);
      expect(result.subtotal).toBe(4250);
      expect(result.taxAmount).toBe(850);
      expect(result.totalAmount).toBe(5100);
    });
  });

  describe('Workspace tools', () => {
    test('should support workspace tools for preprocessing', () => {
      const source: Source = {
        users: [],
        items: [],
        customer: { id: 0, name: '', type: '' },
        date: '',
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
          beforeBuild: (source) => ({
            ...source,
            firstName: source.rawData?.firstName,
            lastName: source.rawData?.lastName,
            age: source.rawData?.age
          })
        }]
      };

      const bricksmith = new Bricksmith<Source, Target>(blueprint, construction);
      const result = bricksmith.build(source);

      expect(result.name).toBe('John');
      expect(result.surname).toBe('Smith');
      expect(result.years).toBe(30);
    });

    test('should support workspace tools for postprocessing', () => {
      const source: Source = {
        users: [],
        items: [],
        customer: { id: 0, name: '', type: '' },
        date: '',
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
      expect((result as Target & { fullName: string }).fullName).toBe('John Smith');
    });
  });
});