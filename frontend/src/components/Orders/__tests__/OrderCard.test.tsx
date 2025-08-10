import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import OrderCard from '../OrderCard';
import { Order } from '../../../types';

// Mock OrderStatusBadge component
vi.mock('../OrderStatusBadge', () => ({
  default: ({ status }: { status: string }) => (
    <span data-testid="status-badge">{status}</span>
  ),
}));

describe('OrderCard', () => {
  const mockOrder: Order = {
    id: 'ORD-123456789',
    userId: 'user-1',
    items: [
      {
        productId: 'product-1',
        productName: 'Test Product 1',
        price: 29.99,
        quantity: 2,
      },
      {
        productId: 'product-2',
        productName: 'Test Product 2',
        price: 19.99,
        quantity: 1,
      },
    ],
    totalAmount: 79.97,
    status: 'delivered',
    shippingAddress: {
      street: '123 Main St',
      city: 'New York',
      state: 'NY',
      zipCode: '10001',
    },
    paymentInfo: {
      method: 'credit_card',
      cardLast4: '1234',
      cardBrand: 'Visa',
    },
    createdAt: '2023-01-15T10:30:00Z',
    updatedAt: '2023-01-15T10:30:00Z',
  };

  const mockOnViewOrder = vi.fn();
  const mockOnReorder = vi.fn();

  beforeEach(() => {
    mockOnViewOrder.mockClear();
    mockOnReorder.mockClear();
  });

  it('renders order information correctly', () => {
    render(
      <OrderCard
        order={mockOrder}
        onViewOrder={mockOnViewOrder}
        onReorder={mockOnReorder}
      />
    );

    expect(screen.getByText('Order #ORD-123456789')).toBeInTheDocument();
    expect(screen.getByText('Placed on January 15, 2023')).toBeInTheDocument();
    expect(screen.getByText('$79.97')).toBeInTheDocument();
    expect(screen.getByTestId('status-badge')).toHaveTextContent('delivered');
  });

  it('displays order items preview', () => {
    render(
      <OrderCard
        order={mockOrder}
        onViewOrder={mockOnViewOrder}
        onReorder={mockOnReorder}
      />
    );

    expect(screen.getByText('Test Product 1')).toBeInTheDocument();
    expect(screen.getByText('Test Product 2')).toBeInTheDocument();
    expect(screen.getByText('Qty: 2 × $29.99')).toBeInTheDocument();
    expect(screen.getByText('Qty: 1 × $19.99')).toBeInTheDocument();
  });

  it('shows "+X more items" when there are more than 3 items', () => {
    const orderWithManyItems: Order = {
      ...mockOrder,
      items: [
        ...mockOrder.items,
        {
          productId: 'product-3',
          productName: 'Test Product 3',
          price: 39.99,
          quantity: 1,
        },
        {
          productId: 'product-4',
          productName: 'Test Product 4',
          price: 49.99,
          quantity: 1,
        },
      ],
    };

    render(
      <OrderCard
        order={orderWithManyItems}
        onViewOrder={mockOnViewOrder}
        onReorder={mockOnReorder}
      />
    );

    expect(screen.getByText('+1 more items')).toBeInTheDocument();
  });

  it('displays shipping address', () => {
    render(
      <OrderCard
        order={mockOrder}
        onViewOrder={mockOnViewOrder}
        onReorder={mockOnReorder}
      />
    );

    expect(screen.getByText(/Shipping to:/)).toBeInTheDocument();
    expect(screen.getByText('123 Main St, New York, NY 10001')).toBeInTheDocument();
  });

  it('shows View Details button for all orders', () => {
    render(
      <OrderCard
        order={mockOrder}
        onViewOrder={mockOnViewOrder}
        onReorder={mockOnReorder}
      />
    );

    expect(screen.getByText('View Details')).toBeInTheDocument();
  });

  it('shows Reorder button for delivered orders', () => {
    render(
      <OrderCard
        order={mockOrder}
        onViewOrder={mockOnViewOrder}
        onReorder={mockOnReorder}
      />
    );

    expect(screen.getByText('Reorder')).toBeInTheDocument();
  });

  it('shows Reorder button for cancelled orders', () => {
    const cancelledOrder: Order = {
      ...mockOrder,
      status: 'cancelled',
    };

    render(
      <OrderCard
        order={cancelledOrder}
        onViewOrder={mockOnViewOrder}
        onReorder={mockOnReorder}
      />
    );

    expect(screen.getByText('Reorder')).toBeInTheDocument();
  });

  it('shows Cancel Order button for pending orders', () => {
    const pendingOrder: Order = {
      ...mockOrder,
      status: 'pending',
    };

    render(
      <OrderCard
        order={pendingOrder}
        onViewOrder={mockOnViewOrder}
        onReorder={mockOnReorder}
      />
    );

    expect(screen.getByText('Cancel Order')).toBeInTheDocument();
  });

  it('shows Cancel Order button for processing orders', () => {
    const processingOrder: Order = {
      ...mockOrder,
      status: 'processing',
    };

    render(
      <OrderCard
        order={processingOrder}
        onViewOrder={mockOnViewOrder}
        onReorder={mockOnReorder}
      />
    );

    expect(screen.getByText('Cancel Order')).toBeInTheDocument();
  });

  it('does not show Reorder button for pending orders', () => {
    const pendingOrder: Order = {
      ...mockOrder,
      status: 'pending',
    };

    render(
      <OrderCard
        order={pendingOrder}
        onViewOrder={mockOnViewOrder}
        onReorder={mockOnReorder}
      />
    );

    expect(screen.queryByText('Reorder')).not.toBeInTheDocument();
  });

  it('calls onViewOrder when View Details button is clicked', () => {
    render(
      <OrderCard
        order={mockOrder}
        onViewOrder={mockOnViewOrder}
        onReorder={mockOnReorder}
      />
    );

    const viewButton = screen.getByText('View Details');
    fireEvent.click(viewButton);

    expect(mockOnViewOrder).toHaveBeenCalledWith('ORD-123456789');
  });

  it('calls onReorder when Reorder button is clicked', () => {
    render(
      <OrderCard
        order={mockOrder}
        onViewOrder={mockOnViewOrder}
        onReorder={mockOnReorder}
      />
    );

    const reorderButton = screen.getByText('Reorder');
    fireEvent.click(reorderButton);

    expect(mockOnReorder).toHaveBeenCalledWith('ORD-123456789');
  });

  it('formats date correctly', () => {
    const orderWithSpecificDate: Order = {
      ...mockOrder,
      createdAt: '2023-12-25T15:45:30Z',
    };

    render(
      <OrderCard
        order={orderWithSpecificDate}
        onViewOrder={mockOnViewOrder}
        onReorder={mockOnReorder}
      />
    );

    expect(screen.getByText('Placed on December 25, 2023')).toBeInTheDocument();
  });
});