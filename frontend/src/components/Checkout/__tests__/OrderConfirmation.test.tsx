import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import OrderConfirmation from '../OrderConfirmation';

describe('OrderConfirmation', () => {
  const mockOnContinueShopping = vi.fn();
  const mockOnViewOrder = vi.fn();
  const mockOrderId = 'ORD-123456789';

  beforeEach(() => {
    mockOnContinueShopping.mockClear();
    mockOnViewOrder.mockClear();
  });

  it('renders success message and order ID', () => {
    render(
      <OrderConfirmation
        orderId={mockOrderId}
        onContinueShopping={mockOnContinueShopping}
        onViewOrder={mockOnViewOrder}
      />
    );
    
    expect(screen.getByText('Order Placed Successfully!')).toBeInTheDocument();
    expect(screen.getByText('Thank you for your purchase. Your order has been confirmed and will be processed shortly.')).toBeInTheDocument();
    expect(screen.getByText(`#${mockOrderId}`)).toBeInTheDocument();
  });

  it('displays success icon', () => {
    render(
      <OrderConfirmation
        orderId={mockOrderId}
        onContinueShopping={mockOnContinueShopping}
        onViewOrder={mockOnViewOrder}
      />
    );
    
    // Check for the checkmark SVG
    const successIcon = screen.getByRole('img', { hidden: true });
    expect(successIcon).toBeInTheDocument();
  });

  it('shows what\'s next section with steps', () => {
    render(
      <OrderConfirmation
        orderId={mockOrderId}
        onContinueShopping={mockOnContinueShopping}
        onViewOrder={mockOnViewOrder}
      />
    );
    
    expect(screen.getByText('What\'s Next?')).toBeInTheDocument();
    expect(screen.getByText('Order Confirmation')).toBeInTheDocument();
    expect(screen.getByText('Processing')).toBeInTheDocument();
    expect(screen.getByText('Shipping')).toBeInTheDocument();
    
    expect(screen.getByText('You\'ll receive an email confirmation shortly with your order details.')).toBeInTheDocument();
    expect(screen.getByText('We\'ll prepare your order for shipment within 1-2 business days.')).toBeInTheDocument();
    expect(screen.getByText('You\'ll receive tracking information once your order ships.')).toBeInTheDocument();
  });

  it('renders action buttons', () => {
    render(
      <OrderConfirmation
        orderId={mockOrderId}
        onContinueShopping={mockOnContinueShopping}
        onViewOrder={mockOnViewOrder}
      />
    );
    
    expect(screen.getByText('View Order Details')).toBeInTheDocument();
    expect(screen.getByText('Continue Shopping')).toBeInTheDocument();
  });

  it('calls onViewOrder when view order button is clicked', () => {
    render(
      <OrderConfirmation
        orderId={mockOrderId}
        onContinueShopping={mockOnContinueShopping}
        onViewOrder={mockOnViewOrder}
      />
    );
    
    const viewOrderButton = screen.getByText('View Order Details');
    fireEvent.click(viewOrderButton);
    
    expect(mockOnViewOrder).toHaveBeenCalledTimes(1);
  });

  it('calls onContinueShopping when continue shopping button is clicked', () => {
    render(
      <OrderConfirmation
        orderId={mockOrderId}
        onContinueShopping={mockOnContinueShopping}
        onViewOrder={mockOnViewOrder}
      />
    );
    
    const continueShoppingButton = screen.getByText('Continue Shopping');
    fireEvent.click(continueShoppingButton);
    
    expect(mockOnContinueShopping).toHaveBeenCalledTimes(1);
  });

  it('displays support contact information', () => {
    render(
      <OrderConfirmation
        orderId={mockOrderId}
        onContinueShopping={mockOnContinueShopping}
        onViewOrder={mockOnViewOrder}
      />
    );
    
    expect(screen.getByText('Need help? Contact our support team at')).toBeInTheDocument();
    
    const supportLink = screen.getByRole('link', { name: 'support@example.com' });
    expect(supportLink).toBeInTheDocument();
    expect(supportLink).toHaveAttribute('href', 'mailto:support@example.com');
  });

  it('displays order number section with proper styling', () => {
    render(
      <OrderConfirmation
        orderId={mockOrderId}
        onContinueShopping={mockOnContinueShopping}
        onViewOrder={mockOnViewOrder}
      />
    );
    
    expect(screen.getByText('Order Number')).toBeInTheDocument();
    
    const orderIdElement = screen.getByText(`#${mockOrderId}`);
    expect(orderIdElement).toBeInTheDocument();
    expect(orderIdElement).toHaveClass('font-mono'); // Monospace font for order ID
  });

  it('displays numbered steps correctly', () => {
    render(
      <OrderConfirmation
        orderId={mockOrderId}
        onContinueShopping={mockOnContinueShopping}
        onViewOrder={mockOnViewOrder}
      />
    );
    
    // Check for step numbers
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });
});