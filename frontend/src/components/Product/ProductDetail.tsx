import React, { useState } from 'react';
import { Product } from '../../types';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../UI/LoadingSpinner';
import QuantitySelector from '../Cart/QuantitySelector';

interface ProductDetailProps {
  product: Product;
  onAddToCart?: (productId: string, quantity: number) => void;
  isLoading?: boolean;
  addingToCart?: boolean;
}

const ProductDetail: React.FC<ProductDetailProps> = ({
  product,
  onAddToCart,
  isLoading = false,
  addingToCart = false,
}) => {
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(product.imageUrl);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  
  const { addToCart, isInCart, getItemQuantity } = useCart();
  const { isAuthenticated } = useAuth();

  const handleAddToCart = async () => {
    if (isAddingToCart || buttonLoading) return;

    // Use custom onAddToCart if provided, otherwise use cart context
    if (onAddToCart) {
      onAddToCart(product.id, quantity);
      return;
    }

    if (!isAuthenticated) {
      alert('Please log in to add items to your cart');
      return;
    }

    setIsAddingToCart(true);
    try {
      await addToCart(product.id, quantity);
      // Reset quantity to 1 after successful add
      setQuantity(1);
    } catch (error) {
      console.error('Failed to add to cart:', error);
      // Error is already handled by the cart context
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleQuantityChange = (newQuantity: number) => {
    setQuantity(newQuantity);
  };

  const isOutOfStock = product.inventory <= 0;
  const maxQuantity = Math.min(product.inventory, 10); // Limit to 10 or available stock
  const itemQuantity = isAuthenticated ? getItemQuantity(product.id) : 0;
  const inCart = isAuthenticated ? isInCart(product.id) : false;
  const buttonLoading = addingToCart || isAddingToCart;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  return (
    <div className="bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="lg:grid lg:grid-cols-2 lg:gap-x-8 lg:items-start">
          {/* Image gallery */}
          <div className="flex flex-col-reverse">
            <div className="w-full aspect-w-1 aspect-h-1">
              <img
                src={selectedImage}
                alt={product.name}
                className="w-full h-96 object-center object-cover sm:rounded-lg"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = '/placeholder-product.jpg';
                }}
              />
              {isOutOfStock && (
                <div className="absolute inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center rounded-lg">
                  <span className="text-white font-semibold text-xl">Out of Stock</span>
                </div>
              )}
            </div>
          </div>

          {/* Product info */}
          <div className="mt-10 px-4 sm:px-0 sm:mt-16 lg:mt-0">
            <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">
              {product.name}
            </h1>

            <div className="mt-3">
              <h2 className="sr-only">Product information</h2>
              <p className="text-3xl text-gray-900">${product.price.toFixed(2)}</p>
            </div>

            <div className="mt-6">
              <h3 className="sr-only">Description</h3>
              <div className="text-base text-gray-700 space-y-6">
                <p>{product.description}</p>
              </div>
            </div>

            {/* Product details */}
            <div className="mt-6">
              <div className="flex items-center">
                <span className="text-sm font-medium text-gray-900">Category:</span>
                <span className="ml-2 inline-block bg-gray-100 text-gray-800 text-sm px-3 py-1 rounded-full">
                  {product.category}
                </span>
              </div>
              
              <div className="mt-4 flex items-center">
                <span className="text-sm font-medium text-gray-900">Availability:</span>
                <span className={`ml-2 text-sm ${isOutOfStock ? 'text-red-600' : 'text-green-600'}`}>
                  {isOutOfStock ? 'Out of Stock' : `${product.inventory} in stock`}
                </span>
              </div>
            </div>

            {/* Current cart status */}
            {inCart && (
              <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-md">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm font-medium text-green-800">
                    {itemQuantity} {itemQuantity === 1 ? 'item' : 'items'} in your cart
                  </span>
                </div>
              </div>
            )}

            {/* Add to cart section */}
            {!isOutOfStock && (
              <div className="mt-8">
                <div className="flex items-center space-x-4 mb-6">
                  <label htmlFor="quantity" className="text-sm font-medium text-gray-900">
                    Quantity:
                  </label>
                  <QuantitySelector
                    quantity={quantity}
                    maxQuantity={maxQuantity}
                    onQuantityChange={handleQuantityChange}
                    disabled={buttonLoading}
                    size="md"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={buttonLoading}
                  className={`w-full flex justify-center items-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white ${
                    buttonLoading
                      ? 'bg-blue-400 cursor-not-allowed'
                      : inCart
                      ? 'bg-green-600 hover:bg-green-700'
                      : 'bg-blue-600 hover:bg-blue-700'
                  } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                >
                  {buttonLoading ? (
                    <>
                      <LoadingSpinner size="small" className="mr-2" />
                      Adding to Cart...
                    </>
                  ) : inCart ? (
                    'Add More to Cart'
                  ) : (
                    'Add to Cart'
                  )}
                </button>
              </div>
            )}

            {/* Product metadata */}
            <div className="mt-8 border-t border-gray-200 pt-8">
              <div className="text-sm text-gray-500 space-y-2">
                <p>Product ID: {product.id}</p>
                <p>Added: {new Date(product.createdAt).toLocaleDateString()}</p>
                {product.updatedAt !== product.createdAt && (
                  <p>Last updated: {new Date(product.updatedAt).toLocaleDateString()}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;