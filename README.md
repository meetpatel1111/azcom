# Online Shopping Platform

A full-stack e-commerce web application built with React frontend, Node.js backend, and JSON file-based database storage.

## Features

- Product browsing and search
- Shopping cart management
- User authentication and profiles
- Order processing and history
- Admin product management
- JSON file-based data persistence

## Project Structure

```
├── frontend/          # React frontend application
├── backend/           # Node.js Express API server
├── data/             # JSON database files
└── README.md
```

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Install backend dependencies:
```bash
cd backend
npm install
```

2. Install frontend dependencies:
```bash
cd frontend
npm install
```

### Running the Application

1. Start the backend server:
```bash
cd backend
npm run dev
```

2. Start the frontend development server:
```bash
cd frontend
npm run dev
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001

## API Documentation

The backend provides RESTful APIs for:
- Authentication (`/api/auth/*`)
- Products (`/api/products/*`)
- Shopping Cart (`/api/cart/*`)
- Orders (`/api/orders/*`)
- User Profile (`/api/users/*`)

## Testing

Run tests for backend:
```bash
cd backend
npm test
```

Run tests for frontend:
```bash
cd frontend
npm test
```