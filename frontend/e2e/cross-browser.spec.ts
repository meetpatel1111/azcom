import { test, expect, devices } from '@playwright/test';
import { TestHelpers } from './utils/test-helpers';
import { testUsers, testProducts } from './fixtures/test-data';

test.describe('Cross-Browser Compatibility Tests', () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
  });

  // Test core functionality across different browsers
  ['chromium', 'firefox', 'webkit'].forEach(browserName => {
    test.describe(`${browserName} browser tests`, () => {
      test(`basic shopping flow works in ${browserName}`, async ({ page, browserName: currentBrowser }) => {
        test.skip(currentBrowser !== browserName, `Skipping ${browserName} test in ${currentBrowser}`);
        
        // Basic product browsing
        await page.goto('/');
        await expect(page.locator('[data-testid="product-list"]')).toBeVisible();
        
        // Add product to cart
        await helpers.addProductToCart(testProducts.laptop.name);
        
        // Verify cart functionality
        await helpers.openCart();
        await helpers.expectProductInCart(testProducts.laptop.name, 1);
        
        // Login functionality
        await helpers.loginAsCustomer();
        await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
      });

      test(`responsive design works in ${browserName}`, async ({ page, browserName: currentBrowser }) => {
        test.skip(currentBrowser !== browserName, `Skipping ${browserName} test in ${currentBrowser}`);
        
        // Test desktop view
        await page.setViewportSize({ width: 1920, height: 1080 });
        await page.goto('/');
        await expect(page.locator('[data-testid="desktop-nav"]')).toBeVisible();
        
        // Test tablet view
        await page.setViewportSize({ width: 768, height: 1024 });
        await page.reload();
        await expect(page.locator('[data-testid="mobile-nav-toggle"]')).toBeVisible();
        
        // Test mobile view
        await page.setViewportSize({ width: 375, height: 667 });
        await page.reload();
        await expect(page.locator('[data-testid="mobile-nav-toggle"]')).toBeVisible();
        
        // Test mobile navigation
        await page.click('[data-testid="mobile-nav-toggle"]');
        await expect(page.locator('[data-testid="mobile-nav-menu"]')).toBeVisible();
      });
    });
  });

  // Mobile-specific tests
  test.describe('Mobile Device Tests', () => {
    test('shopping flow on mobile devices', async ({ browser }) => {
      const context = await browser.newContext({
        ...devices['iPhone 12'],
      });
      const page = await context.newPage();
      const mobileHelpers = new TestHelpers(page);

      await page.goto('/');
      
      // Test mobile product browsing
      await expect(page.locator('[data-testid="product-list"]')).toBeVisible();
      
      // Test mobile cart functionality
      await mobileHelpers.addProductToCart(testProducts.laptop.name);
      await page.click('[data-testid="mobile-cart-icon"]');
      await mobileHelpers.expectProductInCart(testProducts.laptop.name, 1);
      
      // Test mobile login
      await page.click('[data-testid="mobile-nav-toggle"]');
      await page.click('[data-testid="mobile-login-link"]');
      await page.fill('[data-testid="email-input"]', testUsers.customer.email);
      await page.fill('[data-testid="password-input"]', testUsers.customer.password);
      await page.click('[data-testid="login-button"]');
      
      await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
      
      await context.close();
    });

    test('touch interactions work correctly', async ({ browser }) => {
      const context = await browser.newContext({
        ...devices['iPad Pro'],
      });
      const page = await context.newPage();

      await page.goto('/');
      
      // Test touch scrolling
      await page.locator('[data-testid="product-list"]').scrollIntoViewIfNeeded();
      
      // Test touch tap on product
      await page.locator(`[data-testid="product-card-${testProducts.laptop.name}"]`).tap();
      await expect(page.locator('[data-testid="product-detail"]')).toBeVisible();
      
      // Test swipe gestures (if implemented)
      const productImage = page.locator('[data-testid="product-image"]');
      await productImage.hover();
      
      await context.close();
    });
  });

  // Performance tests across browsers
  test.describe('Performance Tests', () => {
    test('page load performance', async ({ page }) => {
      // Measure page load time
      const startTime = Date.now();
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      const loadTime = Date.now() - startTime;
      
      // Assert reasonable load time (adjust threshold as needed)
      expect(loadTime).toBeLessThan(5000); // 5 seconds
      
      // Check for performance metrics
      const performanceMetrics = await page.evaluate(() => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        return {
          domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
          loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
        };
      });
      
      expect(performanceMetrics.domContentLoaded).toBeLessThan(2000);
      expect(performanceMetrics.loadComplete).toBeLessThan(3000);
    });

    test('search performance', async ({ page }) => {
      await page.goto('/');
      
      // Measure search response time
      const startTime = Date.now();
      await helpers.searchForProduct('laptop');
      await page.waitForSelector('[data-testid="search-results"]');
      const searchTime = Date.now() - startTime;
      
      expect(searchTime).toBeLessThan(1000); // 1 second
    });
  });

  // Accessibility tests
  test.describe('Accessibility Tests', () => {
    test('keyboard navigation works', async ({ page }) => {
      await page.goto('/');
      
      // Test tab navigation
      await page.keyboard.press('Tab');
      await expect(page.locator(':focus')).toBeVisible();
      
      // Navigate to search input
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      await expect(page.locator('[data-testid="search-input"]:focus')).toBeVisible();
      
      // Test search with keyboard
      await page.keyboard.type('laptop');
      await page.keyboard.press('Enter');
      await expect(page.locator('[data-testid="search-results"]')).toBeVisible();
    });

    test('screen reader compatibility', async ({ page }) => {
      await page.goto('/');
      
      // Check for proper ARIA labels
      await expect(page.locator('[data-testid="search-input"]')).toHaveAttribute('aria-label');
      await expect(page.locator('[data-testid="cart-icon"]')).toHaveAttribute('aria-label');
      
      // Check for proper heading structure
      const headings = await page.locator('h1, h2, h3, h4, h5, h6').all();
      expect(headings.length).toBeGreaterThan(0);
      
      // Check for alt text on images
      const images = await page.locator('img').all();
      for (const image of images) {
        await expect(image).toHaveAttribute('alt');
      }
    });
  });

  // Error handling tests
  test.describe('Error Handling Tests', () => {
    test('handles network errors gracefully', async ({ page }) => {
      // Simulate network failure
      await page.route('**/api/**', route => route.abort());
      
      await page.goto('/');
      
      // Verify error message is displayed
      await expect(page.locator('[data-testid="network-error-message"]')).toBeVisible();
      await expect(page.locator('[data-testid="retry-button"]')).toBeVisible();
    });

    test('handles server errors gracefully', async ({ page }) => {
      // Simulate server error
      await page.route('**/api/products', route => 
        route.fulfill({ status: 500, body: 'Internal Server Error' })
      );
      
      await page.goto('/');
      
      // Verify error handling
      await expect(page.locator('[data-testid="server-error-message"]')).toBeVisible();
    });
  });
});