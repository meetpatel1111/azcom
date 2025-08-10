import { test, expect } from '@playwright/test';
import { TestHelpers } from './utils/test-helpers';
import { testUsers, testProducts } from './fixtures/test-data';

test.describe('Edge Cases and Error Scenarios', () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
  });

  test('handles out of stock products', async ({ page }) => {
    await helpers.loginAsAdmin();
    
    // Set product inventory to 0
    await helpers.editProduct(testProducts.laptop.name, { inventory: 0 });
    
    // Switch to customer view
    await helpers.logout();
    await page.goto('/');
    
    // Verify out of stock indicator
    await expect(page.locator(`[data-testid="product-card-${testProducts.laptop.name}"] [data-testid="out-of-stock"]`))
      .toBeVisible();
    
    // Verify add to cart button is disabled
    await expect(page.locator(`[data-testid="product-card-${testProducts.laptop.name}"] [data-testid="add-to-cart-button"]`))
      .toBeDisabled();
    
    // Try to access product detail page
    await helpers.goToProductDetail(testProducts.laptop.name);
    await expect(page.locator('[data-testid="out-of-stock-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="add-to-cart-button"]')).toBeDisabled();
  });

  test('handles inventory reduction during checkout', async ({ page }) => {
    await helpers.loginAsCustomer();
    
    // Add product to cart
    await page.goto('/');
    await helpers.addProductToCart(testProducts.book.name);
    
    // Simulate another user purchasing the same product (reducing inventory)
    const adminPage = await page.context().newPage();
    const adminHelpers = new TestHelpers(adminPage);
    await adminHelpers.loginAsAdmin();
    await adminHelpers.editProduct(testProducts.book.name, { inventory: 0 });
    await adminPage.close();
    
    // Try to checkout
    await helpers.openCart();
    await helpers.proceedToCheckout();
    
    // Should show inventory error
    await expect(page.locator('[data-testid="inventory-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="inventory-error"]'))
      .toContainText('Some items in your cart are no longer available');
  });

  test('handles session expiration during checkout', async ({ page }) => {
    await helpers.loginAsCustomer();
    await page.goto('/');
    await helpers.addProductToCart(testProducts.laptop.name);
    await helpers.openCart();
    await helpers.proceedToCheckout();
    
    // Simulate session expiration by clearing cookies
    await page.context().clearCookies();
    
    // Try to place order
    await helpers.fillShippingAddress({
      street: '123 Test St',
      city: 'Test City',
      state: 'TS',
      zipCode: '12345'
    });
    await helpers.fillPaymentInfo({
      cardNumber: '4111111111111111',
      expiryDate: '12/25',
      cvv: '123',
      cardholderName: 'John Doe'
    });
    
    await page.click('[data-testid="place-order-button"]');
    
    // Should redirect to login
    await expect(page).toHaveURL('/login');
    await expect(page.locator('[data-testid="session-expired-message"]')).toBeVisible();
  });

  test('handles large cart quantities', async ({ page }) => {
    await helpers.loginAsCustomer();
    await page.goto('/');
    await helpers.addProductToCart(testProducts.laptop.name);
    
    await helpers.openCart();
    
    // Try to set quantity higher than available inventory
    await helpers.updateCartItemQuantity(testProducts.laptop.name, 999);
    
    // Should show error and limit to available inventory
    await expect(page.locator('[data-testid="quantity-error"]')).toBeVisible();
    await expect(page.locator(`[data-testid="cart-item-${testProducts.laptop.name}"] [data-testid="quantity-input"]`))
      .toHaveValue('10'); // Should be limited to available inventory
  });

  test('handles concurrent cart modifications', async ({ page }) => {
    await helpers.loginAsCustomer();
    
    // Open two tabs with the same user
    const secondTab = await page.context().newPage();
    const secondHelpers = new TestHelpers(secondTab);
    
    // Add item in first tab
    await page.goto('/');
    await helpers.addProductToCart(testProducts.laptop.name);
    
    // Add different item in second tab
    await secondTab.goto('/');
    await secondHelpers.addProductToCart(testProducts.book.name);
    
    // Check cart in first tab - should show both items
    await helpers.openCart();
    await helpers.expectProductInCart(testProducts.laptop.name, 1);
    await helpers.expectProductInCart(testProducts.book.name, 1);
    
    await secondTab.close();
  });

  test('handles malformed search queries', async ({ page }) => {
    await page.goto('/');
    
    // Test special characters in search
    await helpers.searchForProduct('<script>alert("xss")</script>');
    await expect(page.locator('[data-testid="search-results"]')).toBeVisible();
    await expect(page.locator('[data-testid="no-results-message"]')).toBeVisible();
    
    // Test very long search query
    const longQuery = 'a'.repeat(1000);
    await helpers.searchForProduct(longQuery);
    await expect(page.locator('[data-testid="search-results"]')).toBeVisible();
  });

  test('handles payment form validation', async ({ page }) => {
    await helpers.loginAsCustomer();
    await page.goto('/');
    await helpers.addProductToCart(testProducts.laptop.name);
    await helpers.openCart();
    await helpers.proceedToCheckout();
    
    // Fill shipping address
    await helpers.fillShippingAddress({
      street: '123 Test St',
      city: 'Test City',
      state: 'TS',
      zipCode: '12345'
    });
    
    // Try invalid credit card number
    await page.fill('[data-testid="cardNumber-input"]', '1234');
    await page.click('[data-testid="place-order-button"]');
    
    await expect(page.locator('[data-testid="cardNumber-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="cardNumber-error"]'))
      .toContainText('Please enter a valid credit card number');
    
    // Try expired card
    await page.fill('[data-testid="cardNumber-input"]', '4111111111111111');
    await page.fill('[data-testid="expiryDate-input"]', '01/20'); // Past date
    await page.click('[data-testid="place-order-button"]');
    
    await expect(page.locator('[data-testid="expiryDate-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="expiryDate-error"]'))
      .toContainText('Card has expired');
  });

  test('handles network interruption during order placement', async ({ page }) => {
    await helpers.loginAsCustomer();
    await page.goto('/');
    await helpers.addProductToCart(testProducts.laptop.name);
    await helpers.openCart();
    await helpers.proceedToCheckout();
    
    await helpers.fillShippingAddress({
      street: '123 Test St',
      city: 'Test City',
      state: 'TS',
      zipCode: '12345'
    });
    await helpers.fillPaymentInfo({
      cardNumber: '4111111111111111',
      expiryDate: '12/25',
      cvv: '123',
      cardholderName: 'John Doe'
    });
    
    // Intercept order request and simulate network failure
    await page.route('**/api/orders', route => route.abort());
    
    await page.click('[data-testid="place-order-button"]');
    
    // Should show network error
    await expect(page.locator('[data-testid="network-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="retry-order-button"]')).toBeVisible();
    
    // Restore network and retry
    await page.unroute('**/api/orders');
    await page.click('[data-testid="retry-order-button"]');
    
    // Should complete successfully
    await helpers.expectOrderConfirmation();
  });

  test('handles browser back/forward during checkout', async ({ page }) => {
    await helpers.loginAsCustomer();
    await page.goto('/');
    await helpers.addProductToCart(testProducts.laptop.name);
    await helpers.openCart();
    await helpers.proceedToCheckout();
    
    // Fill partial form
    await page.fill('[data-testid="street-input"]', '123 Test St');
    await page.fill('[data-testid="city-input"]', 'Test City');
    
    // Navigate back
    await page.goBack();
    
    // Navigate forward
    await page.goForward();
    
    // Verify form data is preserved
    await expect(page.locator('[data-testid="street-input"]')).toHaveValue('123 Test St');
    await expect(page.locator('[data-testid="city-input"]')).toHaveValue('Test City');
  });

  test('handles rapid clicking on add to cart', async ({ page }) => {
    await page.goto('/');
    
    // Rapidly click add to cart multiple times
    const addToCartButton = page.locator(`[data-testid="product-card-${testProducts.laptop.name}"] [data-testid="add-to-cart-button"]`);
    
    await Promise.all([
      addToCartButton.click(),
      addToCartButton.click(),
      addToCartButton.click(),
      addToCartButton.click(),
      addToCartButton.click()
    ]);
    
    // Should only add one item (prevent duplicate additions)
    await helpers.openCart();
    await helpers.expectProductInCart(testProducts.laptop.name, 1);
  });

  test('handles admin deleting product while customer has it in cart', async ({ page }) => {
    await helpers.loginAsCustomer();
    await page.goto('/');
    await helpers.addProductToCart(testProducts.clothing.name);
    
    // Admin deletes the product
    const adminPage = await page.context().newPage();
    const adminHelpers = new TestHelpers(adminPage);
    await adminHelpers.loginAsAdmin();
    await adminHelpers.deleteProduct(testProducts.clothing.name);
    await adminPage.close();
    
    // Customer tries to checkout
    await helpers.openCart();
    
    // Should show product unavailable message
    await expect(page.locator(`[data-testid="cart-item-${testProducts.clothing.name}"] [data-testid="product-unavailable"]`))
      .toBeVisible();
    
    // Checkout button should be disabled or show warning
    await expect(page.locator('[data-testid="checkout-button"]')).toBeDisabled();
  });
});