import { test, expect } from '@playwright/test';
import { TestHelpers } from './utils/test-helpers';
import { testUsers, testProducts, testOrder } from './fixtures/test-data';

test.describe('Customer Shopping Journey', () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
  });

  test('complete shopping flow: browse → cart → checkout → order', async ({ page }) => {
    // Step 1: Browse products (Requirement 1.1)
    await page.goto('/');
    await expect(page.locator('[data-testid="product-list"]')).toBeVisible();
    await helpers.expectProductVisible(testProducts.laptop.name);

    // Step 2: Search for specific product (Requirement 1.2)
    await helpers.searchForProduct('laptop');
    await helpers.expectProductVisible(testProducts.laptop.name);
    await helpers.expectProductNotVisible(testProducts.book.name);

    // Step 3: View product details (Requirement 1.3)
    await helpers.goToProductDetail(testProducts.laptop.name);
    await expect(page.locator('[data-testid="product-detail"]')).toBeVisible();
    await expect(page.locator('[data-testid="product-name"]')).toContainText(testProducts.laptop.name);
    await expect(page.locator('[data-testid="product-price"]')).toContainText(testProducts.laptop.price.toString());

    // Step 4: Add product to cart (Requirement 2.1)
    await page.click('[data-testid="add-to-cart-button"]');
    await expect(page.locator('[data-testid="cart-notification"]')).toBeVisible();

    // Step 5: View cart contents (Requirement 2.2)
    await helpers.openCart();
    await helpers.expectProductInCart(testProducts.laptop.name, 1);
    await helpers.expectCartTotal('$999.99');

    // Step 6: Update cart quantity (Requirement 2.3)
    await helpers.updateCartItemQuantity(testProducts.laptop.name, 2);
    await helpers.expectProductInCart(testProducts.laptop.name, 2);
    await helpers.expectCartTotal('$1999.98');

    // Step 7: Add another product to cart
    await page.goto('/');
    await helpers.addProductToCart(testProducts.book.name);
    await helpers.openCart();
    await helpers.expectProductInCart(testProducts.book.name, 1);
    await helpers.expectCartTotal('$2029.97');

    // Step 8: Remove item from cart (Requirement 2.4)
    await helpers.removeCartItem(testProducts.book.name);
    await expect(page.locator(`[data-testid="cart-item-${testProducts.book.name}"]`)).not.toBeVisible();
    await helpers.expectCartTotal('$1999.98');

    // Step 9: Login before checkout (Requirement 3.2)
    await helpers.loginAsCustomer();

    // Step 10: Proceed to checkout (Requirement 4.1)
    await helpers.openCart();
    await helpers.proceedToCheckout();
    await expect(page.locator('[data-testid="checkout-form"]')).toBeVisible();

    // Step 11: Fill shipping information (Requirement 4.1)
    await helpers.fillShippingAddress(testOrder.shippingAddress);

    // Step 12: Fill payment information (Requirement 4.1)
    await helpers.fillPaymentInfo(testOrder.paymentInfo);

    // Step 13: Place order (Requirement 4.2)
    await helpers.placeOrder();
    await helpers.expectOrderConfirmation();

    // Step 14: Verify order in history (Requirement 4.3)
    await page.click('[data-testid="view-orders-link"]');
    await expect(page.locator('[data-testid="order-history"]')).toBeVisible();
    await expect(page.locator('[data-testid="order-item"]').first()).toBeVisible();

    // Step 15: Verify inventory was updated (Requirement 4.4)
    await page.goto('/');
    await helpers.goToProductDetail(testProducts.laptop.name);
    // Inventory should be reduced by 2 (from 10 to 8)
    await expect(page.locator('[data-testid="product-inventory"]')).toContainText('8');
  });

  test('filter products by category', async ({ page }) => {
    // Requirement 1.4: Category filtering
    await page.goto('/');
    
    // Filter by Electronics category
    await helpers.filterByCategory('Electronics');
    await helpers.expectProductVisible(testProducts.laptop.name);
    await helpers.expectProductNotVisible(testProducts.book.name);

    // Filter by Books category
    await helpers.filterByCategory('Books');
    await helpers.expectProductVisible(testProducts.book.name);
    await helpers.expectProductNotVisible(testProducts.laptop.name);

    // Clear filter to show all products
    await helpers.filterByCategory('All');
    await helpers.expectProductVisible(testProducts.laptop.name);
    await helpers.expectProductVisible(testProducts.book.name);
  });

  test('cart persistence after login', async ({ page }) => {
    // Requirement 3.3: Cart restoration after login
    await page.goto('/');
    
    // Add items to cart as guest
    await helpers.addProductToCart(testProducts.laptop.name);
    await helpers.addProductToCart(testProducts.book.name);
    
    // Login
    await helpers.loginAsCustomer();
    
    // Verify cart contents are preserved
    await helpers.openCart();
    await helpers.expectProductInCart(testProducts.laptop.name, 1);
    await helpers.expectProductInCart(testProducts.book.name, 1);
  });

  test('empty cart checkout prevention', async ({ page }) => {
    await helpers.loginAsCustomer();
    await page.goto('/cart');
    
    // Ensure cart is empty
    await helpers.clearCart();
    
    // Try to checkout with empty cart
    await expect(page.locator('[data-testid="checkout-button"]')).toBeDisabled();
    await expect(page.locator('[data-testid="empty-cart-message"]')).toBeVisible();
  });

  test('product search with no results', async ({ page }) => {
    await page.goto('/');
    
    // Search for non-existent product
    await helpers.searchForProduct('nonexistentproduct');
    
    // Verify no results message
    await expect(page.locator('[data-testid="no-results-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="product-card"]')).toHaveCount(0);
  });

  test('order details view', async ({ page }) => {
    // First create an order
    await helpers.loginAsCustomer();
    await page.goto('/');
    await helpers.addProductToCart(testProducts.laptop.name);
    await helpers.openCart();
    await helpers.proceedToCheckout();
    await helpers.fillShippingAddress(testOrder.shippingAddress);
    await helpers.fillPaymentInfo(testOrder.paymentInfo);
    await helpers.placeOrder();
    
    // Get order ID from confirmation
    const orderIdElement = page.locator('[data-testid="order-id"]');
    const orderId = await orderIdElement.textContent();
    
    // Navigate to order history
    await page.click('[data-testid="view-orders-link"]');
    
    // Click on the order to view details
    await page.click(`[data-testid="order-${orderId}"]`);
    
    // Verify order details page
    await expect(page.locator('[data-testid="order-detail"]')).toBeVisible();
    await expect(page.locator('[data-testid="order-items"]')).toContainText(testProducts.laptop.name);
    await expect(page.locator('[data-testid="order-total"]')).toContainText('$999.99');
    await expect(page.locator('[data-testid="shipping-address"]')).toContainText(testOrder.shippingAddress.street);
  });
});