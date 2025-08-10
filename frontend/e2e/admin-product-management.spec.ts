import { test, expect } from '@playwright/test';
import { TestHelpers } from './utils/test-helpers';
import { testUsers, testProducts } from './fixtures/test-data';

test.describe('Admin Product Management Workflow', () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
    // Login as admin before each test
    await helpers.loginAsAdmin();
  });

  test('admin can create new product', async ({ page }) => {
    // Requirement 5.1: Add new product
    const newProduct = {
      name: `Test Product ${Date.now()}`,
      description: 'A test product for E2E testing',
      price: 49.99,
      category: 'Electronics',
      inventory: 15
    };

    await page.goto('/admin');
    
    // Verify admin panel is accessible
    await expect(page.locator('[data-testid="admin-panel"]')).toBeVisible();
    
    // Click add product button
    await page.click('[data-testid="add-product-button"]');
    
    // Verify product form is visible
    await expect(page.locator('[data-testid="product-form"]')).toBeVisible();
    
    // Fill product details
    await page.fill('[data-testid="product-name-input"]', newProduct.name);
    await page.fill('[data-testid="product-description-input"]', newProduct.description);
    await page.fill('[data-testid="product-price-input"]', newProduct.price.toString());
    await page.selectOption('[data-testid="product-category-select"]', newProduct.category);
    await page.fill('[data-testid="product-inventory-input"]', newProduct.inventory.toString());
    
    // Save product
    await page.click('[data-testid="save-product-button"]');
    
    // Verify success message
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="success-message"]')).toContainText('Product created successfully');
    
    // Verify product appears in admin product list
    await expect(page.locator(`[data-testid="admin-product-${newProduct.name}"]`)).toBeVisible();
    
    // Verify product is visible on customer-facing site
    await page.goto('/');
    await helpers.expectProductVisible(newProduct.name);
  });

  test('admin can update existing product', async ({ page }) => {
    // Requirement 5.2: Update product information
    const updatedData = {
      name: `Updated ${testProducts.laptop.name}`,
      description: 'Updated description for testing',
      price: 1199.99,
      inventory: 25
    };

    await page.goto('/admin');
    
    // Find and click edit button for existing product
    await page.click(`[data-testid="edit-product-${testProducts.laptop.name}"]`);
    
    // Verify edit form is populated with current data
    await expect(page.locator('[data-testid="product-name-input"]')).toHaveValue(testProducts.laptop.name);
    
    // Update product information
    await page.fill('[data-testid="product-name-input"]', updatedData.name);
    await page.fill('[data-testid="product-description-input"]', updatedData.description);
    await page.fill('[data-testid="product-price-input"]', updatedData.price.toString());
    await page.fill('[data-testid="product-inventory-input"]', updatedData.inventory.toString());
    
    // Save changes
    await page.click('[data-testid="save-product-button"]');
    
    // Verify success message
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
    
    // Verify updated product in admin list
    await expect(page.locator(`[data-testid="admin-product-${updatedData.name}"]`)).toBeVisible();
    await expect(page.locator(`[data-testid="admin-product-${updatedData.name}"] [data-testid="product-price"]`))
      .toContainText(updatedData.price.toString());
    
    // Verify changes are reflected on customer site
    await page.goto('/');
    await helpers.expectProductVisible(updatedData.name);
    await helpers.goToProductDetail(updatedData.name);
    await expect(page.locator('[data-testid="product-price"]')).toContainText(updatedData.price.toString());
    await expect(page.locator('[data-testid="product-description"]')).toContainText(updatedData.description);
  });

  test('admin can delete product', async ({ page }) => {
    // Requirement 5.3: Delete product
    const productToDelete = testProducts.clothing.name;

    await page.goto('/admin');
    
    // Verify product exists in admin list
    await expect(page.locator(`[data-testid="admin-product-${productToDelete}"]`)).toBeVisible();
    
    // Click delete button
    await page.click(`[data-testid="delete-product-${productToDelete}"]`);
    
    // Verify confirmation dialog
    await expect(page.locator('[data-testid="delete-confirmation-dialog"]')).toBeVisible();
    await expect(page.locator('[data-testid="delete-confirmation-message"]'))
      .toContainText(`Are you sure you want to delete "${productToDelete}"?`);
    
    // Confirm deletion
    await page.click('[data-testid="confirm-delete-button"]');
    
    // Verify success message
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="success-message"]')).toContainText('Product deleted successfully');
    
    // Verify product is removed from admin list
    await expect(page.locator(`[data-testid="admin-product-${productToDelete}"]`)).not.toBeVisible();
    
    // Verify product is no longer visible on customer site
    await page.goto('/');
    await helpers.expectProductNotVisible(productToDelete);
  });

  test('admin can view and manage inventory levels', async ({ page }) => {
    // Requirement 5.4: Inventory management
    await page.goto('/admin');
    
    // Verify inventory display
    await expect(page.locator('[data-testid="inventory-section"]')).toBeVisible();
    
    // Check inventory levels for existing products
    await expect(page.locator(`[data-testid="admin-product-${testProducts.laptop.name}"] [data-testid="inventory-level"]`))
      .toContainText(testProducts.laptop.inventory.toString());
    
    // Update inventory for a product
    await page.click(`[data-testid="edit-product-${testProducts.laptop.name}"]`);
    const newInventory = 50;
    await page.fill('[data-testid="product-inventory-input"]', newInventory.toString());
    await page.click('[data-testid="save-product-button"]');
    
    // Verify inventory update
    await expect(page.locator(`[data-testid="admin-product-${testProducts.laptop.name}"] [data-testid="inventory-level"]`))
      .toContainText(newInventory.toString());
    
    // Verify low stock warning (if inventory is low)
    await page.click(`[data-testid="edit-product-${testProducts.book.name}"]`);
    await page.fill('[data-testid="product-inventory-input"]', '2'); // Low stock
    await page.click('[data-testid="save-product-button"]');
    
    await expect(page.locator(`[data-testid="admin-product-${testProducts.book.name}"] [data-testid="low-stock-warning"]`))
      .toBeVisible();
  });

  test('admin form validation', async ({ page }) => {
    await page.goto('/admin');
    await page.click('[data-testid="add-product-button"]');
    
    // Try to save product with missing required fields
    await page.click('[data-testid="save-product-button"]');
    
    // Verify validation errors
    await expect(page.locator('[data-testid="name-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="name-error"]')).toContainText('Product name is required');
    
    await expect(page.locator('[data-testid="price-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="price-error"]')).toContainText('Price is required');
    
    // Test invalid price format
    await page.fill('[data-testid="product-name-input"]', 'Test Product');
    await page.fill('[data-testid="product-price-input"]', 'invalid-price');
    await page.click('[data-testid="save-product-button"]');
    
    await expect(page.locator('[data-testid="price-error"]')).toContainText('Please enter a valid price');
    
    // Test negative inventory
    await page.fill('[data-testid="product-price-input"]', '29.99');
    await page.fill('[data-testid="product-inventory-input"]', '-5');
    await page.click('[data-testid="save-product-button"]');
    
    await expect(page.locator('[data-testid="inventory-error"]')).toContainText('Inventory must be 0 or greater');
  });

  test('admin can cancel product creation/editing', async ({ page }) => {
    await page.goto('/admin');
    
    // Test cancel during product creation
    await page.click('[data-testid="add-product-button"]');
    await page.fill('[data-testid="product-name-input"]', 'Test Product');
    await page.click('[data-testid="cancel-button"]');
    
    // Verify form is closed and no product was created
    await expect(page.locator('[data-testid="product-form"]')).not.toBeVisible();
    await expect(page.locator(`[data-testid="admin-product-Test Product"]`)).not.toBeVisible();
    
    // Test cancel during product editing
    await page.click(`[data-testid="edit-product-${testProducts.laptop.name}"]`);
    const originalName = await page.locator('[data-testid="product-name-input"]').inputValue();
    await page.fill('[data-testid="product-name-input"]', 'Modified Name');
    await page.click('[data-testid="cancel-button"]');
    
    // Verify changes were not saved
    await expect(page.locator('[data-testid="product-form"]')).not.toBeVisible();
    await expect(page.locator(`[data-testid="admin-product-${originalName}"]`)).toBeVisible();
    await expect(page.locator(`[data-testid="admin-product-Modified Name"]`)).not.toBeVisible();
  });

  test('admin product list pagination and search', async ({ page }) => {
    await page.goto('/admin');
    
    // Test search functionality
    await page.fill('[data-testid="admin-search-input"]', testProducts.laptop.name);
    await page.press('[data-testid="admin-search-input"]', 'Enter');
    
    await helpers.expectProductVisible(testProducts.laptop.name);
    await helpers.expectProductNotVisible(testProducts.book.name);
    
    // Clear search
    await page.fill('[data-testid="admin-search-input"]', '');
    await page.press('[data-testid="admin-search-input"]', 'Enter');
    
    // Verify all products are visible again
    await helpers.expectProductVisible(testProducts.laptop.name);
    await helpers.expectProductVisible(testProducts.book.name);
  });

  test('non-admin user cannot access admin panel', async ({ page }) => {
    // Logout admin and login as regular customer
    await helpers.logout();
    await helpers.loginAsCustomer();
    
    // Try to access admin panel
    await page.goto('/admin');
    
    // Should be redirected or show access denied
    await expect(page.locator('[data-testid="access-denied-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="access-denied-message"]'))
      .toContainText('You do not have permission to access this page');
  });

  test('admin can bulk update inventory', async ({ page }) => {
    await page.goto('/admin');
    
    // Select multiple products for bulk update
    await page.check(`[data-testid="select-product-${testProducts.laptop.name}"]`);
    await page.check(`[data-testid="select-product-${testProducts.book.name}"]`);
    
    // Click bulk actions button
    await page.click('[data-testid="bulk-actions-button"]');
    await page.click('[data-testid="bulk-update-inventory"]');
    
    // Set new inventory level
    await page.fill('[data-testid="bulk-inventory-input"]', '100');
    await page.click('[data-testid="apply-bulk-update"]');
    
    // Verify success message
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="success-message"]')).toContainText('Inventory updated for 2 products');
    
    // Verify inventory levels were updated
    await expect(page.locator(`[data-testid="admin-product-${testProducts.laptop.name}"] [data-testid="inventory-level"]`))
      .toContainText('100');
    await expect(page.locator(`[data-testid="admin-product-${testProducts.book.name}"] [data-testid="inventory-level"]`))
      .toContainText('100');
  });

  test('admin can export product data', async ({ page }) => {
    await page.goto('/admin');
    
    // Click export button
    const downloadPromise = page.waitForEvent('download');
    await page.click('[data-testid="export-products-button"]');
    const download = await downloadPromise;
    
    // Verify download occurred
    expect(download.suggestedFilename()).toContain('products');
    expect(download.suggestedFilename()).toMatch(/\.(csv|xlsx)$/);
  });
});