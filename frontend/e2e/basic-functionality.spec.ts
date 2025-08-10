import { test, expect } from '@playwright/test';

test.describe('Basic Functionality Tests', () => {
  test('homepage loads successfully', async ({ page }) => {
    await page.goto('/');
    
    // Check if the page loads
    await expect(page).toHaveTitle(/Shopping/i);
    
    // Check for basic elements
    await expect(page.locator('body')).toBeVisible();
  });

  test('backend health check works', async ({ page }) => {
    // Test backend health endpoint
    const response = await page.request.get('http://localhost:3001/api/health');
    expect(response.ok()).toBeTruthy();
    
    const data = await response.json();
    expect(data.status).toBe('healthy');
  });

  test('can navigate to login page', async ({ page }) => {
    await page.goto('/');
    
    // Look for login link and click it
    const loginLink = page.locator('a[href="/login"], [data-testid="login-link"]').first();
    if (await loginLink.isVisible()) {
      await loginLink.click();
      await expect(page).toHaveURL('/login');
    } else {
      // If no login link, navigate directly
      await page.goto('/login');
      await expect(page).toHaveURL('/login');
    }
  });

  test('can navigate to register page', async ({ page }) => {
    await page.goto('/');
    
    // Look for register link and click it
    const registerLink = page.locator('a[href="/register"], [data-testid="register-link"]').first();
    if (await registerLink.isVisible()) {
      await registerLink.click();
      await expect(page).toHaveURL('/register');
    } else {
      // If no register link, navigate directly
      await page.goto('/register');
      await expect(page).toHaveURL('/register');
    }
  });

  test('products API endpoint works', async ({ page }) => {
    // Test products endpoint
    const response = await page.request.get('http://localhost:3001/api/products');
    expect(response.ok()).toBeTruthy();
    
    const products = await response.json();
    expect(Array.isArray(products)).toBeTruthy();
  });
});