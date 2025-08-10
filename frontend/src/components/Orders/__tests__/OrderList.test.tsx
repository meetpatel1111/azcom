import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import OrderList from '../OrderList';
import { Order } from '../../../types';

// Mock OrderCard component
vi.mock('../OrderCard', () => ({
  default: ({ order, onViewOrder, onReorder }: any) => (
    <div data-testid={`order-card-${order.id}`}>
      <span>Order #{order.id}</span>
      <button onClick={() => onViewOrder(order.id)}>View Order</button>
      <button onClick={() => onReorder(order.id)}>Reorder</button>
    </div>
  ),
}));

describe('OrderList', () => {
  const mockOrders: Order[] = [
    {
      id: 'order-1',
      userId: 'user-1',
      items: [
        {
          productId: 'product-1',
          productName: 'Test Product 1',
          price: 29.99,
          quantity: 2,
        },
      ],
      totalAmount: 59.98,
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
      createdAt: '2023-01-01T00:00:00Z',
      updatedAt: '2023-01-01T00:00:00Z',
    },
    {
      id: 'order-2',
      userId: 'user-1',
      items: [
        {
          productId: 'product-2',
          productName: 'Test Product 2',
          price: 19.99,
          quantity: 1,
        },
      ],
      totalAmount: 19.99,
      status: 'pending',
      shippingAddress: {
        street: '456 Oak Ave',
        city: 'Los Angeles',
        state: 'CA',
        zipCode: '90210',
      },
      paymentInfo: {
        method: 'paypal',
      },
      createdAt: '2023-01-02T00:00:00Z',
      updatedAt: '2023-01-02T00:00:00Z',
    },
  ];

  const mockOnViewOrder = vi.fn();
  const mockOnReorder = vi.fn();

  beforeEach(() => {
    mockOnViewOrder.mockClear();
    mockOnReorder.mockClear();
  });

  it('renders all orders', () => {
    render(
      <OrderList
        orders={mockOrders}
        onViewOrder={mockOnViewOrder}
        onReorder={mockOnReorder}
      />
    );

    expect(screen.getByTestId('order-card-order-1')).toBeInTheDocument();
    expect(screen.getByTestId('order-card-order-2')).toBeInTheDocument();
  });

  it('sorts orders by creation date (newest first)', () => {
    render(
      <OrderList
        orders={mockOrders}
        onViewOrder={mockOnViewOrder}
        onReorder={mockOnReorder}
      />
    );

    const orderCards = screen.getAllByText(/Order #/);
    expect(orderCards[0]).toHaveTextContent('Order #order-2'); // Newer order first
    expect(orderCards[1]).toHaveTextContent('Order #order-1'); // Older order second
  });

  it('renders empty list when no orders provided', () => {
    render(
      <OrderList
        orders={[]}
        onViewOrder={mockOnViewOrder}
        onReorder={mockOnReorder}
      />
    );

    expect(screen.queryByTestId(/order-card-/)).not.toBeInTheDocument();
  });

  it('passes correct props to OrderCard components', () => {
    render(
      <OrderList
        orders={[mockOrders[0]]}
        onViewOrder={mockOnViewOrder}
        onReorder={mockOnReorder}
      />
    );

    const viewButton = screen.getByText('View Order');
    const reorderButton = screen.getByText('Reorder');

    expect(viewButton).toBeInTheDocument();
    expect(reorderButton).toBeInTheDocument();
  });

  it('handles single order correctly', () => {
    render(
      <OrderList
        orders={[mockOrders[0]]}
        onViewOrder={mockOnViewOrder}
        onReorder={mockOnReorder}
      />
    );

    expect(screen.getByTestId('order-card-order-1')).toBeInTheDocument();
    expect(screen.queryByTestId('order-card-order-2')).not.toBeInTheDocument();
  });
});