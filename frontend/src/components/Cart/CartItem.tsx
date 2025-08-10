import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { CartItem as CartItemType } from '../../types';
import { useCart } from '../../context/CartContext';
import QuantitySelector from './QuantitySelector';

interface CartItemProps {
  item: CartItemType;
}

const CartItem: React.FC<CartItemProps> = ({ item }) => {
  const { updateCartItem, removeFromCart } = useCart();
  const [isUpdating, setIsUpdating] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  const handleQuantityChange = async (newQuantity: number) => {
    if (newQuantity === item.quantity) return;

    setIsUpdating(true);
    try {
      await updateCartItem(item.productId, newQuantity);
    } catch (error) {
      console.error('Failed to update cart item:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRemove = async () => {
    if (window.confirm('Remove this item from your cart?')) {
      setIsRemoving(true);
      try {
        await removeFromCart(item.productId);
      } catch (error) {
        console.error('Failed to remove cart item:', error);
        setIsRemoving(false);
      }
    }
  };

  const product = item.product;
  const itemTotal = product ? product.price * item.quantity : 0;

  if (!product) {
    return (
      <li className="flex py-6 sm:py-10">
        <div className="flex-shrink-0">
          <div className="w-24 h-24 bg-gray-200 rounded-md flex items-center justify-center">
            <svg
              className="w-8 h-8 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
        </div>

        <div className="ml-4 flex-1 flex flex-col justify-between sm:ml-6">
          <div className="relative pr-9 sm:grid sm:grid-cols-2 sm:gap-x-6 sm:pr-0">
            <div>
              <div className="flex justify-between">
                <h3 className="text-sm">
                  <span className="font-medium text-gray-700">
                    Product not found
                  </span>
                </h3>
              </div>
              <p className="mt-1 text-sm text-gray-500">
                This product is no longer available
              </p>
            </div>

            <div className="mt-4 sm:mt-0 sm:pr-9">
              <div className="absolute top-0 right-0">
                <button
                  onClick={handleRemove}
                  disabled={isRemoving}
                  className="-m-2 p-2 inline-flex text-gray-400 hover:text-gray-500 disabled:opacity-50"
                >
                  <span className="sr-only">Remove</span>
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </li>
    );
  }

  return (
    <li className="flex py-6 sm:py-10" data-testid={`cart-item-${product.name}`}>
      <div className="flex-shrink-0">
        <img
          src={product.imageUrl}
          alt={product.name}
          className="w-24 h-24 rounded-md object-center object-cover sm:w-48 sm:h-48"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = '/placeholder-product.png';
          }}
        />
      </div>

      <div className="ml-4 flex-1 flex flex-col justify-between sm:ml-6">
        <div className="relative pr-9 sm:grid sm:grid-cols-2 sm:gap-x-6 sm:pr-0">
          <div>
            <div className="flex justify-between">
              <h3 className="text-sm">
                <Link
                  to={`/products/${product.id}`}
                  className="font-medium text-gray-700 hover:text-gray-800"
                >
                  {product.name}
                </Link>
              </h3>
            </div>
            <div className="mt-1 flex text-sm">
              <p className="text-gray-500">{product.category}</p>
            </div>
            <p className="mt-1 text-sm font-medium text-gray-900">
              ${product.price.toFixed(2)}
            </p>
            {product.inventory < 10 && product.inventory > 0 && (
              <p className="mt-1 text-sm text-orange-600">
                Only {product.inventory} left in stock
              </p>
            )}
            {product.inventory === 0 && (
              <p className="mt-1 text-sm text-red-600">Out of stock</p>
            )}
          </div>

          <div className="mt-4 sm:mt-0 sm:pr-9">
            <div className="flex items-center justify-between">
              <QuantitySelector
                quantity={item.quantity}
                maxQuantity={product.inventory}
                onQuantityChange={handleQuantityChange}
                disabled={isUpdating || product.inventory === 0}
              />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-900">
                  ${itemTotal.toFixed(2)}
                </p>
              </div>
            </div>

            <div className="absolute top-0 right-0">
              <button
                onClick={handleRemove}
                disabled={isRemoving}
                data-testid="remove-button"
                className="-m-2 p-2 inline-flex text-gray-400 hover:text-gray-500 disabled:opacity-50"
              >
                <span className="sr-only">Remove</span>
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
                {isRemoving && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
                  </div>
                )}
              </button>
            </div>
          </div>
        </div>

        <p className="mt-4 flex text-sm text-gray-700 space-x-2">
          {product.inventory > 0 ? (
            <>
              <svg
                className="flex-shrink-0 w-5 h-5 text-green-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <span>In stock</span>
            </>
          ) : (
            <>
              <svg
                className="flex-shrink-0 w-5 h-5 text-red-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
              <span>Out of stock</span>
            </>
          )}
        </p>
      </div>
    </li>
  );
};

export default CartItem;