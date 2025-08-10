import { Product, User, Order } from '../types';

// Mock Products Data
export const mockProducts: Product[] = [
  {
    id: '1',
    name: 'MacBook Pro 16-inch',
    description: 'Apple MacBook Pro with M2 Pro chip, 16-inch Liquid Retina XDR display, 16GB RAM, 512GB SSD storage.',
    price: 2499.00,
    category: 'Electronics',
    imageUrl: 'https://images.pexels.com/photos/205421/pexels-photo-205421.jpeg?auto=compress&cs=tinysrgb&w=800',
    inventory: 15,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '2',
    name: 'iPhone 15 Pro',
    description: 'Latest iPhone with A17 Pro chip, titanium design, and advanced camera system.',
    price: 999.00,
    category: 'Electronics',
    imageUrl: 'https://images.pexels.com/photos/699122/pexels-photo-699122.jpeg?auto=compress&cs=tinysrgb&w=800',
    inventory: 25,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '3',
    name: 'Sony WH-1000XM5 Headphones',
    description: 'Industry-leading noise canceling wireless headphones with premium sound quality.',
    price: 399.99,
    category: 'Electronics',
    imageUrl: 'https://images.pexels.com/photos/3394650/pexels-photo-3394650.jpeg?auto=compress&cs=tinysrgb&w=800',
    inventory: 30,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '4',
    name: 'Levi\'s 501 Original Jeans',
    description: 'Classic straight-leg jeans with authentic styling and premium denim.',
    price: 89.50,
    category: 'Clothing',
    imageUrl: 'https://images.pexels.com/photos/1598507/pexels-photo-1598507.jpeg?auto=compress&cs=tinysrgb&w=800',
    inventory: 50,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '5',
    name: 'Nike Air Max 270',
    description: 'Comfortable running shoes with Max Air cushioning and modern design.',
    price: 150.00,
    category: 'Clothing',
    imageUrl: 'https://images.pexels.com/photos/2529148/pexels-photo-2529148.jpeg?auto=compress&cs=tinysrgb&w=800',
    inventory: 40,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '6',
    name: 'The Great Gatsby',
    description: 'Classic American novel by F. Scott Fitzgerald, paperback edition.',
    price: 12.99,
    category: 'Books',
    imageUrl: 'https://images.pexels.com/photos/159866/books-book-pages-read-literature-159866.jpeg?auto=compress&cs=tinysrgb&w=800',
    inventory: 100,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '7',
    name: 'JavaScript: The Good Parts',
    description: 'Essential guide to JavaScript programming by Douglas Crockford.',
    price: 29.99,
    category: 'Books',
    imageUrl: 'https://images.pexels.com/photos/1181671/pexels-photo-1181671.jpeg?auto=compress&cs=tinysrgb&w=800',
    inventory: 75,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '8',
    name: 'Instant Pot Duo 7-in-1',
    description: 'Multi-functional electric pressure cooker, slow cooker, rice cooker, and more.',
    price: 79.95,
    category: 'Home & Garden',
    imageUrl: 'https://images.pexels.com/photos/4226769/pexels-photo-4226769.jpeg?auto=compress&cs=tinysrgb&w=800',
    inventory: 20,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '9',
    name: 'Dyson V15 Detect Vacuum',
    description: 'Cordless vacuum cleaner with laser dust detection and powerful suction.',
    price: 749.99,
    category: 'Home & Garden',
    imageUrl: 'https://images.pexels.com/photos/4239091/pexels-photo-4239091.jpeg?auto=compress&cs=tinysrgb&w=800',
    inventory: 12,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '10',
    name: 'Wilson Tennis Racket',
    description: 'Professional-grade tennis racket with carbon fiber frame.',
    price: 199.99,
    category: 'Sports',
    imageUrl: 'https://images.pexels.com/photos/209977/pexels-photo-209977.jpeg?auto=compress&cs=tinysrgb&w=800',
    inventory: 8,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '11',
    name: 'LEGO Creator Expert Set',
    description: 'Advanced LEGO building set for adults with detailed architecture model.',
    price: 249.99,
    category: 'Toys',
    imageUrl: 'https://images.pexels.com/photos/298825/pexels-photo-298825.jpeg?auto=compress&cs=tinysrgb&w=800',
    inventory: 5,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '12',
    name: 'Samsung 55" 4K Smart TV',
    description: 'Ultra HD Smart TV with HDR, built-in streaming apps, and voice control.',
    price: 699.99,
    category: 'Electronics',
    imageUrl: 'https://images.pexels.com/photos/1201996/pexels-photo-1201996.jpeg?auto=compress&cs=tinysrgb&w=800',
    inventory: 18,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
];

// Mock Users Data
export const mockUsers: User[] = [
  {
    id: 'user-1',
    email: 'customer@test.com',
    firstName: 'John',
    lastName: 'Doe',
    role: 'customer',
    address: {
      street: '123 Main St',
      city: 'New York',
      state: 'NY',
      zipCode: '10001',
    },
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'admin-1',
    email: 'admin@test.com',
    firstName: 'Admin',
    lastName: 'User',
    role: 'admin',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
];

// Mock Orders Data
export const mockOrders: Order[] = [
  {
    id: 'order-1',
    userId: 'user-1',
    items: [
      {
        productId: '1',
        productName: 'MacBook Pro 16-inch',
        price: 2499.00,
        quantity: 1,
      },
    ],
    totalAmount: 2499.00,
    status: 'delivered',
    shippingAddress: {
      street: '123 Main St',
      city: 'New York',
      state: 'NY',
      zipCode: '10001',
    },
    paymentInfo: {
      method: 'credit_card',
      cardLast4: '1234',
      cardBrand: 'Visa',
    },
    createdAt: '2024-01-15T10:30:00Z',
    updatedAt: '2024-01-20T16:00:00Z',
  },
  {
    id: 'order-2',
    userId: 'user-1',
    items: [
      {
        productId: '3',
        productName: 'Sony WH-1000XM5 Headphones',
        price: 399.99,
        quantity: 1,
      },
      {
        productId: '6',
        productName: 'The Great Gatsby',
        price: 12.99,
        quantity: 2,
      },
    ],
    totalAmount: 425.97,
    status: 'pending',
    shippingAddress: {
      street: '123 Main St',
      city: 'New York',
      state: 'NY',
      zipCode: '10001',
    },
    paymentInfo: {
      method: 'paypal',
    },
    createdAt: '2024-01-25T14:20:00Z',
    updatedAt: '2024-01-25T14:20:00Z',
  },
];

// Categories derived from products
export const mockCategories = [...new Set(mockProducts.map(p => p.category))];

// Helper functions for mock data
export const getMockProductById = (id: string): Product | undefined => {
  return mockProducts.find(product => product.id === id);
};

export const getMockProductsByCategory = (category: string): Product[] => {
  return mockProducts.filter(product => 
    product.category.toLowerCase() === category.toLowerCase()
  );
};

export const searchMockProducts = (query: string): Product[] => {
  const searchTerm = query.toLowerCase();
  return mockProducts.filter(product => 
    product.name.toLowerCase().includes(searchTerm) ||
    product.description.toLowerCase().includes(searchTerm) ||
    product.category.toLowerCase().includes(searchTerm)
  );
};

export const getMockUserById = (id: string): User | undefined => {
  return mockUsers.find(user => user.id === id);
};

export const getMockUserByEmail = (email: string): User | undefined => {
  return mockUsers.find(user => user.email.toLowerCase() === email.toLowerCase());
};

export const getMockOrdersByUserId = (userId: string): Order[] => {
  return mockOrders.filter(order => order.userId === userId);
};