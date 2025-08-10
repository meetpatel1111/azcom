# Design Document

## Overview

The online shopping platform will be built as a web application using a modern frontend framework with a backend API that manages JSON file-based data storage. The system will provide a responsive user interface for customers and administrators, with RESTful APIs handling business logic and data persistence through structured JSON files.

## Architecture

### High-Level Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend API   │    │   JSON Files    │
│   (React/Vue)   │◄──►│   (Node.js)     │◄──►│   (Database)    │
│                 │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Technology Stack
- **Frontend**: React.js with React Router for SPA navigation
- **Backend**: Node.js with Express.js framework
- **Data Storage**: JSON files with file system operations
- **Authentication**: JWT tokens for session management
- **Styling**: CSS modules or Tailwind CSS

## Components and Interfaces

### Frontend Components

#### Core Components
- **App**: Main application component with routing
- **Header**: Navigation, search bar, cart icon, user menu
- **ProductList**: Grid/list view of products with filtering
- **ProductCard**: Individual product display component
- **ProductDetail**: Detailed product view with add to cart
- **ShoppingCart**: Cart contents with quantity controls
- **Checkout**: Order form with shipping and payment
- **UserAuth**: Login/register forms
- **UserProfile**: Account management and order history
- **AdminPanel**: Product management interface (if admin)

#### State Management
- **ProductStore**: Product catalog and search state
- **CartStore**: Shopping cart contents and totals
- **UserStore**: Authentication state and user data
- **OrderStore**: Order history and current order state

### Backend API Endpoints

#### Product Management
- `GET /api/products` - List all products with optional filtering
- `GET /api/products/:id` - Get specific product details
- `POST /api/products` - Create new product (admin only)
- `PUT /api/products/:id` - Update product (admin only)
- `DELETE /api/products/:id` - Delete product (admin only)

#### User Management
- `POST /api/auth/register` - Create new user account
- `POST /api/auth/login` - Authenticate user
- `POST /api/auth/logout` - End user session
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile

#### Shopping Cart
- `GET /api/cart` - Get current user's cart
- `POST /api/cart/items` - Add item to cart
- `PUT /api/cart/items/:id` - Update cart item quantity
- `DELETE /api/cart/items/:id` - Remove item from cart
- `DELETE /api/cart` - Clear entire cart

#### Order Management
- `POST /api/orders` - Create new order from cart
- `GET /api/orders` - Get user's order history
- `GET /api/orders/:id` - Get specific order details

### Data Models

#### Product Model
```json
{
  "id": "string",
  "name": "string",
  "description": "string",
  "price": "number",
  "category": "string",
  "imageUrl": "string",
  "inventory": "number",
  "createdAt": "string",
  "updatedAt": "string"
}
```

#### User Model
```json
{
  "id": "string",
  "email": "string",
  "passwordHash": "string",
  "firstName": "string",
  "lastName": "string",
  "address": {
    "street": "string",
    "city": "string",
    "state": "string",
    "zipCode": "string"
  },
  "role": "customer|admin",
  "createdAt": "string"
}
```

#### Cart Model
```json
{
  "userId": "string",
  "items": [
    {
      "productId": "string",
      "quantity": "number",
      "addedAt": "string"
    }
  ],
  "updatedAt": "string"
}
```

#### Order Model
```json
{
  "id": "string",
  "userId": "string",
  "items": [
    {
      "productId": "string",
      "productName": "string",
      "price": "number",
      "quantity": "number"
    }
  ],
  "totalAmount": "number",
  "status": "pending|processing|shipped|delivered|cancelled",
  "shippingAddress": "object",
  "paymentInfo": "object",
  "createdAt": "string",
  "updatedAt": "string"
}
```

### JSON File Structure

#### File Organization
```
data/
├── products.json      # All product data
├── users.json         # User accounts
├── carts.json         # Shopping carts
├── orders.json        # Order history
└── config.json        # Application configuration
```

#### Data Access Layer
- **FileManager**: Handles JSON file read/write operations with error handling
- **DataRepository**: Provides CRUD operations for each data model
- **CacheManager**: In-memory caching for frequently accessed data
- **LockManager**: File locking mechanism for concurrent access

## Error Handling

### Frontend Error Handling
- **Network Errors**: Display user-friendly messages for API failures
- **Validation Errors**: Real-time form validation with clear error messages
- **Authentication Errors**: Redirect to login with appropriate messaging
- **Loading States**: Show spinners/skeletons during data fetching

### Backend Error Handling
- **File System Errors**: Graceful handling of JSON file corruption or access issues
- **Validation Errors**: Input validation with detailed error responses
- **Authentication Errors**: Proper HTTP status codes and error messages
- **Concurrency Errors**: Retry mechanisms for file locking conflicts

### Data Integrity
- **Backup Strategy**: Regular JSON file backups
- **Validation**: Schema validation for all JSON data
- **Recovery**: Automatic recovery from corrupted files using backups
- **Logging**: Comprehensive error logging for debugging

## Testing Strategy

### Unit Testing
- **Frontend**: Component testing with React Testing Library
- **Backend**: API endpoint testing with Jest and Supertest
- **Data Layer**: JSON file operations and data model validation
- **Utilities**: Helper functions and business logic

### Integration Testing
- **API Integration**: End-to-end API workflow testing
- **File System**: JSON file persistence and retrieval
- **Authentication**: Login/logout and session management
- **Cart Operations**: Add/remove/update cart functionality

### End-to-End Testing
- **User Workflows**: Complete shopping journey from browse to order
- **Admin Workflows**: Product management and inventory updates
- **Cross-browser**: Testing across different browsers and devices
- **Performance**: Load testing with multiple concurrent users

### Test Data Management
- **Mock Data**: Structured test data for development and testing
- **Test Fixtures**: Reusable test scenarios and data sets
- **Database Reset**: Clean slate testing with fresh JSON files
- **Seed Data**: Initial data population for testing environments