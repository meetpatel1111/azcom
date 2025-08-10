import React, { useState } from 'react';
import { CheckoutForm } from '../../types';

interface PaymentFormProps {
  onSubmit: (paymentInfo: CheckoutForm['paymentInfo']) => void;
  onBack: () => void;
  isProcessing: boolean;
}

const PaymentForm: React.FC<PaymentFormProps> = ({ onSubmit, onBack, isProcessing }) => {
  const [paymentMethod, setPaymentMethod] = useState<'credit_card' | 'debit_card' | 'paypal' | 'bank_transfer'>('credit_card');
  const [cardData, setCardData] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardholderName: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleCardDataChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    let formattedValue = value;

    // Format card number with spaces
    if (name === 'cardNumber') {
      formattedValue = value.replace(/\s/g, '').replace(/(.{4})/g, '$1 ').trim();
      if (formattedValue.length > 19) return; // Max 16 digits + 3 spaces
    }

    // Format expiry date
    if (name === 'expiryDate') {
      formattedValue = value.replace(/\D/g, '').replace(/(\d{2})(\d)/, '$1/$2');
      if (formattedValue.length > 5) return; // MM/YY format
    }

    // Limit CVV to 4 digits
    if (name === 'cvv') {
      formattedValue = value.replace(/\D/g, '');
      if (formattedValue.length > 4) return;
    }

    setCardData(prev => ({ ...prev, [name]: formattedValue }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateCardForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (paymentMethod === 'credit_card' || paymentMethod === 'debit_card') {
      if (!cardData.cardholderName.trim()) {
        newErrors.cardholderName = 'Cardholder name is required';
      }

      const cardNumber = cardData.cardNumber.replace(/\s/g, '');
      if (!cardNumber) {
        newErrors.cardNumber = 'Card number is required';
      } else if (cardNumber.length < 13 || cardNumber.length > 19) {
        newErrors.cardNumber = 'Please enter a valid card number';
      }

      if (!cardData.expiryDate) {
        newErrors.expiryDate = 'Expiry date is required';
      } else if (!/^\d{2}\/\d{2}$/.test(cardData.expiryDate)) {
        newErrors.expiryDate = 'Please enter a valid expiry date (MM/YY)';
      } else {
        const [month, year] = cardData.expiryDate.split('/');
        const currentDate = new Date();
        const currentYear = currentDate.getFullYear() % 100;
        const currentMonth = currentDate.getMonth() + 1;
        
        if (parseInt(month) < 1 || parseInt(month) > 12) {
          newErrors.expiryDate = 'Please enter a valid month (01-12)';
        } else if (parseInt(year) < currentYear || (parseInt(year) === currentYear && parseInt(month) < currentMonth)) {
          newErrors.expiryDate = 'Card has expired';
        }
      }

      if (!cardData.cvv) {
        newErrors.cvv = 'CVV is required';
      } else if (cardData.cvv.length < 3 || cardData.cvv.length > 4) {
        newErrors.cvv = 'Please enter a valid CVV';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const getCardBrand = (cardNumber: string): string => {
    const number = cardNumber.replace(/\s/g, '');
    
    if (/^4/.test(number)) return 'Visa';
    if (/^5[1-5]/.test(number)) return 'Mastercard';
    if (/^3[47]/.test(number)) return 'American Express';
    if (/^6/.test(number)) return 'Discover';
    
    return 'Unknown';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateCardForm()) return;

    const paymentInfo: CheckoutForm['paymentInfo'] = {
      method: paymentMethod,
    };

    if (paymentMethod === 'credit_card' || paymentMethod === 'debit_card') {
      const cardNumber = cardData.cardNumber.replace(/\s/g, '');
      paymentInfo.cardLast4 = cardNumber.slice(-4);
      paymentInfo.cardBrand = getCardBrand(cardNumber);
    }

    onSubmit(paymentInfo);
  };

  return (
    <div className="bg-white shadow-sm rounded-lg p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Payment Information</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Payment Method Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Payment Method
          </label>
          <div className="space-y-2">
            {[
              { value: 'credit_card', label: 'Credit Card', icon: '💳' },
              { value: 'debit_card', label: 'Debit Card', icon: '💳' },
              { value: 'paypal', label: 'PayPal', icon: '🅿️' },
              { value: 'bank_transfer', label: 'Bank Transfer', icon: '🏦' },
            ].map((method) => (
              <label key={method.value} className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="paymentMethod"
                  value={method.value}
                  checked={paymentMethod === method.value}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <span className="ml-3 text-lg">{method.icon}</span>
                <span className="ml-2 text-sm font-medium text-gray-900">{method.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Card Details Form */}
        {(paymentMethod === 'credit_card' || paymentMethod === 'debit_card') && (
          <div className="space-y-4">
            <div>
              <label htmlFor="cardholderName" className="block text-sm font-medium text-gray-700 mb-1">
                Cardholder Name *
              </label>
              <input
                type="text"
                id="cardholderName"
                name="cardholderName"
                value={cardData.cardholderName}
                onChange={handleCardDataChange}
                data-testid="cardholderName-input"
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.cardholderName ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="John Doe"
              />
              {errors.cardholderName && (
                <p className="mt-1 text-sm text-red-600">{errors.cardholderName}</p>
              )}
            </div>

            <div>
              <label htmlFor="cardNumber" className="block text-sm font-medium text-gray-700 mb-1">
                Card Number *
              </label>
              <input
                type="text"
                id="cardNumber"
                name="cardNumber"
                value={cardData.cardNumber}
                onChange={handleCardDataChange}
                data-testid="cardNumber-input"
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.cardNumber ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="1234 5678 9012 3456"
              />
              {errors.cardNumber && (
                <p className="mt-1 text-sm text-red-600">{errors.cardNumber}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="expiryDate" className="block text-sm font-medium text-gray-700 mb-1">
                  Expiry Date *
                </label>
                <input
                  type="text"
                  id="expiryDate"
                  name="expiryDate"
                  value={cardData.expiryDate}
                  onChange={handleCardDataChange}
                  data-testid="expiryDate-input"
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.expiryDate ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="MM/YY"
                />
                {errors.expiryDate && (
                  <p className="mt-1 text-sm text-red-600">{errors.expiryDate}</p>
                )}
              </div>

              <div>
                <label htmlFor="cvv" className="block text-sm font-medium text-gray-700 mb-1">
                  CVV *
                </label>
                <input
                  type="text"
                  id="cvv"
                  name="cvv"
                  value={cardData.cvv}
                  onChange={handleCardDataChange}
                  data-testid="cvv-input"
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.cvv ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="123"
                />
                {errors.cvv && (
                  <p className="mt-1 text-sm text-red-600">{errors.cvv}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Other Payment Methods Info */}
        {paymentMethod === 'paypal' && (
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <p className="text-sm text-blue-800">
              You will be redirected to PayPal to complete your payment securely.
            </p>
          </div>
        )}

        {paymentMethod === 'bank_transfer' && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
            <p className="text-sm text-yellow-800">
              Bank transfer details will be provided after order confirmation. 
              Your order will be processed once payment is received.
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-4 pt-4">
          <button
            type="button"
            onClick={onBack}
            className="flex-1 bg-gray-200 text-gray-800 py-3 px-4 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 font-medium transition-colors"
            disabled={isProcessing}
          >
            Back to Shipping
          </button>
          
          <button
            type="submit"
            disabled={isProcessing}
            data-testid="place-order-button"
            className="flex-1 bg-green-600 text-white py-3 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? (
              <div className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </div>
            ) : (
              'Place Order'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PaymentForm;