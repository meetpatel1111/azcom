import React from 'react';
import { Order } from '../../types';
import OrderStatusBadge from './OrderStatusBadge';

interface OrderCardProps {
  order: Order;
  onViewOrder: (orderId: string) => void;
  onReorder: (orderId: string) => void;
}

const OrderCard: React.FC<OrderCardProps> = ({ order, onViewOrder, onReorder }) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const canReorder = order.status === 'delivered' || order.status === 'cancelled';
  const canCancel = order.status === 'pending' || order.status === 'processing';

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
      <div className="p-6">
        {/* Order Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
          <div className="mb-2 sm:mb-0">
            <h3 className="text-lg font-semibold text-gray-900">
              Order #{order.id}
            </h3>
            <p className="text-sm text-gray-600">
              Placed on {formatDate(order.createdAt)}
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <OrderStatusBadge status={order.status} />
            <span className="text-lg font-semibold text-gray-900">
              ${order.totalAmount.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Order Items Preview */}
        <div className="mb-4">
          <div className="flex items-center space-x-4 overflow-x-auto pb-2">
            {order.items.slice(0, 3).map((item, index) => (
              <div key={index} className="flex-shrink-0 flex items-center space-x-2">
                <div className="w-12 h-12 bg-gray-200 rounded-md flex items-center justify-center">
                  <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {item.productName}
                  </p>
                  <p className="text-xs text-gray-600">
                    Qty: {item.quantity} × ${item.price.toFixed(2)}
                  </p>
                </div>
              </div>
            ))}
            {order.items.length > 3 && (
              <div className="flex-shrink-0 text-sm text-gray-500">
                +{order.items.length - 3} more items
              </div>
            )}
          </div>
        </div>

        {/* Shipping Address */}
        <div className="mb-4">
          <p className="text-sm text-gray-600">
            <span className="font-medium">Shipping to:</span>{' '}
            {order.shippingAddress.street}, {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => onViewOrder(order.id)}
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 font-medium transition-colors"
          >
            View Details
          </button>
          
          {canReorder && (
            <button
              onClick={() => onReorder(order.id)}
              className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 font-medium transition-colors"
            >
              Reorder
            </button>
          )}
          
          {canCancel && (
            <button
              className="flex-1 bg-red-100 text-red-800 py-2 px-4 rounded-md hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 font-medium transition-colors"
            >
              Cancel Order
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderCard;