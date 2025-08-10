import { test, expect } from '@playwright/test';
import { TestHelpers } from './utils/test-helpers';
import { testUsers } from './fixtures/test-data';

test.describe('User Authentication Flow', () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
  });

  test('user registration flow', async ({ page }) => {
    // Requirement 3.1: User registration
    const newUser = {
      email: `test${Date.now()}@example.com`,
      password: 'testpass123',
      firstName: 'Test',
      lastName: 'User'
    };

    await page.goto('/register');
    
    // Verify registration form is visible
    await expect(page.locator('[data-testid="register-form"]')).toBeVisible();
    
    // Fill registration form
    await page.fill('[data-testid="email-input"]', newUser.email);
    await page.fill('[data-testid="password-input"]', newUser.password);
    await page.fill('[data-testid="firstName-input"]', newUser.firstName);
    await page.fill('[data-testid="lastName-input"]', newUser.lastName);
    
    // Submit registration
    await page.click('[data-testid="register-button"]');
    
    // Verify successful registration (should redirect to login or dashboard)
    await expect(page).toHaveURL(/\/(login|dashboard|profile)/);
    
    // Verify success message
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
  });

  test('user login with valid credentials', async ({ page }) => {
    // Requirement 3.2: User authentication
    await page.goto('/login');
    
    // Verify login form is visible
    await expect(page.locator('[data-testid="login-form"]')).toBeVisible();
    
    // Fill login credentials
    await page.fill('[data-testid="email-input"]', testUsers.customer.email);
    await page.fill('[data-testid="password-input"]', testUsers.customer.password);
    
    // Submit login
    await page.click('[data-testid="login-button"]');
    
    // Verify successful login
    await expect(page).toHaveURL('/');
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
    await expect(page.locator('[data-testid="user-name"]')).toContainText(testUsers.customer.firstName);
  });

  test('user login with invalid credentials', async ({ page }) => {
    await page.goto('/login');
    
    // Try login with invalid credentials
    await page.fill('[data-testid="email-input"]', 'invalid@example.com');
    await page.fill('[data-testid="password-input"]', 'wrongpassword');
    await page.click('[data-testid="login-button"]');
    
    // Verify error message
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="error-message"]')).toContainText('Invalid credentials');
    
    // Verify still on login page
    await expect(page).toHaveURL('/login');
  });

  test('user logout flow', async ({ page }) => {
    // Requirement 3.4: User logout
    await helpers.loginAsCustomer();
    
    // Verify user is logged in
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
    
    // Logout
    await helpers.logout();
    
    // Verify user is logged out
    await expect(page.locator('[data-testid="user-menu"]')).not.toBeVisible();
    await expect(page.locator('[data-testid="login-link"]')).toBeVisible();
  });

  test('protected route access without authentication', async ({ page }) => {
    // Try to access protected route without login
    await page.goto('/profile');
    
    // Should redirect to login page
    await expect(page).toHaveURL('/login');
    await expect(page.locator('[data-testid="login-required-message"]')).toBeVisible();
  });

  test('user profile management', async ({ page }) => {
    await helpers.loginAsCustomer();
    
    // Navigate to profile page
    await page.click('[data-testid="user-menu"]');
    await page.click('[data-testid="profile-link"]');
    
    // Verify profile page
    await expect(page).toHaveURL('/profile');
    await expect(page.locator('[data-testid="profile-form"]')).toBeVisible();
    
    // Verify current user data is displayed
    await expect(page.locator('[data-testid="email-input"]')).toHaveValue(testUsers.customer.email);
    await expect(page.locator('[data-testid="firstName-input"]')).toHaveValue(testUsers.customer.firstName);
    await expect(page.locator('[data-testid="lastName-input"]')).toHaveValue(testUsers.customer.lastName);
    
    // Update profile information
    const updatedFirstName = 'UpdatedJohn';
    await page.fill('[data-testid="firstName-input"]', updatedFirstName);
    await page.click('[data-testid="save-profile-button"]');
    
    // Verify success message
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
    
    // Verify updated name in header
    await expect(page.locator('[data-testid="user-name"]')).toContainText(updatedFirstName);
  });

  test('password validation during registration', async ({ page }) => {
    await page.goto('/register');
    
    // Try registration with weak password
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', '123'); // Too short
    await page.fill('[data-testid="firstName-input"]', 'Test');
    await page.fill('[data-testid="lastName-input"]', 'User');
    
    await page.click('[data-testid="register-button"]');
    
    // Verify password validation error
    await expect(page.locator('[data-testid="password-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="password-error"]')).toContainText('Password must be at least 8 characters');
  });

  test('email validation during registration', async ({ page }) => {
    await page.goto('/register');
    
    // Try registration with invalid email
    await page.fill('[data-testid="email-input"]', 'invalid-email');
    await page.fill('[data-testid="password-input"]', 'validpass123');
    await page.fill('[data-testid="firstName-input"]', 'Test');
    await page.fill('[data-testid="lastName-input"]', 'User');
    
    await page.click('[data-testid="register-button"]');
    
    // Verify email validation error
    await expect(page.locator('[data-testid="email-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="email-error"]')).toContainText('Please enter a valid email address');
  });

  test('duplicate email registration prevention', async ({ page }) => {
    await page.goto('/register');
    
    // Try to register with existing email
    await page.fill('[data-testid="email-input"]', testUsers.customer.email);
    await page.fill('[data-testid="password-input"]', 'NewPassword123');
    await page.fill('[data-testid="firstName-input"]', 'New');
    await page.fill('[data-testid="lastName-input"]', 'User');
    
    await page.click('[data-testid="register-button"]');
    
    // Verify duplicate email error
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="error-message"]')).toContainText('Email already exists');
  });

  test('session persistence across page refreshes', async ({ page }) => {
    await helpers.loginAsCustomer();
    
    // Verify user is logged in
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
    
    // Refresh the page
    await page.reload();
    
    // Verify user is still logged in
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
    await expect(page.locator('[data-testid="user-name"]')).toContainText(testUsers.customer.firstName);
  });

  test('automatic redirect after login', async ({ page }) => {
    // Try to access protected route, get redirected to login
    await page.goto('/profile');
    await expect(page).toHaveURL('/login');
    
    // Login
    await page.fill('[data-testid="email-input"]', testUsers.customer.email);
    await page.fill('[data-testid="password-input"]', testUsers.customer.password);
    await page.click('[data-testid="login-button"]');
    
    // Should redirect back to originally requested page
    await expect(page).toHaveURL('/profile');
  });
});