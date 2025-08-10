import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Product } from '../../types';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';

interface ProductCardProps {
  product: Product;
  onAddToCart?: (productId: string) => void;
  isLoading?: boolean;
}

const ProductCard: React.FC<ProductCardProps> = ({ 
  product, 
  onAddToCart, 
  isLoading = false 
}) => {
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const { addToCart, isInCart, getItemQuantity } = useCart();
  const { isAuthenticated } = useAuth();

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isLoading || isAddingToCart) return;

    // Use custom onAddToCart if provided, otherwise use cart context
    if (onAddToCart) {
      onAddToCart(product.id);
      return;
    }

    if (!isAuthenticated) {
      // Could show a login modal or redirect to login
      alert('Please log in to add items to your cart');
      return;
    }

    setIsAddingToCart(true);
    try {
      await addToCart(product.id, 1);
    } catch (error) {
      console.error('Failed to add to cart:', error);
      // Error is already handled by the cart context
    } finally {
      setIsAddingToCart(false);
    }
  };

  const isOutOfStock = product.inventory <= 0;
  const itemQuantity = isAuthenticated ? getItemQuantity(product.id) : 0;
  const inCart = isAuthenticated ? isInCart(product.id) : false;
  const buttonLoading = isLoading || isAddingToCart;

  return (
    <div 
      className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300"
      data-testid={`product-card-${product.name}`}
    >
      <Link to={`/products/${product.id}`} className="block">
        <div className="relative">
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-48 object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = '/placeholder-product.jpg';
            }}
          />
          {isOutOfStock && (
            <div className="absolute inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center">
              <span className="text-white font-semibold text-lg">Out of Stock</span>
            </div>
          )}
        </div>
        
        <div className="p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
            {product.name}
          </h3>
          
          <p className="text-gray-600 text-sm mb-3 line-clamp-2">
            {product.description}
          </p>
          
          <div className="flex items-center justify-between mb-3">
            <span className="text-2xl font-bold text-blue-600">
              ${product.price.toFixed(2)}
            </span>
            <span className="text-sm text-gray-500">
              {product.inventory} in stock
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="inline-block bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full">
              {product.category}
            </span>
            
            <div className="flex items-center space-x-2">
              {inCart && (
                <span className="text-xs text-green-600 font-medium">
                  {itemQuantity} in cart
                </span>
              )}
              <button
                onClick={handleAddToCart}
                disabled={isOutOfStock || buttonLoading}
                data-testid="add-to-cart-button"
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                  isOutOfStock
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : buttonLoading
                    ? 'bg-blue-400 text-white cursor-not-allowed'
                    : inCart
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {buttonLoading 
                  ? 'Adding...' 
                  : isOutOfStock 
                  ? 'Out of Stock' 
                  : inCart 
                  ? 'Add More' 
                  : 'Add to Cart'
                }
              </button>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
};

export default ProductCard;