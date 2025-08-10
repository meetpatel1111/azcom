import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import OrderStatusBadge from '../OrderStatusBadge';
import { Order } from '../../../types';

describe('OrderStatusBadge', () => {
  it('renders pending status correctly', () => {
    render(<OrderStatusBadge status="pending" />);
    
    expect(screen.getByText('Pending')).toBeInTheDocument();
    const badge = screen.getByText('Pending').closest('span').parentElement;
    expect(badge).toHaveClass('bg-yellow-100', 'text-yellow-800', 'border-yellow-200');
  });

  it('renders processing status correctly', () => {
    render(<OrderStatusBadge status="processing" />);
    
    expect(screen.getByText('Processing')).toBeInTheDocument();
    const badge = screen.getByText('Processing').closest('span').parentElement;
    expect(badge).toHaveClass('bg-blue-100', 'text-blue-800', 'border-blue-200');
  });

  it('renders shipped status correctly', () => {
    render(<OrderStatusBadge status="shipped" />);
    
    expect(screen.getByText('Shipped')).toBeInTheDocument();
    const badge = screen.getByText('Shipped').closest('span').parentElement;
    expect(badge).toHaveClass('bg-purple-100', 'text-purple-800', 'border-purple-200');
  });

  it('renders delivered status correctly', () => {
    render(<OrderStatusBadge status="delivered" />);
    
    expect(screen.getByText('Delivered')).toBeInTheDocument();
    const badge = screen.getByText('Delivered').closest('span').parentElement;
    expect(badge).toHaveClass('bg-green-100', 'text-green-800', 'border-green-200');
  });

  it('renders cancelled status correctly', () => {
    render(<OrderStatusBadge status="cancelled" />);
    
    expect(screen.getByText('Cancelled')).toBeInTheDocument();
    const badge = screen.getByText('Cancelled').closest('span').parentElement;
    expect(badge).toHaveClass('bg-red-100', 'text-red-800', 'border-red-200');
  });

  it('renders unknown status with fallback', () => {
    // TypeScript would normally prevent this, but testing edge case
    render(<OrderStatusBadge status={'unknown' as Order['status']} />);
    
    expect(screen.getByText('Unknown')).toBeInTheDocument();
    const badge = screen.getByText('Unknown').closest('span').parentElement;
    expect(badge).toHaveClass('bg-gray-100', 'text-gray-800', 'border-gray-200');
  });

  it('includes appropriate icons for each status', () => {
    const statuses: Order['status'][] = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
    
    statuses.forEach((status) => {
      const { unmount } = render(<OrderStatusBadge status={status} />);
      
      // Each status should have an SVG icon
      const svgElements = document.querySelectorAll('svg');
      expect(svgElements.length).toBeGreaterThan(0);
      expect(svgElements[0].tagName).toBe('svg');
      
      unmount();
    });
  });

  it('has correct CSS classes for badge styling', () => {
    render(<OrderStatusBadge status="delivered" />);
    
    const badge = screen.getByText('Delivered').closest('span').parentElement;
    expect(badge).toHaveClass(
      'inline-flex',
      'items-center',
      'px-2.5',
      'py-0.5',
      'rounded-full',
      'text-xs',
      'font-medium',
      'border'
    );
  });

  it('displays status text with proper capitalization', () => {
    const statuses: Array<{ status: Order['status']; expectedText: string }> = [
      { status: 'pending', expectedText: 'Pending' },
      { status: 'processing', expectedText: 'Processing' },
      { status: 'shipped', expectedText: 'Shipped' },
      { status: 'delivered', expectedText: 'Delivered' },
      { status: 'cancelled', expectedText: 'Cancelled' },
    ];

    statuses.forEach(({ status, expectedText }) => {
      const { unmount } = render(<OrderStatusBadge status={status} />);
      expect(screen.getByText(expectedText)).toBeInTheDocument();
      unmount();
    });
  });
});