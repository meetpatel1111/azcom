# End-to-End Test Suite

This directory contains comprehensive end-to-end tests for the online shopping platform using Playwright.

## Test Coverage

### 1. Customer Shopping Journey (`customer-shopping-journey.spec.ts`)
Tests the complete customer workflow from browsing to order completion:
- **Product Browsing** (Req 1.1): Homepage product display
- **Product Search** (Req 1.2): Keyword-based product search
- **Product Details** (Req 1.3): Individual product information display
- **Category Filtering** (Req 1.4): Filter products by category
- **Add to Cart** (Req 2.1): Adding products to shopping cart
- **Cart Management** (Req 2.2, 2.3, 2.4): View, update, and remove cart items
- **Cart Persistence** (Req 3.3): Cart restoration after login
- **Checkout Process** (Req 4.1, 4.2): Order placement with shipping/payment
- **Order History** (Req 4.3): View past orders and order details
- **Inventory Updates** (Req 4.4): Inventory reduction after purchase

### 2. User Authentication (`user-authentication.spec.ts`)
Tests all authentication-related functionality:
- **User Registration** (Req 3.1): New account creation with validation
- **User Login** (Req 3.2): Authentication with valid/invalid credentials
- **User Logout** (Req 3.4): Session termination
- **Protected Routes**: Access control for authenticated pages
- **Profile Management**: User profile updates
- **Session Persistence**: Login state across page refreshes
- **Form Validation**: Email and password validation
- **Duplicate Prevention**: Prevent duplicate email registration

### 3. Admin Product Management (`admin-product-management.spec.ts`)
Tests administrative functionality:
- **Product Creation** (Req 5.1): Add new products to catalog
- **Product Updates** (Req 5.2): Modify existing product information
- **Product Deletion** (Req 5.3): Remove products from catalog
- **Inventory Management** (Req 5.4): Stock level monitoring and updates
- **Admin Access Control**: Restrict admin features to admin users
- **Form Validation**: Product form validation and error handling
- **Bulk Operations**: Bulk inventory updates and product export

### 4. Cross-Browser Compatibility (`cross-browser.spec.ts`)
Tests platform compatibility across different browsers and devices:
- **Multi-Browser Support**: Chrome, Firefox, Safari testing
- **Responsive Design**: Desktop, tablet, and mobile layouts
- **Mobile Interactions**: Touch gestures and mobile navigation
- **Performance Testing**: Page load times and search performance
- **Accessibility**: Keyboard navigation and screen reader support
- **Error Handling**: Network and server error scenarios

### 5. Edge Cases and Error Scenarios (`edge-cases.spec.ts`)
Tests error conditions and edge cases:
- **Out of Stock**: Handling products with zero inventory
- **Inventory Conflicts**: Concurrent inventory changes during checkout
- **Session Expiration**: Authentication timeout during checkout
- **Large Quantities**: Cart quantity limits and validation
- **Concurrent Access**: Multiple tabs/users modifying same cart
- **Malformed Input**: XSS prevention and input sanitization
- **Payment Validation**: Credit card and form validation
- **Network Issues**: Connection failures and retry mechanisms
- **Browser Navigation**: Back/forward button handling
- **Race Conditions**: Rapid clicking and duplicate prevention

## Test Infrastructure

### Test Helpers (`utils/test-helpers.ts`)
Reusable helper methods for common test operations:
- Authentication helpers (login, logout, register)
- Product interaction helpers (search, filter, add to cart)
- Cart management helpers (view, update, remove items)
- Checkout helpers (shipping, payment, order placement)
- Admin helpers (product CRUD operations)
- Assertion helpers (verify cart contents, order confirmation)

### Test Data (`fixtures/test-data.ts`)
Structured test data including:
- Test user accounts (customer, admin, new user)
- Test products (laptop, book, clothing)
- Test order information (shipping, payment details)

### Global Setup (`setup/global-setup.ts`)
Pre-test environment preparation:
- Backend health check and readiness verification
- Test user account creation
- Test product catalog setup
- Database initialization

### Global Teardown (`setup/global-teardown.ts`)
Post-test cleanup:
- Test data cleanup
- Temporary product removal
- Environment reset

## Configuration

The tests are configured in `playwright.config.ts` with:
- **Multi-browser support**: Chrome, Firefox, Safari, Mobile Chrome, Mobile Safari
- **Parallel execution**: Tests run in parallel for faster execution
- **Automatic server startup**: Frontend and backend servers start automatically
- **Retry logic**: Failed tests retry on CI environments
- **Trace collection**: Performance traces for debugging failures
- **HTML reporting**: Comprehensive test reports

## Running Tests

### Prerequisites
1. Ensure both frontend and backend servers can start
2. Backend should be accessible at `http://localhost:3001`
3. Frontend should be accessible at `http://localhost:3000`

### Commands
```bash
# Run all E2E tests
npm run test:e2e

# Run tests in headed mode (visible browser)
npm run test:e2e -- --headed

# Run specific test file
npm run test:e2e -- customer-shopping-journey.spec.ts

# Run tests for specific browser
npm run test:e2e -- --project=chromium

# Generate and view test report
npm run test:e2e -- --reporter=html
npx playwright show-report
```

### Debug Mode
```bash
# Run tests in debug mode
npm run test:e2e -- --debug

# Run with UI mode for interactive debugging
npx playwright test --ui
```

## Test Data Requirements

The tests expect the following data to be available:
- Admin user: `admin@test.com` / `admin123`
- Customer user: `customer@test.com` / `password123`
- Test products: Laptop ($999.99), Book ($29.99), T-Shirt ($19.99)

This data is automatically created by the global setup script.

## Continuous Integration

The test suite is designed for CI environments with:
- Automatic retry on failure
- Headless browser execution
- Parallel test execution (disabled on CI for stability)
- HTML report generation
- Screenshot and video capture on failure

## Maintenance

### Adding New Tests
1. Create test files following the naming convention: `*.spec.ts`
2. Use the TestHelpers class for common operations
3. Add new test data to `fixtures/test-data.ts` if needed
4. Update this README with new test coverage

### Updating Test Data
1. Modify `fixtures/test-data.ts` for new test scenarios
2. Update `global-setup.ts` if new data setup is required
3. Ensure `global-teardown.ts` cleans up new test data

### Debugging Failed Tests
1. Check the HTML report for detailed failure information
2. Review screenshots and videos captured on failure
3. Use `--headed` mode to watch tests execute
4. Use `--debug` mode to step through tests interactively