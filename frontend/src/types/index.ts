// API Response Types
export interface ApiResponse<T = any> {
  data?: T;
  message?: string;
  error?: string;
  details?: Array<{
    field: string;
    message: string;
  }>;
}

// User Types
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'customer' | 'admin';
  address?: Address;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
}

// Product Types
export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl: string;
  inventory: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProductFilters {
  search?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  sortBy?: 'name' | 'price' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

// Cart Types
export interface CartItem {
  productId: string;
  quantity: number;
  addedAt: string;
  product?: Product;
}

export interface Cart {
  id: string;
  userId: string;
  items: CartItem[];
  createdAt: string;
  updatedAt: string;
}

export interface CartSummary {
  itemCount: number;
  uniqueItems: number;
  subtotal: number;
  total: number;
  isEmpty: boolean;
}

// Order Types
export interface OrderItem {
  productId: string;
  productName: string;
  price: number;
  quantity: number;
}

export interface Order {
  id: string;
  userId: string;
  items: OrderItem[];
  totalAmount: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  shippingAddress: Address;
  paymentInfo: {
    method: string;
    cardLast4?: string;
    cardBrand?: string;
  };
  createdAt: string;
  updatedAt: string;
  statusUpdatedAt?: string;
}

export interface OrderTracking {
  orderId: string;
  currentStatus: string;
  timeline: Array<{
    status: string;
    title: string;
    description: string;
    date: string;
    completed: boolean;
    estimated?: boolean;
  }>;
  estimatedDelivery?: string;
  trackingInfo: {
    canCancel: boolean;
    canReturn: boolean;
    canReorder: boolean;
  };
}

// Pagination Types
export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// API Error Types
export interface ApiError {
  error: string;
  message: string;
  details?: Array<{
    field: string;
    message: string;
  }>;
}

// Form Types
export interface LoginForm {
  email: string;
  password: string;
}

export interface RegisterForm {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  address?: Address;
}

export interface CheckoutForm {
  shippingAddress: Address;
  paymentInfo: {
    method: 'credit_card' | 'debit_card' | 'paypal' | 'bank_transfer';
    cardLast4?: string;
    cardBrand?: string;
    transactionId?: string;
  };
}

// Component Props Types
export interface LoadingState {
  isLoading: boolean;
  error: string | null;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: Pagination;
}