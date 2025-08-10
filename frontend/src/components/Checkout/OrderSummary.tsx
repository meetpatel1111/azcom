import React from 'react';
import { Cart, CartSummary } from '../../types';

interface OrderSummaryProps {
  cart: Cart | null;
  summary: CartSummary;
}

const OrderSummary: React.FC<OrderSummaryProps> = ({ cart, summary }) => {
  const shippingCost = summary.subtotal > 50 ? 0 : 9.99;
  const tax = summary.subtotal * 0.08; // 8% tax
  const finalTotal = summary.subtotal + shippingCost + tax;

  if (!cart || summary.isEmpty) {
    return (
      <div className="bg-white shadow-sm rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h3>
        <p className="text-gray-500">Your cart is empty</p>
      </div>
    );
  }

  return (
    <div className="bg-white shadow-sm rounded-lg p-6 sticky top-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h3>
      
      {/* Cart Items */}
      <div className="space-y-3 mb-4">
        {cart.items.map((item) => (
          <div key={item.productId} className="flex items-center space-x-3">
            <div className="flex-shrink-0 w-12 h-12 bg-gray-200 rounded-md overflow-hidden">
              {item.product?.imageUrl ? (
                <img
                  src={item.product.imageUrl}
                  alt={item.product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {item.product?.name || `Product ${item.productId}`}
              </p>
              <p className="text-sm text-gray-500">
                Qty: {item.quantity}
              </p>
            </div>
            
            <div className="text-sm font-medium text-gray-900">
              ${((item.product?.price || 0) * item.quantity).toFixed(2)}
            </div>
          </div>
        ))}
      </div>

      <hr className="my-4" />

      {/* Order Totals */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Subtotal ({summary.itemCount} items)</span>
          <span className="text-gray-900">${summary.subtotal.toFixed(2)}</span>
        </div>
        
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Shipping</span>
          <span className="text-gray-900">
            {shippingCost === 0 ? (
              <span className="text-green-600">FREE</span>
            ) : (
              `$${shippingCost.toFixed(2)}`
            )}
          </span>
        </div>
        
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Tax</span>
          <span className="text-gray-900">${tax.toFixed(2)}</span>
        </div>
        
        <hr className="my-2" />
        
        <div className="flex justify-between text-base font-semibold">
          <span className="text-gray-900">Total</span>
          <span className="text-gray-900">${finalTotal.toFixed(2)}</span>
        </div>
      </div>

      {/* Free Shipping Notice */}
      {shippingCost > 0 && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-sm text-blue-800">
            Add ${(50 - summary.subtotal).toFixed(2)} more to get free shipping!
          </p>
        </div>
      )}

      {/* Security Notice */}
      <div className="mt-4 flex items-center text-sm text-gray-500">
        <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        Secure checkout
      </div>
    </div>
  );
};

export default OrderSummary;