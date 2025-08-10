import React from 'react';
import { ProductFilters } from '../../types';

interface SortOption {
  value: string;
  label: string;
  sortBy: ProductFilters['sortBy'];
  sortOrder: ProductFilters['sortOrder'];
}

interface SortOptionsProps {
  currentSort: {
    sortBy?: ProductFilters['sortBy'];
    sortOrder?: ProductFilters['sortOrder'];
  };
  onSortChange: (sortBy: ProductFilters['sortBy'], sortOrder: ProductFilters['sortOrder']) => void;
}

const sortOptions: SortOption[] = [
  { value: 'name-asc', label: 'Name (A-Z)', sortBy: 'name', sortOrder: 'asc' },
  { value: 'name-desc', label: 'Name (Z-A)', sortBy: 'name', sortOrder: 'desc' },
  { value: 'price-asc', label: 'Price (Low to High)', sortBy: 'price', sortOrder: 'asc' },
  { value: 'price-desc', label: 'Price (High to Low)', sortBy: 'price', sortOrder: 'desc' },
  { value: 'newest', label: 'Newest First', sortBy: 'createdAt', sortOrder: 'desc' },
  { value: 'oldest', label: 'Oldest First', sortBy: 'createdAt', sortOrder: 'asc' },
];

const SortOptions: React.FC<SortOptionsProps> = ({ currentSort, onSortChange }) => {
  const getCurrentSortValue = () => {
    const option = sortOptions.find(
      (opt) => opt.sortBy === currentSort.sortBy && opt.sortOrder === currentSort.sortOrder
    );
    return option?.value || 'name-asc';
  };

  const handleSortChange = (value: string) => {
    const option = sortOptions.find((opt) => opt.value === value);
    if (option) {
      onSortChange(option.sortBy, option.sortOrder);
    }
  };

  return (
    <div className="flex items-center space-x-2">
      <label htmlFor="sort-select" className="text-sm font-medium text-gray-700">
        Sort by:
      </label>
      <select
        id="sort-select"
        value={getCurrentSortValue()}
        onChange={(e) => handleSortChange(e.target.value)}
        className="block w-48 pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-md"
      >
        {sortOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
};

export default SortOptions;