import React, { useState, useEffect } from 'react';
import ProductList from '../components/Product/ProductList';
import SearchBar from '../components/Product/SearchBar';
import ProductFilters from '../components/Product/ProductFilters';
import SortOptions from '../components/Product/SortOptions';
import { Product, ProductFilters as ProductFiltersType } from '../types';
import * as productService from '../services/productService';

const Products: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<ProductFiltersType>({
    search: '',
    category: '',
    minPrice: undefined,
    maxPrice: undefined,
    inStock: undefined,
    sortBy: 'name',
    sortOrder: 'asc',
  });

  // Fetch products on component mount
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await productService.getProducts(filters);
        setProducts(response.data);
        setFilteredProducts(response.data);
      } catch (err: any) {
        setError(err.message || 'Failed to load products');
        setProducts([]);
        setFilteredProducts([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, [filters]);

  const handleFiltersChange = (newFilters: ProductFiltersType) => {
    setFilters(newFilters);
  };

  const handleSearchChange = (search: string) => {
    setFilters(prev => ({ ...prev, search }));
  };

  const handleSortChange = (sortBy: string, sortOrder: 'asc' | 'desc') => {
    setFilters(prev => ({ ...prev, sortBy, sortOrder }));
  };

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error loading products</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
              <div className="mt-4">
                <button
                  onClick={() => window.location.reload()}
                  className="bg-red-100 px-2 py-1 rounded text-sm text-red-800 hover:bg-red-200"
                >
                  Try again
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Products</h1>
      </div>

      {/* Search and Filters */}
      <div className="mb-8 space-y-4">
        <SearchBar
          value={filters.search || ''}
          onChange={handleSearchChange}
          placeholder="Search products..."
        />
        
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <ProductFilters
            filters={filters}
            onFiltersChange={handleFiltersChange}
            categories={[...new Set(products.map(p => p.category))]}
          />
          
          <SortOptions
            sortBy={filters.sortBy || 'name'}
            sortOrder={filters.sortOrder || 'asc'}
            onSortChange={handleSortChange}
          />
        </div>
      </div>

      {/* Product List */}
      <ProductList
        products={filteredProducts}
        isLoading={isLoading}
      />
    </div>
  );
};

export default Products;