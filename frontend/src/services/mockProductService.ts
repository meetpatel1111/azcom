import { Product, ProductFilters, PaginatedResponse } from '../types';
import { 
  mockProducts, 
  mockCategories, 
  getMockProductById, 
  getMockProductsByCategory, 
  searchMockProducts 
} from '../data/mockData';

export interface ProductSearchParams extends ProductFilters {
  page?: number;
  limit?: number;
}

// Simulate API delay
const delay = (ms: number = 500) => new Promise(resolve => setTimeout(resolve, ms));

export const mockProductService = {
  // Get all products with optional filtering and pagination
  getProducts: async (params?: ProductSearchParams): Promise<PaginatedResponse<Product>> => {
    await delay(300);
    
    let filteredProducts = [...mockProducts];
    
    // Apply filters
    if (params?.search) {
      filteredProducts = searchMockProducts(params.search);
    }
    
    if (params?.category) {
      filteredProducts = getMockProductsByCategory(params.category);
    }
    
    if (params?.minPrice !== undefined) {
      filteredProducts = filteredProducts.filter(p => p.price >= params.minPrice!);
    }
    
    if (params?.maxPrice !== undefined) {
      filteredProducts = filteredProducts.filter(p => p.price <= params.maxPrice!);
    }
    
    if (params?.inStock) {
      filteredProducts = filteredProducts.filter(p => p.inventory > 0);
    }
    
    // Apply sorting
    if (params?.sortBy) {
      filteredProducts.sort((a, b) => {
        const aValue = a[params.sortBy as keyof Product];
        const bValue = b[params.sortBy as keyof Product];
        
        if (params.sortOrder === 'desc') {
          return bValue > aValue ? 1 : bValue < aValue ? -1 : 0;
        } else {
          return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
        }
      });
    }
    
    // Apply pagination
    const page = params?.page || 1;
    const limit = params?.limit || 12;
    const offset = (page - 1) * limit;
    const paginatedProducts = filteredProducts.slice(offset, offset + limit);
    
    return {
      data: paginatedProducts,
      pagination: {
        page,
        limit,
        total: filteredProducts.length,
        totalPages: Math.ceil(filteredProducts.length / limit),
        hasNext: offset + limit < filteredProducts.length,
        hasPrev: page > 1,
      },
    };
  },

  // Get a single product by ID
  getProduct: async (id: string): Promise<Product> => {
    await delay(200);
    
    const product = getMockProductById(id);
    if (!product) {
      throw new Error('Product not found');
    }
    
    return product;
  },

  // Search products by query
  searchProducts: async (query: string, filters?: ProductFilters): Promise<Product[]> => {
    await delay(300);
    
    let results = searchMockProducts(query);
    
    // Apply additional filters if provided
    if (filters?.category) {
      results = results.filter(p => p.category.toLowerCase() === filters.category!.toLowerCase());
    }
    
    if (filters?.minPrice !== undefined) {
      results = results.filter(p => p.price >= filters.minPrice!);
    }
    
    if (filters?.maxPrice !== undefined) {
      results = results.filter(p => p.price <= filters.maxPrice!);
    }
    
    if (filters?.inStock) {
      results = results.filter(p => p.inventory > 0);
    }
    
    return results;
  },

  // Get product categories
  getCategories: async (): Promise<string[]> => {
    await delay(100);
    return mockCategories;
  },

  // Admin functions (mock implementations)
  createProduct: async (productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product> => {
    await delay(500);
    
    const newProduct: Product = {
      id: `product-${Date.now()}`,
      ...productData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    mockProducts.push(newProduct);
    return newProduct;
  },

  updateProduct: async (id: string, productData: Partial<Omit<Product, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Product> => {
    await delay(400);
    
    const productIndex = mockProducts.findIndex(p => p.id === id);
    if (productIndex === -1) {
      throw new Error('Product not found');
    }
    
    const updatedProduct = {
      ...mockProducts[productIndex],
      ...productData,
      updatedAt: new Date().toISOString(),
    };
    
    mockProducts[productIndex] = updatedProduct;
    return updatedProduct;
  },

  deleteProduct: async (id: string): Promise<void> => {
    await delay(300);
    
    const productIndex = mockProducts.findIndex(p => p.id === id);
    if (productIndex === -1) {
      throw new Error('Product not found');
    }
    
    mockProducts.splice(productIndex, 1);
  },

  // Get products with low inventory (for admin dashboard)
  getLowInventoryProducts: async (threshold: number = 10): Promise<Product[]> => {
    await delay(200);
    
    return mockProducts.filter(product => 
      product.inventory > 0 && product.inventory <= threshold
    );
  },
};