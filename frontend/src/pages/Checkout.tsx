import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { mockOrderService } from '../services/mockOrderService';
import { CheckoutForm, Address } from '../types';
import ShippingForm from '../components/Checkout/ShippingForm';
import PaymentForm from '../components/Checkout/PaymentForm';
import OrderSummary from '../components/Checkout/OrderSummary';
import OrderConfirmation from '../components/Checkout/OrderConfirmation';

const Checkout: React.FC = () => {
  const navigate = useNavigate();
  const { cart, summary, clearCart } = useCart();
  const { user, isAuthenticated } = useAuth();
  
  const [currentStep, setCurrentStep] = useState<'shipping' | 'payment' | 'confirmation'>('shipping');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  
  const [checkoutData, setCheckoutData] = useState<CheckoutForm>({
    shippingAddress: {
      street: user?.address?.street || '',
      city: user?.address?.city || '',
      state: user?.address?.state || '',
      zipCode: user?.address?.zipCode || '',
    },
    paymentInfo: {
      method: 'credit_card',
    },
  });

  // Redirect if not authenticated or cart is empty
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: '/checkout' } });
      return;
    }
    
    if (summary.isEmpty) {
      navigate('/cart');
      return;
    }
  }, [isAuthenticated, summary.isEmpty, navigate]);

  const handleShippingSubmit = (shippingAddress: Address) => {
    setCheckoutData(prev => ({ ...prev, shippingAddress }));
    setCurrentStep('payment');
    setError(null);
  };

  const handlePaymentSubmit = async (paymentInfo: CheckoutForm['paymentInfo']) => {
    setCheckoutData(prev => ({ ...prev, paymentInfo }));
    setIsProcessing(true);
    setError(null);

    try {
      const finalCheckoutData = {
        shippingAddress: checkoutData.shippingAddress,
        paymentInfo,
      };

      const response = await mockOrderService.createOrder(finalCheckoutData);
      setOrderId(response.order.id);
      setCurrentStep('confirmation');
      
      // Clear cart after successful order
      await clearCart();
    } catch (err: any) {
      setError(err.message || 'Failed to process order');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBackToShipping = () => {
    setCurrentStep('shipping');
    setError(null);
  };

  const handleContinueShopping = () => {
    navigate('/products');
  };

  const handleViewOrder = () => {
    if (orderId) {
      navigate(`/orders/${orderId}`);
    }
  };

  if (!isAuthenticated || summary.isEmpty) {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Checkout</h1>
        
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-8">
            <div className={`flex items-center ${currentStep === 'shipping' ? 'text-blue-600' : currentStep === 'payment' || currentStep === 'confirmation' ? 'text-green-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${currentStep === 'shipping' ? 'border-blue-600 bg-blue-600 text-white' : currentStep === 'payment' || currentStep === 'confirmation' ? 'border-green-600 bg-green-600 text-white' : 'border-gray-300'}`}>
                1
              </div>
              <span className="ml-2 font-medium">Shipping</span>
            </div>
            
            <div className={`w-16 h-0.5 ${currentStep === 'payment' || currentStep === 'confirmation' ? 'bg-green-600' : 'bg-gray-300'}`}></div>
            
            <div className={`flex items-center ${currentStep === 'payment' ? 'text-blue-600' : currentStep === 'confirmation' ? 'text-green-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${currentStep === 'payment' ? 'border-blue-600 bg-blue-600 text-white' : currentStep === 'confirmation' ? 'border-green-600 bg-green-600 text-white' : 'border-gray-300'}`}>
                2
              </div>
              <span className="ml-2 font-medium">Payment</span>
            </div>
            
            <div className={`w-16 h-0.5 ${currentStep === 'confirmation' ? 'bg-green-600' : 'bg-gray-300'}`}></div>
            
            <div className={`flex items-center ${currentStep === 'confirmation' ? 'text-green-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${currentStep === 'confirmation' ? 'border-green-600 bg-green-600 text-white' : 'border-gray-300'}`}>
                3
              </div>
              <span className="ml-2 font-medium">Confirmation</span>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {currentStep === 'shipping' && (
              <ShippingForm
                initialData={checkoutData.shippingAddress}
                onSubmit={handleShippingSubmit}
              />
            )}
            
            {currentStep === 'payment' && (
              <PaymentForm
                onSubmit={handlePaymentSubmit}
                onBack={handleBackToShipping}
                isProcessing={isProcessing}
              />
            )}
            
            {currentStep === 'confirmation' && orderId && (
              <OrderConfirmation
                orderId={orderId}
                onContinueShopping={handleContinueShopping}
                onViewOrder={handleViewOrder}
              />
            )}
          </div>

          {/* Order Summary Sidebar */}
          {currentStep !== 'confirmation' && (
            <div className="lg:col-span-1">
              <OrderSummary cart={cart} summary={summary} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Checkout;