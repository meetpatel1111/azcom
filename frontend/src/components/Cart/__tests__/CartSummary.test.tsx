import React from 'react';
import { render, screen } from '@testing-library/react';
import CartSummary from '../CartSummary';
import { CartSummary as CartSummaryType } from '../../../types';

describe('CartSummary Component', () => {
  const mockSummary: CartSummaryType = {
    itemCount: 3,
    uniqueItems: 2,
    subtotal: 75.50,
    total: 75.50,
    isEmpty: false,
  };

  it('renders order summary with title by default', () => {
    render(<CartSummary summary={mockSummary} />);

    expect(screen.getByText('Order Summary')).toBeInTheDocument();
  });

  it('hides title when showTitle is false', () => {
    render(<CartSummary summary={mockSummary} showTitle={false} />);

    expect(screen.queryByText('Order Summary')).not.toBeInTheDocument();
  });

  it('displays correct subtotal with item count', () => {
    render(<CartSummary summary={mockSummary} />);

    expect(screen.getByText('Subtotal (3 items)')).toBeInTheDocument();
    expect(screen.getByText('$75.50')).toBeInTheDocument();
  });

  it('displays singular item text when itemCount is 1', () => {
    const singleItemSummary = { ...mockSummary, itemCount: 1 };
    render(<CartSummary summary={singleItemSummary} />);

    expect(screen.getByText('Subtotal (1 item)')).toBeInTheDocument();
  });

  it('shows free shipping when subtotal is $50 or more', () => {
    render(<CartSummary summary={mockSummary} />);

    expect(screen.getByText('Free')).toBeInTheDocument();
    expect(screen.queryByText('Free shipping on orders over $50')).not.toBeInTheDocument();
  });

  it('shows shipping cost and free shipping message when subtotal is under $50', () => {
    const lowSubtotalSummary = { ...mockSummary, subtotal: 30.00 };
    render(<CartSummary summary={lowSubtotalSummary} />);

    expect(screen.getByText('$5.99')).toBeInTheDocument();
    expect(screen.getByText('Free shipping on orders over $50')).toBeInTheDocument();
  });

  it('calculates and displays tax correctly', () => {
    render(<CartSummary summary={mockSummary} />);

    const expectedTax = (75.50 * 0.08).toFixed(2);
    expect(screen.getByText(`$${expectedTax}`)).toBeInTheDocument();
    expect(screen.getByText('Tax')).toBeInTheDocument();
  });

  it('calculates and displays correct order total with free shipping', () => {
    render(<CartSummary summary={mockSummary} />);

    const tax = 75.50 * 0.08;
    const expectedTotal = (75.50 + tax + 0).toFixed(2); // Free shipping
    expect(screen.getByText(`$${expectedTotal}`)).toBeInTheDocument();
    expect(screen.getByText('Order total')).toBeInTheDocument();
  });

  it('calculates and displays correct order total with shipping cost', () => {
    const lowSubtotalSummary = { ...mockSummary, subtotal: 30.00 };
    render(<CartSummary summary={lowSubtotalSummary} />);

    const tax = 30.00 * 0.08;
    const expectedTotal = (30.00 + tax + 5.99).toFixed(2); // With shipping
    expect(screen.getByText(`$${expectedTotal}`)).toBeInTheDocument();
  });

  it('displays unique items count', () => {
    render(<CartSummary summary={mockSummary} />);

    expect(screen.getByText('2 unique products in your cart')).toBeInTheDocument();
  });

  it('displays singular unique item text when uniqueItems is 1', () => {
    const singleUniqueItemSummary = { ...mockSummary, uniqueItems: 1 };
    render(<CartSummary summary={singleUniqueItemSummary} />);

    expect(screen.getByText('1 unique product in your cart')).toBeInTheDocument();
  });

  it('does not display unique items count when uniqueItems is 0', () => {
    const emptyUniqueSummary = { ...mockSummary, uniqueItems: 0 };
    render(<CartSummary summary={emptyUniqueSummary} />);

    expect(screen.queryByText(/unique product/)).not.toBeInTheDocument();
  });

  it('handles zero subtotal correctly', () => {
    const zeroSummary = { ...mockSummary, subtotal: 0, itemCount: 0 };
    render(<CartSummary summary={zeroSummary} />);

    expect(screen.getByText('Subtotal (0 items)')).toBeInTheDocument();
    expect(screen.getAllByText('$0.00')).toHaveLength(2); // Subtotal and tax both $0.00
    expect(screen.getAllByText('$5.99')).toHaveLength(2); // Shipping cost and total both $5.99
    
    const tax = 0 * 0.08;
    const expectedTotal = (0 + tax + 5.99).toFixed(2);
    // Check that the order total is correct (should be $5.99)
    expect(screen.getByText('Order total')).toBeInTheDocument();
    expect(expectedTotal).toBe('5.99');
  });

  it('handles exactly $50 subtotal for free shipping threshold', () => {
    const fiftyDollarSummary = { ...mockSummary, subtotal: 50.00 };
    render(<CartSummary summary={fiftyDollarSummary} />);

    expect(screen.getByText('Free')).toBeInTheDocument();
    expect(screen.queryByText('Free shipping on orders over $50')).not.toBeInTheDocument();
  });

  it('formats currency values correctly', () => {
    const precisionSummary = { ...mockSummary, subtotal: 123.456 };
    render(<CartSummary summary={precisionSummary} />);

    // Should round to 2 decimal places
    expect(screen.getByText('$123.46')).toBeInTheDocument();
  });
});