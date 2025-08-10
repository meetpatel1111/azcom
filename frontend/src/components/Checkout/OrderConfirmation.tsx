import React from 'react';

interface OrderConfirmationProps {
  orderId: string;
  onContinueShopping: () => void;
  onViewOrder: () => void;
}

const OrderConfirmation: React.FC<OrderConfirmationProps> = ({
  orderId,
  onContinueShopping,
  onViewOrder,
}) => {
  return (
    <div className="bg-white shadow-sm rounded-lg p-8 text-center" data-testid="order-confirmation">
      {/* Success Icon */}
      <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6">
        <svg
          className="h-8 w-8 text-green-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 13l4 4L19 7"
          />
        </svg>
      </div>

      {/* Success Message */}
      <h2 className="text-2xl font-bold text-gray-900 mb-2">
        Order Placed Successfully!
      </h2>
      
      <p className="text-gray-600 mb-6">
        Thank you for your purchase. Your order has been confirmed and will be processed shortly.
      </p>

      {/* Order Details */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <div className="text-sm text-gray-600 mb-1">Order Number</div>
        <div className="text-lg font-semibold text-gray-900 font-mono" data-testid="order-id">
          #{orderId}
        </div>
      </div>

      {/* What's Next */}
      <div className="text-left mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">What's Next?</h3>
        <div className="space-y-3">
          <div className="flex items-start">
            <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
              <span className="text-xs font-semibold text-blue-600">1</span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Order Confirmation</p>
              <p className="text-sm text-gray-600">You'll receive an email confirmation shortly with your order details.</p>
            </div>
          </div>
          
          <div className="flex items-start">
            <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
              <span className="text-xs font-semibold text-blue-600">2</span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Processing</p>
              <p className="text-sm text-gray-600">We'll prepare your order for shipment within 1-2 business days.</p>
            </div>
          </div>
          
          <div className="flex items-start">
            <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
              <span className="text-xs font-semibold text-blue-600">3</span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Shipping</p>
              <p className="text-sm text-gray-600">You'll receive tracking information once your order ships.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={onViewOrder}
          className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 font-medium transition-colors"
        >
          View Order Details
        </button>
        
        <button
          onClick={onContinueShopping}
          className="flex-1 bg-gray-200 text-gray-800 py-3 px-6 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 font-medium transition-colors"
        >
          Continue Shopping
        </button>
      </div>

      {/* Support Info */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <p className="text-sm text-gray-600">
          Need help? Contact our support team at{' '}
          <a href="mailto:support@example.com" className="text-blue-600 hover:text-blue-500">
            support@example.com
          </a>
        </p>
      </div>
    </div>
  );
};

export default OrderConfirmation;