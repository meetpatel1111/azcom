import React, { useState, useEffect } from 'react';
import { Product } from '../../types';
import { mockProductService } from '../../services/mockProductService';
import { useAuth } from '../../context/AuthContext';
import ProductForm from './ProductForm';
import InventoryManager from './InventoryManager';
import { LoadingSpinner, ErrorMessage, SuccessMessage } from '../UI';

type AdminView = 'dashboard' | 'products' | 'inventory' | 'add-product' | 'edit-product';

interface AdminPanelState {
  currentView: AdminView;
  products: Product[];
  selectedProduct: Product | null;
  isLoading: boolean;
  error: string | null;
  successMessage: string | null;
  lowInventoryProducts: Product[];
}

const AdminPanel: React.FC = () => {
  const { user } = useAuth();
  const [state, setState] = useState<AdminPanelState>({
    currentView: 'dashboard',
    products: [],
    selectedProduct: null,
    isLoading: false,
    error: null,
    successMessage: null,
    lowInventoryProducts: [],
  });

  // Check if user is admin
  if (!user || user.role !== 'admin') {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Access Denied</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>You don't have permission to access the admin panel.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  useEffect(() => {
    loadProducts();
    loadLowInventoryProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      const response = await mockProductService.getProducts({ limit: 100 });
      setState(prev => ({ 
        ...prev, 
        products: response.data || [], 
        isLoading: false 
      }));
    } catch (error: any) {
      setState(prev => ({ 
        ...prev, 
        error: error.message || 'Failed to load products', 
        isLoading: false 
      }));
    }
  };

  const loadLowInventoryProducts = async () => {
    try {
      const lowInventory = await mockProductService.getLowInventoryProducts(10);
      setState(prev => ({ ...prev, lowInventoryProducts: lowInventory }));
    } catch (error) {
      console.error('Failed to load low inventory products:', error);
    }
  };

  const handleCreateProduct = async (productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      await mockProductService.createProduct(productData);
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        successMessage: 'Product created successfully!',
        currentView: 'products'
      }));
      await loadProducts();
      await loadLowInventoryProducts();
    } catch (error: any) {
      setState(prev => ({ 
        ...prev, 
        error: error.message || 'Failed to create product', 
        isLoading: false 
      }));
    }
  };

  const handleUpdateProduct = async (productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!state.selectedProduct) return;

    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      await mockProductService.updateProduct(state.selectedProduct.id, productData);
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        successMessage: 'Product updated successfully!',
        currentView: 'products',
        selectedProduct: null
      }));
      await loadProducts();
      await loadLowInventoryProducts();
    } catch (error: any) {
      setState(prev => ({ 
        ...prev, 
        error: error.message || 'Failed to update product', 
        isLoading: false 
      }));
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
      return;
    }

    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      await mockProductService.deleteProduct(productId);
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        successMessage: 'Product deleted successfully!' 
      }));
      await loadProducts();
      await loadLowInventoryProducts();
    } catch (error: any) {
      setState(prev => ({ 
        ...prev, 
        error: error.message || 'Failed to delete product', 
        isLoading: false 
      }));
    }
  };

  const clearMessages = () => {
    setState(prev => ({ ...prev, error: null, successMessage: null }));
  };

  const renderNavigation = () => (
    <nav className="bg-white shadow-sm border-b mb-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex space-x-8">
          {[
            { key: 'dashboard', label: 'Dashboard' },
            { key: 'products', label: 'Products' },
            { key: 'inventory', label: 'Inventory' },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setState(prev => ({ ...prev, currentView: key as AdminView }))}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                state.currentView === key
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </nav>
  );

  const renderDashboard = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                  <span className="text-white font-bold">P</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Products</dt>
                  <dd className="text-lg font-medium text-gray-900">{state.products.length}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                  <span className="text-white font-bold">!</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Low Inventory</dt>
                  <dd className="text-lg font-medium text-gray-900">{state.lowInventoryProducts.length}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                  <span className="text-white font-bold">$</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Value</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    ${state.products.reduce((sum, product) => sum + (product.price * product.inventory), 0).toFixed(2)}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {state.lowInventoryProducts.length > 0 && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Low Inventory Alert
            </h3>
            <div className="space-y-3">
              {state.lowInventoryProducts.slice(0, 5).map((product) => (
                <div key={product.id} className="flex items-center justify-between p-3 bg-yellow-50 rounded-md">
                  <div>
                    <p className="font-medium text-gray-900">{product.name}</p>
                    <p className="text-sm text-gray-500">Category: {product.category}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-red-600">
                      {product.inventory} left
                    </p>
                    <p className="text-xs text-gray-500">${product.price}</p>
                  </div>
                </div>
              ))}
            </div>
            {state.lowInventoryProducts.length > 5 && (
              <p className="mt-3 text-sm text-gray-500">
                And {state.lowInventoryProducts.length - 5} more products with low inventory
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );

  const renderProductsList = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Products Management</h2>
        <button
          onClick={() => setState(prev => ({ ...prev, currentView: 'add-product' }))}
          data-testid="add-product-button"
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Add New Product
        </button>
      </div>

      {state.isLoading ? (
        <div className="flex justify-center py-8">
          <LoadingSpinner />
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {state.products.map((product) => (
              <li key={product.id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="w-16 h-16 object-cover rounded-md mr-4"
                    />
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">{product.name}</h3>
                      <p className="text-sm text-gray-500">{product.category}</p>
                      <p className="text-sm text-gray-600">${product.price}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className={`text-sm font-medium ${
                        product.inventory <= 10 ? 'text-red-600' : 'text-green-600'
                      }`}>
                        {product.inventory} in stock
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setState(prev => ({ 
                          ...prev, 
                          currentView: 'edit-product', 
                          selectedProduct: product 
                        }))}
                        data-testid={`edit-product-${product.name}`}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(product.id)}
                        data-testid={`delete-product-${product.name}`}
                        className="text-red-600 hover:text-red-800 text-sm font-medium"
                        disabled={state.isLoading}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );

  const renderCurrentView = () => {
    switch (state.currentView) {
      case 'dashboard':
        return renderDashboard();
      case 'products':
        return renderProductsList();
      case 'inventory':
        return (
          <InventoryManager 
            products={state.products}
            onProductUpdate={loadProducts}
          />
        );
      case 'add-product':
        return (
          <ProductForm
            onSubmit={handleCreateProduct}
            onCancel={() => setState(prev => ({ ...prev, currentView: 'products' }))}
            isLoading={state.isLoading}
            error={state.error}
            successMessage={state.successMessage}
          />
        );
      case 'edit-product':
        return (
          <ProductForm
            product={state.selectedProduct || undefined}
            onSubmit={handleUpdateProduct}
            onCancel={() => setState(prev => ({ 
              ...prev, 
              currentView: 'products', 
              selectedProduct: null 
            }))}
            isLoading={state.isLoading}
            error={state.error}
            successMessage={state.successMessage}
          />
        );
      default:
        return renderDashboard();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>
          <p className="mt-2 text-gray-600">Manage your products and inventory</p>
        </div>

        {renderNavigation()}

        {state.error && (
          <ErrorMessage 
            message={state.error} 
            onClose={clearMessages}
            className="mb-6" 
          />
        )}
        
        {state.successMessage && (
          <SuccessMessage 
            message={state.successMessage} 
            onClose={clearMessages}
            className="mb-6" 
          />
        )}

        {renderCurrentView()}
      </div>
    </div>
  );
};

export default AdminPanel;