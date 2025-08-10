// Test data fixtures for E2E tests

export const testUsers = {
  customer: {
    email: 'customer@test.com',
    password: 'Password123',
    firstName: 'John',
    lastName: 'Doe',
    address: {
      street: '123 Test St',
      city: 'Test City',
      state: 'TS',
      zipCode: '12345'
    }
  },
  admin: {
    email: 'admin@test.com',
    password: 'AdminPass123',
    firstName: 'Admin',
    lastName: 'User',
    role: 'admin'
  },
  newCustomer: {
    email: 'newcustomer@test.com',
    password: 'NewPass123',
    firstName: 'Jane',
    lastName: 'Smith',
    address: {
      street: '456 New St',
      city: 'New City',
      state: 'NS',
      zipCode: '67890'
    }
  }
};

export const testProducts = {
  laptop: {
    name: 'Test Laptop',
    description: 'High-performance laptop for testing',
    price: 999.99,
    category: 'Electronics',
    inventory: 10
  },
  book: {
    name: 'Test Book',
    description: 'Educational book for testing',
    price: 29.99,
    category: 'Books',
    inventory: 5
  },
  clothing: {
    name: 'Test T-Shirt',
    description: 'Comfortable cotton t-shirt',
    price: 19.99,
    category: 'Clothing',
    inventory: 20
  }
};

export const testOrder = {
  shippingAddress: {
    street: '789 Order St',
    city: 'Order City',
    state: 'OS',
    zipCode: '54321'
  },
  paymentInfo: {
    cardNumber: '4111111111111111',
    expiryDate: '12/25',
    cvv: '123',
    cardholderName: 'John Doe'
  }
};