import React, { useState, useMemo } from 'react';
import { Product } from '../../types';
import { productService } from '../../services/productService';
import { FormInput, LoadingSpinner, ErrorMessage, SuccessMessage } from '../UI';

interface InventoryManagerProps {
  products: Product[];
  onProductUpdate: () => Promise<void>;
}

interface InventoryUpdate {
  productId: string;
  newInventory: number;
}

const InventoryManager: React.FC<InventoryManagerProps> = ({ products, onProductUpdate }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'inventory' | 'category'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [filterBy, setFilterBy] = useState<'all' | 'low' | 'out'>('all');
  const [pendingUpdates, setPendingUpdates] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Filter and sort products
  const filteredAndSortedProducts = useMemo(() => {
    let filtered = products.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           product.category.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesFilter = filterBy === 'all' || 
                           (filterBy === 'low' && product.inventory <= 10 && product.inventory > 0) ||
                           (filterBy === 'out' && product.inventory === 0);
      
      return matchesSearch && matchesFilter;
    });

    return filtered.sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;

      switch (sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'inventory':
          aValue = a.inventory;
          bValue = b.inventory;
          break;
        case 'category':
          aValue = a.category.toLowerCase();
          bValue = b.category.toLowerCase();
          break;
        default:
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
      }

      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });
  }, [products, searchTerm, sortBy, sortOrder, filterBy]);

  const handleInventoryChange = (productId: string, newInventory: string) => {
    const inventory = parseInt(newInventory);
    if (!isNaN(inventory) && inventory >= 0) {
      setPendingUpdates(prev => ({ ...prev, [productId]: inventory }));
    } else if (newInventory === '') {
      setPendingUpdates(prev => {
        const updated = { ...prev };
        delete updated[productId];
        return updated;
      });
    }
  };

  const handleUpdateInventory = async (productId: string) => {
    const newInventory = pendingUpdates[productId];
    if (newInventory === undefined) return;

    try {
      setIsLoading(true);
      setError(null);
      
      await productService.updateProduct(productId, { inventory: newInventory });
      
      setPendingUpdates(prev => {
        const updated = { ...prev };
        delete updated[productId];
        return updated;
      });
      
      setSuccessMessage('Inventory updated successfully!');
      await onProductUpdate();
    } catch (error: any) {
      setError(error.message || 'Failed to update inventory');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBulkUpdate = async () => {
    if (Object.keys(pendingUpdates).length === 0) return;

    try {
      setIsLoading(true);
      setError(null);

      const updates = Object.entries(pendingUpdates).map(([productId, inventory]) =>
        productService.updateProduct(productId, { inventory })
      );

      await Promise.all(updates);
      
      setPendingUpdates({});
      setSuccessMessage(`Updated inventory for ${updates.length} products!`);
      await onProductUpdate();
    } catch (error: any) {
      setError(error.message || 'Failed to update inventories');
    } finally {
      setIsLoading(false);
    }
  };

  const clearMessages = () => {
    setError(null);
    setSuccessMessage(null);
  };

  const getInventoryStatus = (inventory: number) => {
    if (inventory === 0) return { status: 'Out of Stock', color: 'text-red-600 bg-red-50' };
    if (inventory <= 10) return { status: 'Low Stock', color: 'text-yellow-600 bg-yellow-50' };
    return { status: 'In Stock', color: 'text-green-600 bg-green-50' };
  };

  const inventoryStats = useMemo(() => {
    const total = products.length;
    const outOfStock = products.filter(p => p.inventory === 0).length;
    const lowStock = products.filter(p => p.inventory > 0 && p.inventory <= 10).length;
    const inStock = products.filter(p => p.inventory > 10).length;
    
    return { total, outOfStock, lowStock, inStock };
  }, [products]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Inventory Management</h2>
        {Object.keys(pendingUpdates).length > 0 && (
          <button
            onClick={handleBulkUpdate}
            disabled={isLoading}
            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 flex items-center"
          >
            {isLoading && <LoadingSpinner size="sm" className="mr-2" />}
            Update All ({Object.keys(pendingUpdates).length})
          </button>
        )}
      </div>

      {/* Inventory Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-gray-900">{inventoryStats.total}</div>
          <div className="text-sm text-gray-500">Total Products</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-green-600">{inventoryStats.inStock}</div>
          <div className="text-sm text-gray-500">In Stock</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-yellow-600">{inventoryStats.lowStock}</div>
          <div className="text-sm text-gray-500">Low Stock</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-red-600">{inventoryStats.outOfStock}</div>
          <div className="text-sm text-gray-500">Out of Stock</div>
        </div>
      </div>

      {error && <ErrorMessage message={error} onClose={clearMessages} />}
      {successMessage && <SuccessMessage message={successMessage} onClose={clearMessages} />}

      {/* Filters and Search */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <FormInput
            label="Search Products"
            type="text"
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Search by name or category..."
          />
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Stock</label>
            <select
              value={filterBy}
              onChange={(e) => setFilterBy(e.target.value as 'all' | 'low' | 'out')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Products</option>
              <option value="low">Low Stock (≤10)</option>
              <option value="out">Out of Stock</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Sort by</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'name' | 'inventory' | 'category')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="name">Name</option>
              <option value="inventory">Inventory</option>
              <option value="category">Category</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Order</label>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="asc">Ascending</option>
              <option value="desc">Descending</option>
            </select>
          </div>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Current Stock
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Update Stock
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAndSortedProducts.map((product) => {
                const { status, color } = getInventoryStatus(product.inventory);
                const hasPendingUpdate = pendingUpdates[product.id] !== undefined;
                const displayInventory = hasPendingUpdate ? pendingUpdates[product.id] : product.inventory;

                return (
                  <tr key={product.id} className={hasPendingUpdate ? 'bg-blue-50' : ''}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="w-10 h-10 object-cover rounded-md mr-3"
                        />
                        <div>
                          <div className="text-sm font-medium text-gray-900">{product.name}</div>
                          <div className="text-sm text-gray-500">${product.price}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {product.category}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {product.inventory}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${color}`}>
                        {status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="number"
                        min="0"
                        value={displayInventory}
                        onChange={(e) => handleInventoryChange(product.id, e.target.value)}
                        className="w-20 px-2 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        disabled={isLoading}
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {hasPendingUpdate && (
                        <button
                          onClick={() => handleUpdateInventory(product.id)}
                          disabled={isLoading}
                          className="text-blue-600 hover:text-blue-900 mr-3 disabled:opacity-50"
                        >
                          Update
                        </button>
                      )}
                      {hasPendingUpdate && (
                        <button
                          onClick={() => setPendingUpdates(prev => {
                            const updated = { ...prev };
                            delete updated[product.id];
                            return updated;
                          })}
                          disabled={isLoading}
                          className="text-gray-600 hover:text-gray-900 disabled:opacity-50"
                        >
                          Cancel
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredAndSortedProducts.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500">No products found matching your criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default InventoryManager;