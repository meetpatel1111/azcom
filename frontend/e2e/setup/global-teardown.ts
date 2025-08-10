import { chromium, FullConfig } from '@playwright/test';
import { testUsers } from '../fixtures/test-data';

async function globalTeardown(config: FullConfig) {
  console.log('Cleaning up test environment...');
  
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // Login as admin to clean up test data
    const loginResponse = await page.request.post('http://localhost:3001/api/auth/login', {
      data: {
        email: testUsers.admin.email,
        password: testUsers.admin.password
      },
      timeout: 10000
    });
    
    if (loginResponse.ok()) {
      const loginData = await loginResponse.json();
      const token = loginData.token;

      // Clean up test products (optional - depends on your cleanup strategy)
      try {
        const productsResponse = await page.request.get('http://localhost:3001/api/products', {
          headers: {
            'Authorization': `Bearer ${token}`
          },
          timeout: 10000
        });
        
        if (productsResponse.ok()) {
          const products = await productsResponse.json();
          
          // Delete test products (those with "Test" in the name)
          for (const product of products) {
            if (product.name.includes('Test')) {
              try {
                await page.request.delete(`http://localhost:3001/api/products/${product.id}`, {
                  headers: {
                    'Authorization': `Bearer ${token}`
                  },
                  timeout: 5000
                });
                console.log(`Cleaned up test product: ${product.name}`);
              } catch (error) {
                console.log(`Failed to cleanup product ${product.name}:`, error.message);
              }
            }
          }
        }
      } catch (error) {
        console.log('Error cleaning up test products:', error.message);
      }
    } else {
      console.log('Admin login failed during cleanup, skipping product cleanup');
    }
    
    console.log('Test environment cleanup complete');
  } catch (error) {
    console.log('Cleanup failed but continuing:', error.message);
  } finally {
    await browser.close();
  }
}

export default globalTeardown;