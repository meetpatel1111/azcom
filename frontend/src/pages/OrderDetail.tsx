import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getOrderById, getOrderTracking, cancelOrder } from '../services/orderService';
import { Order, OrderTracking } from '../types';
import OrderStatusBadge from '../components/Orders/OrderStatusBadge';
import OrderTrackingTimeline from '../components/Orders/OrderTrackingTimeline';
import LoadingSpinner from '../components/UI/LoadingSpinner';

const OrderDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  
  const [order, setOrder] = useState<Order | null>(null);
  const [tracking, setTracking] = useState<OrderTracking | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingTracking, setIsLoadingTracking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/orders/${id}` } });
      return;
    }
  }, [isAuthenticated, navigate, id]);

  // Fetch order details
  useEffect(() => {
    const fetchOrder = async () => {
      if (!isAuthenticated || !id) return;

      try {
        setIsLoading(true);
        setError(null);
        const response = await getOrderById(id);
        setOrder(response.order);
      } catch (err: any) {
        setError(err.message || 'Failed to load order details');
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrder();
  }, [isAuthenticated, id]);

  // Fetch tracking information
  useEffect(() => {
    const fetchTracking = async () => {
      if (!order || !id) return;

      try {
        setIsLoadingTracking(true);
        const response = await getOrderTracking(id);
        setTracking(response.tracking);
      } catch (err: any) {
        // Tracking might not be available for all orders, so don't show error
        console.warn('Failed to load tracking information:', err.message);
      } finally {
        setIsLoadingTracking(false);
      }
    };

    fetchTracking();
  }, [order, id]);

  const handleCancelOrder = async () => {
    if (!order || !id) return;

    const confirmed = window.confirm('Are you sure you want to cancel this order?');
    if (!confirmed) return;

    try {
      setIsCancelling(true);
      const response = await cancelOrder(id);
      setOrder(response.order);
      setTracking(null); // Clear tracking as it may no longer be relevant
    } catch (err: any) {
      setError(err.message || 'Failed to cancel order');
    } finally {
      setIsCancelling(false);
    }
  };

  const handleReorder = () => {
    // This would typically add items to cart and redirect
    navigate('/cart');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!isAuthenticated) {
    return null; // Will redirect via useEffect
  }

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-center items-center min-h-64">
          <LoadingSpinner size="large" />
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
            <svg className="h-8 w-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Order Not Found</h3>
          <p className="text-gray-600 mb-4">{error || 'The order you are looking for could not be found.'}</p>
          <button
            onClick={() => navigate('/orders')}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Back to Orders
          </button>
        </div>
      </div>
    );
  }

  const canCancel = order.status === 'pending' || order.status === 'processing';
  const canReorder = order.status === 'delivered' || order.status === 'cancelled';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/orders')}
            className="flex items-center text-blue-600 hover:text-blue-500 mb-4"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Orders
          </button>
          
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Order #{order.id}</h1>
              <p className="text-gray-600 mt-1">Placed on {formatDate(order.createdAt)}</p>
            </div>
            <div className="mt-4 sm:mt-0 flex items-center space-x-4">
              <OrderStatusBadge status={order.status} />
              <span className="text-2xl font-bold text-gray-900">${order.totalAmount.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Order Items */}
            <div className="bg-white shadow-sm rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Order Items</h2>
              <div className="space-y-4">
                {order.items.map((item, index) => (
                  <div key={index} className="flex items-center space-x-4 py-4 border-b border-gray-200 last:border-b-0">
                    <div className="flex-shrink-0 w-16 h-16 bg-gray-200 rounded-md flex items-center justify-center">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-medium text-gray-900">{item.productName}</h3>
                      <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                      <p className="text-sm text-gray-600">Price: ${item.price.toFixed(2)} each</p>
                    </div>
                    <div className="text-lg font-semibold text-gray-900">
                      ${(item.price * item.quantity).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Order Tracking */}
            {tracking && (
              <div className="bg-white shadow-sm rounded-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Order Tracking</h2>
                {isLoadingTracking ? (
                  <div className="flex justify-center py-8">
                    <LoadingSpinner />
                  </div>
                ) : (
                  <OrderTrackingTimeline tracking={tracking} />
                )}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Order Summary */}
            <div className="bg-white shadow-sm rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="text-gray-900">${order.totalAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Shipping</span>
                  <span className="text-gray-900">$0.00</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tax</span>
                  <span className="text-gray-900">$0.00</span>
                </div>
                <hr className="my-2" />
                <div className="flex justify-between text-base font-semibold">
                  <span className="text-gray-900">Total</span>
                  <span className="text-gray-900">${order.totalAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Shipping Address */}
            <div className="bg-white shadow-sm rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Shipping Address</h3>
              <div className="text-sm text-gray-600">
                <p>{order.shippingAddress.street}</p>
                <p>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}</p>
              </div>
            </div>

            {/* Payment Information */}
            <div className="bg-white shadow-sm rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Method</h3>
              <div className="text-sm text-gray-600">
                <p className="capitalize">{order.paymentInfo.method.replace('_', ' ')}</p>
                {order.paymentInfo.cardLast4 && (
                  <p>**** **** **** {order.paymentInfo.cardLast4}</p>
                )}
                {order.paymentInfo.cardBrand && (
                  <p className="text-xs text-gray-500 mt-1">{order.paymentInfo.cardBrand}</p>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="bg-white shadow-sm rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions</h3>
              <div className="space-y-3">
                {canReorder && (
                  <button
                    onClick={handleReorder}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 font-medium transition-colors"
                  >
                    Reorder Items
                  </button>
                )}
                
                {canCancel && (
                  <button
                    onClick={handleCancelOrder}
                    disabled={isCancelling}
                    className="w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isCancelling ? 'Cancelling...' : 'Cancel Order'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetail;