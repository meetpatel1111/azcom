import { chromium, FullConfig } from '@playwright/test';
import { testUsers, testProducts } from '../fixtures/test-data';

async function globalSetup(config: FullConfig) {
  console.log('Setting up test environment...');
  
  // Launch browser for setup
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // Wait for backend to be ready with retries
    let retries = 5;
    while (retries > 0) {
      try {
        await page.goto('http://localhost:3001/api/health', { waitUntil: 'networkidle', timeout: 10000 });
        console.log('Backend is ready');
        break;
      } catch (error) {
        retries--;
        if (retries === 0) throw error;
        console.log(`Backend not ready, retrying... (${retries} attempts left)`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    // Setup test data via API calls with error handling
    try {
      await setupTestUsers(page);
      await setupTestProducts(page);
      console.log('Test data setup complete');
    } catch (error) {
      console.log('Test data setup failed, but continuing with tests:', error.message);
      // Don't throw error here - tests can still run with existing data
    }
    
  } catch (error) {
    console.error('Failed to setup test environment:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

async function setupTestUsers(page: any) {
  // Create test customer user
  try {
    const response = await page.request.post('http://localhost:3001/api/auth/register', {
      data: {
        email: testUsers.customer.email,
        password: testUsers.customer.password,
        firstName: testUsers.customer.firstName,
        lastName: testUsers.customer.lastName,
        address: testUsers.customer.address
      },
      timeout: 10000
    });
    if (response.ok()) {
      console.log('Test customer user created');
    } else {
      console.log('Test customer user may already exist or validation failed');
    }
  } catch (error) {
    console.log('Test customer user setup failed:', error.message);
  }

  // Create test admin user
  try {
    const response = await page.request.post('http://localhost:3001/api/auth/register', {
      data: {
        email: testUsers.admin.email,
        password: testUsers.admin.password,
        firstName: testUsers.admin.firstName,
        lastName: testUsers.admin.lastName,
        role: testUsers.admin.role
      },
      timeout: 10000
    });
    if (response.ok()) {
      console.log('Test admin user created');
    } else {
      console.log('Test admin user may already exist or validation failed');
    }
  } catch (error) {
    console.log('Test admin user setup failed:', error.message);
  }
}

async function setupTestProducts(page: any) {
  try {
    // Login as admin to create products
    const loginResponse = await page.request.post('http://localhost:3001/api/auth/login', {
      data: {
        email: testUsers.admin.email,
        password: testUsers.admin.password
      },
      timeout: 10000
    });
    
    if (!loginResponse.ok()) {
      console.log('Admin login failed, skipping product setup');
      return;
    }
    
    const loginData = await loginResponse.json();
    const token = loginData.token;

    // Create test products
    const products = [testProducts.laptop, testProducts.book, testProducts.clothing];
    
    for (const product of products) {
      try {
        const response = await page.request.post('http://localhost:3001/api/products', {
          data: product,
          headers: {
            'Authorization': `Bearer ${token}`
          },
          timeout: 10000
        });
        if (response.ok()) {
          console.log(`Test product "${product.name}" created`);
        } else {
          console.log(`Test product "${product.name}" creation failed or already exists`);
        }
      } catch (error) {
        console.log(`Test product "${product.name}" setup failed:`, error.message);
      }
    }
  } catch (error) {
    console.log('Product setup failed:', error.message);
  }
}

export default globalSetup;