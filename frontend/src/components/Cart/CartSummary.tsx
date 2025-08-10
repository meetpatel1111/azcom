import React from 'react';
import { CartSummary as CartSummaryType } from '../../types';

interface CartSummaryProps {
  summary: CartSummaryType;
  showTitle?: boolean;
}

const CartSummary: React.FC<CartSummaryProps> = ({ 
  summary, 
  showTitle = true 
}) => {
  const taxRate = 0.08; // 8% tax rate
  const shippingCost = summary.subtotal >= 50 ? 0 : 5.99;
  const tax = summary.subtotal * taxRate;
  const finalTotal = summary.subtotal + tax + shippingCost;

  return (
    <div>
      {showTitle && (
        <h2 id="summary-heading" className="text-lg font-medium text-gray-900">
          Order Summary
        </h2>
      )}

      <dl className="mt-6 space-y-4">
        <div className="flex items-center justify-between">
          <dt className="text-sm text-gray-600">
            Subtotal ({summary.itemCount} {summary.itemCount === 1 ? 'item' : 'items'})
          </dt>
          <dd className="text-sm font-medium text-gray-900">
            ${summary.subtotal.toFixed(2)}
          </dd>
        </div>

        <div className="border-t border-gray-200 pt-4">
          <div className="flex items-center justify-between">
            <dt className="text-sm text-gray-600">Shipping</dt>
            <dd className="text-sm font-medium text-gray-900">
              {shippingCost === 0 ? (
                <span className="text-green-600">Free</span>
              ) : (
                `$${shippingCost.toFixed(2)}`
              )}
            </dd>
          </div>
          {summary.subtotal < 50 && shippingCost > 0 && (
            <p className="mt-1 text-xs text-gray-500">
              Free shipping on orders over $50
            </p>
          )}
        </div>

        <div className="flex items-center justify-between">
          <dt className="text-sm text-gray-600">Tax</dt>
          <dd className="text-sm font-medium text-gray-900">
            ${tax.toFixed(2)}
          </dd>
        </div>

        <div className="border-t border-gray-200 pt-4">
          <div className="flex items-center justify-between">
            <dt className="text-base font-medium text-gray-900">Order total</dt>
            <dd className="text-base font-medium text-gray-900" data-testid="cart-total">
              ${finalTotal.toFixed(2)}
            </dd>
          </div>
        </div>
      </dl>

      {summary.uniqueItems > 0 && (
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            {summary.uniqueItems} unique {summary.uniqueItems === 1 ? 'product' : 'products'} in your cart
          </p>
        </div>
      )}
    </div>
  );
};

export default CartSummary;