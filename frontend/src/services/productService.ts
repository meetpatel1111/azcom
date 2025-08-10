import { apiClient, handleApiError } from './api';
import { Product, ProductFilters, PaginatedResponse } from '../types';

export interface ProductSearchParams extends ProductFilters {
  page?: number;
  limit?: number;
}

export const productService = {
  // Get all products with optional filtering and pagination
  getProducts: async (params?: ProductSearchParams): Promise<PaginatedResponse<Product>> => {
    try {
      return await apiClient.get('/products', params);
    } catch (error: any) {
      throw handleApiError(error);
    }
  },

  // Get a single product by ID
  getProduct: async (id: string): Promise<Product> => {
    try {
      return await apiClient.get(`/products/${id}`);
    } catch (error: any) {
      throw handleApiError(error);
    }
  },

  // Search products by query
  searchProducts: async (query: string, filters?: ProductFilters): Promise<Product[]> => {
    try {
      const params = { search: query, ...filters };
      const response = await apiClient.get('/products', params);
      return response.data || [];
    } catch (error: any) {
      throw handleApiError(error);
    }
  },

  // Get product categories
  getCategories: async (): Promise<string[]> => {
    try {
      return await apiClient.get('/products/categories');
    } catch (error: any) {
      throw handleApiError(error);
    }
  },

  // Admin functions
  createProduct: async (productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product> => {
    try {
      return await apiClient.post('/products', productData);
    } catch (error: any) {
      throw handleApiError(error);
    }
  },

  updateProduct: async (id: string, productData: Partial<Omit<Product, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Product> => {
    try {
      return await apiClient.put(`/products/${id}`, productData);
    } catch (error: any) {
      throw handleApiError(error);
    }
  },

  deleteProduct: async (id: string): Promise<void> => {
    try {
      await apiClient.delete(`/products/${id}`);
    } catch (error: any) {
      throw handleApiError(error);
    }
  },

  // Get products with low inventory (for admin dashboard)
  getLowInventoryProducts: async (threshold: number = 10): Promise<Product[]> => {
    try {
      const response = await apiClient.get('/products', { 
        inStock: true,
        sortBy: 'inventory',
        sortOrder: 'asc',
        limit: 100
      });
      return (response.data || []).filter((product: Product) => product.inventory <= threshold);
    } catch (error: any) {
      throw handleApiError(error);
    }
  },
};