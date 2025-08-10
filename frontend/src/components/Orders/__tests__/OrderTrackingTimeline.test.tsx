import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import OrderTrackingTimeline from '../OrderTrackingTimeline';
import { OrderTracking } from '../../../types';

describe('OrderTrackingTimeline', () => {
  const mockTracking: OrderTracking = {
    orderId: 'ORD-123456789',
    currentStatus: 'In Transit',
    timeline: [
      {
        status: 'pending',
        title: 'Order Placed',
        description: 'Your order has been placed and is being processed.',
        date: '2023-01-15T10:00:00Z',
        completed: true,
        estimated: false,
      },
      {
        status: 'processing',
        title: 'Order Processing',
        description: 'Your order is being prepared for shipment.',
        date: '2023-01-16T09:00:00Z',
        completed: true,
        estimated: false,
      },
      {
        status: 'shipped',
        title: 'Order Shipped',
        description: 'Your order has been shipped and is on its way.',
        date: '2023-01-17T14:30:00Z',
        completed: false,
        estimated: false,
      },
      {
        status: 'delivered',
        title: 'Order Delivered',
        description: 'Your order has been delivered to your address.',
        date: '2023-01-20T16:00:00Z',
        completed: false,
        estimated: true,
      },
    ],
    estimatedDelivery: '2023-01-20T16:00:00Z',
    trackingInfo: {
      canCancel: false,
      canReturn: true,
      canReorder: false,
    },
  };

  it('renders current status section', () => {
    render(<OrderTrackingTimeline tracking={mockTracking} />);
    
    expect(screen.getByText('In Transit')).toBeInTheDocument();
    expect(screen.getByText('Estimated delivery: Jan 20, 09:30 PM')).toBeInTheDocument();
  });

  it('renders all timeline events', () => {
    render(<OrderTrackingTimeline tracking={mockTracking} />);
    
    expect(screen.getByText('Order Placed')).toBeInTheDocument();
    expect(screen.getByText('Order Processing')).toBeInTheDocument();
    expect(screen.getByText('Order Shipped')).toBeInTheDocument();
    expect(screen.getByText('Order Delivered')).toBeInTheDocument();
  });

  it('displays event descriptions', () => {
    render(<OrderTrackingTimeline tracking={mockTracking} />);
    
    expect(screen.getByText('Your order has been placed and is being processed.')).toBeInTheDocument();
    expect(screen.getByText('Your order is being prepared for shipment.')).toBeInTheDocument();
    expect(screen.getByText('Your order has been shipped and is on its way.')).toBeInTheDocument();
    expect(screen.getByText('Your order has been delivered to your address.')).toBeInTheDocument();
  });

  it('shows estimated label for estimated events', () => {
    render(<OrderTrackingTimeline tracking={mockTracking} />);
    
    expect(screen.getByText('(Estimated)')).toBeInTheDocument();
  });

  it('formats dates correctly', () => {
    render(<OrderTrackingTimeline tracking={mockTracking} />);
    
    expect(screen.getByText('Jan 15, 03:30 PM')).toBeInTheDocument();
    expect(screen.getByText('Jan 16, 02:30 PM')).toBeInTheDocument();
    expect(screen.getByText('Jan 17, 08:00 PM')).toBeInTheDocument();
    expect(screen.getByText('Jan 20, 09:30 PM')).toBeInTheDocument();
  });

  it('applies correct styling for completed events', () => {
    render(<OrderTrackingTimeline tracking={mockTracking} />);
    
    const completedTitle = screen.getByText('Order Placed');
    expect(completedTitle).toHaveClass('text-gray-900');
  });

  it('applies correct styling for estimated events', () => {
    render(<OrderTrackingTimeline tracking={mockTracking} />);
    
    const estimatedTitle = screen.getByText('Order Delivered');
    expect(estimatedTitle).toHaveClass('text-gray-500');
  });

  it('applies correct styling for current/active events', () => {
    render(<OrderTrackingTimeline tracking={mockTracking} />);
    
    const activeTitle = screen.getByText('Order Shipped');
    expect(activeTitle).toHaveClass('text-blue-600');
  });

  it('shows cancel button when canCancel is true', () => {
    const trackingWithCancel: OrderTracking = {
      ...mockTracking,
      trackingInfo: {
        ...mockTracking.trackingInfo,
        canCancel: true,
      },
    };

    render(<OrderTrackingTimeline tracking={trackingWithCancel} />);
    
    expect(screen.getByText('Cancel Order')).toBeInTheDocument();
  });

  it('shows return button when canReturn is true', () => {
    render(<OrderTrackingTimeline tracking={mockTracking} />);
    
    expect(screen.getByText('Return Items')).toBeInTheDocument();
  });

  it('does not show action buttons when neither canCancel nor canReturn is true', () => {
    const trackingWithoutActions: OrderTracking = {
      ...mockTracking,
      trackingInfo: {
        canCancel: false,
        canReturn: false,
        canReorder: false,
      },
    };

    render(<OrderTrackingTimeline tracking={trackingWithoutActions} />);
    
    expect(screen.queryByText('Cancel Order')).not.toBeInTheDocument();
    expect(screen.queryByText('Return Items')).not.toBeInTheDocument();
  });

  it('does not show estimated delivery when not provided', () => {
    const trackingWithoutEstimatedDelivery: OrderTracking = {
      ...mockTracking,
      estimatedDelivery: undefined,
    };

    render(<OrderTrackingTimeline tracking={trackingWithoutEstimatedDelivery} />);
    
    expect(screen.queryByText(/Estimated delivery:/)).not.toBeInTheDocument();
  });

  it('renders timeline with proper visual hierarchy', () => {
    render(<OrderTrackingTimeline tracking={mockTracking} />);
    
    // Check for timeline structure
    const timeline = screen.getByRole('list');
    expect(timeline).toBeInTheDocument();
    
    // Check for timeline items
    const timelineItems = screen.getAllByRole('listitem');
    expect(timelineItems).toHaveLength(4);
  });

  it('displays icons for different event states', () => {
    render(<OrderTrackingTimeline tracking={mockTracking} />);
    
    // Should have SVG icons for each timeline event
    const svgElements = document.querySelectorAll('svg');
    expect(svgElements.length).toBeGreaterThan(0);
  });
});