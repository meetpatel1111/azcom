import { Page, expect, Locator } from '@playwright/test';
import { testUsers, testProducts } from '../fixtures/test-data';

export class TestHelpers {
  constructor(private page: Page) {}

  // Enhanced wait utilities with dynamic waits based on element state
  async waitForElement(selector: string, options: { timeout?: number; state?: 'visible' | 'attached' | 'detached' | 'hidden' } = {}): Promise<Locator> {
    const { timeout = 30000, state = 'visible' } = options;
    const element = this.page.locator(selector);
    await element.waitFor({ state, timeout });
    return element;
  }

  async waitForApiCall(urlPattern: string | RegExp, options: { timeout?: number; method?: string } = {}): Promise<void> {
    const { timeout = 30000, method = 'GET' } = options;
    await this.page.waitForResponse(
      response => {
        const url = response.url();
        const matchesUrl = typeof urlPattern === 'string' ? url.includes(urlPattern) : urlPattern.test(url);
        const matchesMethod = response.request().method() === method;
        return matchesUrl && matchesMethod;
      },
      { timeout }
    );
  }

  async waitForPageReady(options: { timeout?: number } = {}): Promise<void> {
    const { timeout = 30000 } = options;
    
    // Wait for network to be idle (no requests for 500ms)
    await this.page.waitForLoadState('networkidle', { timeout });
    
    // Wait for DOM to be ready
    await this.page.waitForLoadState('domcontentloaded', { timeout });
    
    // Wait for any loading indicators to disappear
    const loadingIndicators = [
      '[data-testid="loading"]',
      '[data-testid="spinner"]',
      '.loading',
      '.spinner'
    ];
    
    for (const selector of loadingIndicators) {
      try {
        const element = this.page.locator(selector);
        if (await element.isVisible()) {
          await element.waitFor({ state: 'hidden', timeout: 5000 });
        }
      } catch (error) {
        // Ignore if loading indicator doesn't exist
      }
    }
  }

  async waitForCondition(
    condition: () => Promise<boolean>,
    options: { timeout?: number; interval?: number } = {}
  ): Promise<void> {
    const { timeout = 30000, interval = 500 } = options;
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      if (await condition()) {
        return;
      }
      await this.page.waitForTimeout(interval);
    }
    
