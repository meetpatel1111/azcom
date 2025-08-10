import React, { useState, useEffect } from 'react';
import { Product } from '../../types';
import { FormInput, LoadingSpinner, ErrorMessage, SuccessMessage } from '../UI';

interface ProductFormProps {
  product?: Product;
  onSubmit: (productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  error?: string | null;
  successMessage?: string | null;
}

interface ProductFormData {
  name: string;
  description: string;
  price: string;
  category: string;
  imageUrl: string;
  inventory: string;
}

const initialFormData: ProductFormData = {
  name: '',
  description: '',
  price: '',
  category: '',
  imageUrl: '',
  inventory: '',
};

const ProductForm: React.FC<ProductFormProps> = ({
  product,
  onSubmit,
  onCancel,
  isLoading = false,
  error,
  successMessage,
}) => {
  const [formData, setFormData] = useState<ProductFormData>(initialFormData);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Populate form when editing existing product
  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name,
        description: product.description,
        price: product.price.toString(),
        category: product.category,
        imageUrl: product.imageUrl,
        inventory: product.inventory.toString(),
      });
    } else {
      setFormData(initialFormData);
    }
  }, [product]);

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) {
      errors.name = 'Product name is required';
    }

    if (!formData.description.trim()) {
      errors.description = 'Product description is required';
    }

    if (!formData.price.trim()) {
      errors.price = 'Price is required';
    } else {
      const price = parseFloat(formData.price);
      if (isNaN(price) || price <= 0) {
        errors.price = 'Price must be a positive number';
      }
    }

    if (!formData.category.trim()) {
      errors.category = 'Category is required';
    }

    if (!formData.imageUrl.trim()) {
      errors.imageUrl = 'Image URL is required';
    } else {
      try {
        new URL(formData.imageUrl);
      } catch {
        errors.imageUrl = 'Please enter a valid URL';
      }
    }

    if (!formData.inventory.trim()) {
      errors.inventory = 'Inventory is required';
    } else {
      const inventory = parseInt(formData.inventory);
      if (isNaN(inventory) || inventory < 0) {
        errors.inventory = 'Inventory must be a non-negative number';
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (field: keyof ProductFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear validation error when user starts typing
    if (validationErrors[field]) {
      setValidationErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const productData = {
      name: formData.name.trim(),
      description: formData.description.trim(),
      price: parseFloat(formData.price),
      category: formData.category.trim(),
      imageUrl: formData.imageUrl.trim(),
      inventory: parseInt(formData.inventory),
    };

    await onSubmit(productData);
  };

  const isEditing = !!product;

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          {isEditing ? 'Edit Product' : 'Add New Product'}
        </h2>
        <button
          onClick={onCancel}
          className="text-gray-500 hover:text-gray-700 text-xl font-bold"
          disabled={isLoading}
        >
          ×
        </button>
      </div>

      {error && <ErrorMessage message={error} className="mb-4" />}
      {successMessage && <SuccessMessage message={successMessage} className="mb-4" />}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormInput
            label="Product Name"
            type="text"
            value={formData.name}
            onChange={(value) => handleInputChange('name', value)}
            error={validationErrors.name}
            required
            disabled={isLoading}
            data-testid="product-name-input"
          />

          <FormInput
            label="Category"
            type="text"
            value={formData.category}
            onChange={(value) => handleInputChange('category', value)}
            error={validationErrors.category}
            required
            disabled={isLoading}
            placeholder="e.g., Electronics, Clothing, Books"
            data-testid="product-category-select"
          />

          <FormInput
            label="Price ($)"
            type="number"
            value={formData.price}
            onChange={(value) => handleInputChange('price', value)}
            error={validationErrors.price}
            required
            disabled={isLoading}
            min="0"
            step="0.01"
            data-testid="product-price-input"
          />

          <FormInput
            label="Inventory"
            type="number"
            value={formData.inventory}
            onChange={(value) => handleInputChange('inventory', value)}
            error={validationErrors.inventory}
            required
            disabled={isLoading}
            min="0"
            data-testid="product-inventory-input"
          />
        </div>

        <FormInput
          label="Image URL"
          type="url"
          value={formData.imageUrl}
          onChange={(value) => handleInputChange('imageUrl', value)}
          error={validationErrors.imageUrl}
          required
          disabled={isLoading}
          placeholder="https://example.com/image.jpg"
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description *
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            data-testid="product-description-input"
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              validationErrors.description ? 'border-red-500' : 'border-gray-300'
            }`}
            rows={4}
            required
            disabled={isLoading}
            placeholder="Enter product description..."
          />
          {validationErrors.description && (
            <p className="mt-1 text-sm text-red-600">{validationErrors.description}</p>
          )}
        </div>

        {/* Image Preview */}
        {formData.imageUrl && !validationErrors.imageUrl && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Image Preview
            </label>
            <img
              src={formData.imageUrl}
              alt="Product preview"
              className="w-32 h-32 object-cover rounded-md border"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
              }}
            />
          </div>
        )}

        <div className="flex justify-end space-x-4 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            type="submit"
            data-testid="save-product-button"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 flex items-center"
            disabled={isLoading}
          >
            {isLoading && <LoadingSpinner size="sm" className="mr-2" />}
            {isEditing ? 'Update Product' : 'Create Product'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProductForm;