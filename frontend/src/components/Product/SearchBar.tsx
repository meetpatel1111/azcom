import React, { useState, useEffect } from 'react';

interface SearchBarProps {
  value?: string;
  onChange?: (query: string) => void;
  onSearch?: (query: string) => void;
  placeholder?: string;
  initialValue?: string;
  debounceMs?: number;
}

const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChange,
  onSearch,
  placeholder = 'Search products...',
  initialValue = '',
  debounceMs = 300,
}) => {
  const [searchQuery, setSearchQuery] = useState(value || initialValue);

  // Update internal state when value prop changes
  useEffect(() => {
    if (value !== undefined) {
      setSearchQuery(value);
    }
  }, [value]);

  // Debounce search to avoid too many API calls
  useEffect(() => {
    if (onSearch) {
      const timeoutId = setTimeout(() => {
        onSearch(searchQuery);
      }, debounceMs);

      return () => clearTimeout(timeoutId);
    }
  }, [searchQuery, onSearch, debounceMs]);

  const handleClear = () => {
    setSearchQuery('');
  };

  return (
    <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <svg
          className="h-5 w-5 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>
      
      <input
        type="text"
        value={searchQuery}
        onChange={(e) => {
          setSearchQuery(e.target.value);
          if (onChange) {
            onChange(e.target.value);
          }
        }}
        data-testid="search-input"
        className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
        placeholder={placeholder}
      />
      
      {searchQuery && (
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
          <button
            type="button"
            onClick={handleClear}
            className="text-gray-400 hover:text-gray-600 focus:outline-none focus:text-gray-600"
            aria-label="Clear search"
          >
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
};

export default SearchBar;