    throw new Error(`Condition not met within ${timeout}ms`);
  }

  // Enhanced element interaction with automatic waits
  async safeClick(selector: string, options: { timeout?: number; force?: boolean } = {}): Promise<void> {
    const { timeout = 30000, force = false } = options;
    const element = await this.waitForElement(selector, { timeout, state: 'visible' });
    
    // Ensure element is enabled and clickable
    await expect(element).toBeEnabled({ timeout: 5000 });
    
    // Scroll element into view if needed
    await element.scrollIntoViewIfNeeded();
    
    // Wait a bit for any animations to complete
    await this.page.waitForTimeout(100);
    
    await element.click({ force, timeout: 5000 });
  }

  async safeFill(selector: string, value: string, options: { timeout?: number; clear?: boolean } = {}): Promise<void> {
    const { timeout = 30000, clear = true } = options;
    const element = await this.waitForElement(selector, { timeout, state: 'visible' });
    
    // Ensure element is enabled
    await expect(element).toBeEnabled({ timeout: 5000 });
    
    if (clear) {
      await element.clear();
    }
    
    await element.fill(value);
    
    // Verify the value was set correctly
    await expect(element).toHaveValue(value, { timeout: 5000 });
  }

  async safeSelectOption(selector: string, value: string, options: { timeout?: number } = {}): Promise<void> {
    const { timeout = 30000 } = options;
    const element = await this.waitForElement(selector, { timeout, state: 'visible' });
    
    await expect(element).toBeEnabled({ timeout: 5000 });
    await element.selectOption(value);
    
    // Verify the option was selected
    await expect(element).toHaveValue(value, { timeout: 5000 });
  }

  // Authentication helpers with enhanced wait strategies
  async loginAsCustomer() {
    await this.page.goto('/login');
    await this.waitForPageReady();
    
    await this.safeFill('[data-testid="email-input"]', testUsers.customer.email);
    await this.safeFill('[data-testid="password-input"]', testUsers.customer.password);
    await this.safeClick('[data-testid="login-button"]');
    
    // Wait for login API call to complete
    await this.waitForApiCall('/api/auth/login', { method: 'POST' });
    
    // Wait for redirect and page to be ready
    await expect(this.page).toHaveURL('/', { timeout: 10000 });
    await this.waitForPageReady();
  }

  async loginAsAdmin() {
    await this.page.goto('/login');
    await this.waitForPageReady();
    
    await this.safeFill('[data-testid="email-input"]', testUsers.admin.email);
    await this.safeFill('[data-testid="password-input"]', testUsers.admin.password);
    await this.safeClick('[data-testid="login-button"]');
    
    // Wait for login API call to complete
    await this.waitForApiCall('/api/auth/login', { method: 'POST' });
    
    // Wait for redirect and page to be ready
    await expect(this.page).toHaveURL('/admin', { timeout: 10000 });
    await this.waitForPageReady();
  }

  async registerNewUser(userData = testUsers.newCustomer) {
    await this.page.goto('/register');
    await this.waitForPageReady();
    
    await this.safeFill('[data-testid="email-input"]', userData.email);
    await this.safeFill('[data-testid="password-input"]', userData.password);
    await this.safeFill('[data-testid="firstName-input"]', userData.firstName);
    await this.safeFill('[data-testid="lastName-input"]', userData.lastName);
    await this.safeClick('[data-testid="register-button"]');
    
    // Wait for registration API call to complete
    await this.waitForApiCall('/api/auth/register', { method: 'POST' });
    await this.waitForPageReady();
  }

  async logout() {
    await this.safeClick('[data-testid="user-menu"]');
    await this.safeClick('[data-testid="logout-button"]');
    
    // Wait for logout API call if it exists
    try {
      await this.waitForApiCall('/api/auth/logout', { method: 'POST', timeout: 5000 });
    } catch (error) {
      // Logout might be client-side only, continue
    }
    
    await expect(this.page).toHaveURL('/', { timeout: 10000 });
    await this.waitForPageReady();
  }

  // Product helpers with enhanced wait strategies
  async searchForProduct(searchTerm: string) {
    await this.safeFill('[data-testid="search-input"]', searchTerm);
    await this.page.press('[data-testid="search-input"]', 'Enter');
    
    // Wait for search API call to complete
    await this.waitForApiCall('/api/products', { method: 'GET' });
    await this.waitForPageReady();
  }

  async filterByCategory(category: string) {
    await this.safeSelectOption('[data-testid="category-filter"]', category);
    
    // Wait for filter API call to complete
    await this.waitForApiCall('/api/products', { method: 'GET' });
    await this.waitForPageReady();
  }

  async addProductToCart(productName: string) {
    // Ensure product card is visible first
    await this.waitForElement(`[data-testid="product-card-${productName}"]`);
    
    await this.safeClick(`[data-testid="product-card-${productName}"] [data-testid="add-to-cart-button"]`);
    
    // Wait for add to cart API call
    await this.waitForApiCall('/api/cart', { method: 'POST' });
    
    // Wait for cart notification to appear
    await this.waitForElement('[data-testid="cart-notification"]');
    await expect(this.page.locator('[data-testid="cart-notification"]')).toBeVisible({ timeout: 5000 });
  }

  async goToProductDetail(productName: string) {
    await this.waitForElement(`[data-testid="product-card-${productName}"]`);
    await this.safeClick(`[data-testid="product-card-${productName}"]`);
    
    // Wait for product detail API call
    await this.waitForApiCall('/api/products/', { method: 'GET' });
    await this.waitForPageReady();
  }

  // Cart helpers with enhanced wait strategies
  async openCart() {
    await this.safeClick('[data-testid="cart-icon"]');
    
    // Wait for cart API call to load cart items
    await this.waitForApiCall('/api/cart', { method: 'GET' });
    await this.waitForPageReady();
  }

  async updateCartItemQuantity(productName: string, quantity: number) {
    await this.waitForElement(`[data-testid="cart-item-${productName}"]`);
    
    await this.safeFill(`[data-testid="cart-item-${productName}"] [data-testid="quantity-input"]`, quantity.toString());
    await this.page.press(`[data-testid="cart-item-${productName}"] [data-testid="quantity-input"]`, 'Enter');
    
    // Wait for cart update API call
    await this.waitForApiCall('/api/cart', { method: 'PUT' });
    
    // Wait for cart total to update
    await this.waitForCondition(async () => {
      const input = this.page.locator(`[data-testid="cart-item-${productName}"] [data-testid="quantity-input"]`);
      const value = await input.inputValue();
      return value === quantity.toString();
    });
  }

  async removeCartItem(productName: string) {
    await this.waitForElement(`[data-testid="cart-item-${productName}"]`);
    await this.safeClick(`[data-testid="cart-item-${productName}"] [data-testid="remove-button"]`);
    
    // Wait for remove from cart API call
    await this.waitForApiCall('/api/cart', { method: 'DELETE' });
    
    // Wait for item to be removed from DOM
    await this.waitForElement(`[data-testid="cart-item-${productName}"]`, { state: 'detached' });
  }

  async clearCart() {
    await this.safeClick('[data-testid="clear-cart-button"]');
    
    // Wait for clear cart API call
    await this.waitForApiCall('/api/cart/clear', { method: 'DELETE' });
    await this.waitForPageReady();
  }

  // Checkout helpers with enhanced wait strategies
  async proceedToCheckout() {
    await this.safeClick('[data-testid="checkout-button"]');
    
    // Wait for checkout page to load
    await this.waitForPageReady();
    await expect(this.page).toHaveURL(/checkout/, { timeout: 10000 });
  }

  async fillShippingAddress(address: any) {
    await this.waitForElement('[data-testid="street-input"]');
    
    await this.safeFill('[data-testid="street-input"]', address.street);
    await this.safeFill('[data-testid="city-input"]', address.city);
    await this.safeFill('[data-testid="state-input"]', address.state);
    await this.safeFill('[data-testid="zipCode-input"]', address.zipCode);
  }

  async fillPaymentInfo(paymentInfo: any) {
    await this.waitForElement('[data-testid="cardNumber-input"]');
    
    await this.safeFill('[data-testid="cardNumber-input"]', paymentInfo.cardNumber);
    await this.safeFill('[data-testid="expiryDate-input"]', paymentInfo.expiryDate);
    await this.safeFill('[data-testid="cvv-input"]', paymentInfo.cvv);
    await this.safeFill('[data-testid="cardholderName-input"]', paymentInfo.cardholderName);
  }

  async placeOrder() {
    await this.safeClick('[data-testid="place-order-button"]');
    
    // Wait for order creation API call
    await this.waitForApiCall('/api/orders', { method: 'POST' });
    
    // Wait for order confirmation page
    await this.waitForPageReady();
    await expect(this.page).toHaveURL(/order-confirmation/, { timeout: 15000 });
  }

  // Admin helpers with enhanced wait strategies
  async createProduct(product: any) {
    await this.page.goto('/admin');
    await this.waitForPageReady();
    
    await this.safeClick('[data-testid="add-product-button"]');
    await this.waitForPageReady();
    
    await this.safeFill('[data-testid="product-name-input"]', product.name);
    await this.safeFill('[data-testid="product-description-input"]', product.description);
    await this.safeFill('[data-testid="product-price-input"]', product.price.toString());
    await this.safeSelectOption('[data-testid="product-category-select"]', product.category);
    await this.safeFill('[data-testid="product-inventory-input"]', product.inventory.toString());
    
    await this.safeClick('[data-testid="save-product-button"]');
    
    // Wait for product creation API call
    await this.waitForApiCall('/api/products', { method: 'POST' });
    await this.waitForPageReady();
  }

  async editProduct(productName: string, updates: any) {
    await this.page.goto('/admin');
    await this.waitForPageReady();
    
    await this.safeClick(`[data-testid="edit-product-${productName}"]`);
    await this.waitForPageReady();
    
    if (updates.name) {
      await this.safeFill('[data-testid="product-name-input"]', updates.name);
    }
    if (updates.description) {
      await this.safeFill('[data-testid="product-description-input"]', updates.description);
    }
    if (updates.price) {
      await this.safeFill('[data-testid="product-price-input"]', updates.price.toString());
    }
    if (updates.inventory) {
      await this.safeFill('[data-testid="product-inventory-input"]', updates.inventory.toString());
    }
    
    await this.safeClick('[data-testid="save-product-button"]');
    
    // Wait for product update API call
    await this.waitForApiCall('/api/products/', { method: 'PUT' });
    await this.waitForPageReady();
  }

  async deleteProduct(productName: string) {
    await this.page.goto('/admin');
    await this.waitForPageReady();
    
    await this.safeClick(`[data-testid="delete-product-${productName}"]`);
    await this.safeClick('[data-testid="confirm-delete-button"]');
    
    // Wait for product deletion API call
    await this.waitForApiCall('/api/products/', { method: 'DELETE' });
    await this.waitForPageReady();
  }

  // Enhanced assertion helpers with proper wait strategies
  async expectProductInCart(productName: string, quantity?: number) {
    // Wait for cart item to be visible
    await this.waitForElement(`[data-testid="cart-item-${productName}"]`);
    await expect(this.page.locator(`[data-testid="cart-item-${productName}"]`)).toBeVisible({ timeout: 10000 });
    
    if (quantity) {
      await expect(this.page.locator(`[data-testid="cart-item-${productName}"] [data-testid="quantity-input"]`))
        .toHaveValue(quantity.toString(), { timeout: 10000 });
    }
  }

  async expectCartTotal(expectedTotal: string) {
    // Wait for cart total to be calculated and displayed
    await this.waitForElement('[data-testid="cart-total"]');
    await expect(this.page.locator('[data-testid="cart-total"]')).toContainText(expectedTotal, { timeout: 10000 });
  }

  async expectOrderConfirmation(orderId?: string) {
    // Wait for order confirmation to appear
    await this.waitForElement('[data-testid="order-confirmation"]');
    await expect(this.page.locator('[data-testid="order-confirmation"]')).toBeVisible({ timeout: 15000 });
    
    if (orderId) {
      await this.waitForElement('[data-testid="order-id"]');
      await expect(this.page.locator('[data-testid="order-id"]')).toContainText(orderId, { timeout: 10000 });
    }
  }

  async expectProductVisible(productName: string) {
    await this.waitForElement(`[data-testid="product-card-${productName}"]`);
    await expect(this.page.locator(`[data-testid="product-card-${productName}"]`)).toBeVisible({ timeout: 10000 });
  }

  async expectProductNotVisible(productName: string) {
    // Wait for product to be removed or hidden
    await expect(this.page.locator(`[data-testid="product-card-${productName}"]`)).not.toBeVisible({ timeout: 10000 });
  }

  // Additional enhanced assertion helpers
  async expectElementVisible(selector: string, timeout: number = 10000) {
    await this.waitForElement(selector);
    await expect(this.page.locator(selector)).toBeVisible({ timeout });
  }

  async expectElementHidden(selector: string, timeout: number = 10000) {
    await expect(this.page.locator(selector)).toBeHidden({ timeout });
  }

  async expectTextContent(selector: string, expectedText: string, timeout: number = 10000) {
    await this.waitForElement(selector);
    await expect(this.page.locator(selector)).toContainText(expectedText, { timeout });
  }

  async expectElementEnabled(selector: string, timeout: number = 10000) {
    await this.waitForElement(selector);
    await expect(this.page.locator(selector)).toBeEnabled({ timeout });
  }

  async expectElementDisabled(selector: string, timeout: number = 10000) {
    await this.waitForElement(selector);
    await expect(this.page.locator(selector)).toBeDisabled({ timeout });
  }
}