import React, { useState } from 'react';
import { ProductFilters as IProductFilters } from '../../types';
import CategoryFilter from './CategoryFilter';

interface ProductFiltersProps {
  categories: string[];
  filters: IProductFilters;
  onFiltersChange: (filters: Partial<IProductFilters>) => void;
  isLoading?: boolean;
}

const ProductFilters: React.FC<ProductFiltersProps> = ({
  categories,
  filters,
  onFiltersChange,
  isLoading = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [priceRange, setPriceRange] = useState({
    min: filters.minPrice?.toString() || '',
    max: filters.maxPrice?.toString() || '',
  });

  const handleCategoryChange = (category: string | null) => {
    onFiltersChange({ category: category || undefined });
  };

  const handlePriceRangeChange = (field: 'min' | 'max', value: string) => {
    const newPriceRange = { ...priceRange, [field]: value };
    setPriceRange(newPriceRange);

    // Apply price filter
    const minPrice = newPriceRange.min ? parseFloat(newPriceRange.min) : undefined;
    const maxPrice = newPriceRange.max ? parseFloat(newPriceRange.max) : undefined;

    onFiltersChange({
      minPrice: minPrice && !isNaN(minPrice) ? minPrice : undefined,
      maxPrice: maxPrice && !isNaN(maxPrice) ? maxPrice : undefined,
    });
  };

  const handleInStockToggle = () => {
    onFiltersChange({ inStock: !filters.inStock });
  };

  const clearAllFilters = () => {
    setPriceRange({ min: '', max: '' });
    onFiltersChange({
      category: undefined,
      minPrice: undefined,
      maxPrice: undefined,
      inStock: undefined,
    });
  };

  const hasActiveFilters = !!(
    filters.category ||
    filters.minPrice ||
    filters.maxPrice ||
    filters.inStock
  );

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-medium text-gray-900">Filters</h2>
        <div className="flex items-center space-x-2">
          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              Clear All
            </button>
          )}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="lg:hidden p-1 text-gray-400 hover:text-gray-600"
            aria-label={isExpanded ? 'Collapse filters' : 'Expand filters'}
          >
            <svg
              className={`w-5 h-5 transform transition-transform ${
                isExpanded ? 'rotate-180' : ''
              }`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>
        </div>
      </div>

      <div className={`space-y-6 ${isExpanded ? 'block' : 'hidden lg:block'}`}>
        {/* Category Filter */}
        <CategoryFilter
          categories={categories}
          selectedCategory={filters.category || null}
          onCategoryChange={handleCategoryChange}
          isLoading={isLoading}
        />

        {/* Price Range Filter */}
        <div>
          <h3 className="text-sm font-medium text-gray-900 mb-3">Price Range</h3>
          <div className="flex items-center space-x-2">
            <div className="flex-1">
              <label htmlFor="min-price" className="sr-only">
                Minimum price
              </label>
              <input
                type="number"
                id="min-price"
                placeholder="Min"
                value={priceRange.min}
                onChange={(e) => handlePriceRangeChange('min', e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                min="0"
                step="0.01"
              />
            </div>
            <span className="text-gray-500">to</span>
            <div className="flex-1">
              <label htmlFor="max-price" className="sr-only">
                Maximum price
              </label>
              <input
                type="number"
                id="max-price"
                placeholder="Max"
                value={priceRange.max}
                onChange={(e) => handlePriceRangeChange('max', e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                min="0"
                step="0.01"
              />
            </div>
          </div>
        </div>

        {/* In Stock Filter */}
        <div>
          <h3 className="text-sm font-medium text-gray-900 mb-3">Availability</h3>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={filters.inStock || false}
              onChange={handleInStockToggle}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <span className="ml-2 text-sm text-gray-700">In stock only</span>
          </label>
        </div>
      </div>
    </div>
  );
};

export default ProductFilters;