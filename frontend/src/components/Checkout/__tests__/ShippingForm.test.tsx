import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ShippingForm from '../ShippingForm';
import { Address } from '../../../types';

describe('ShippingForm', () => {
  const mockAddress: Address = {
    street: '123 Main St',
    city: 'New York',
    state: 'NY',
    zipCode: '10001',
  };

  const mockOnSubmit = vi.fn();

  beforeEach(() => {
    mockOnSubmit.mockClear();
  });

  it('renders shipping form with initial data', () => {
    render(<ShippingForm initialData={mockAddress} onSubmit={mockOnSubmit} />);
    
    expect(screen.getByDisplayValue('123 Main St')).toBeInTheDocument();
    expect(screen.getByDisplayValue('New York')).toBeInTheDocument();
    expect(screen.getByDisplayValue('NY')).toBeInTheDocument();
    expect(screen.getByDisplayValue('10001')).toBeInTheDocument();
  });

  it('validates required fields', async () => {
    const emptyAddress: Address = {
      street: '',
      city: '',
      state: '',
      zipCode: '',
    };

    render(<ShippingForm initialData={emptyAddress} onSubmit={mockOnSubmit} />);
    
    const submitButton = screen.getByText('Continue to Payment');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Street address is required')).toBeInTheDocument();
      expect(screen.getByText('City is required')).toBeInTheDocument();
      expect(screen.getByText('State is required')).toBeInTheDocument();
      expect(screen.getByText('ZIP code is required')).toBeInTheDocument();
    });

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('validates ZIP code format', async () => {
    const invalidZipAddress: Address = {
      street: '123 Main St',
      city: 'New York',
      state: 'NY',
      zipCode: '123',
    };

    render(<ShippingForm initialData={invalidZipAddress} onSubmit={mockOnSubmit} />);
    
    const submitButton = screen.getByText('Continue to Payment');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Please enter a valid ZIP code (e.g., 12345 or 12345-6789)')).toBeInTheDocument();
    });

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('accepts valid ZIP code formats', async () => {
    const validZipAddress: Address = {
      street: '123 Main St',
      city: 'New York',
      state: 'NY',
      zipCode: '12345-6789',
    };

    render(<ShippingForm initialData={validZipAddress} onSubmit={mockOnSubmit} />);
    
    const submitButton = screen.getByText('Continue to Payment');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(validZipAddress);
    });
  });

  it('clears errors when user starts typing', async () => {
    const emptyAddress: Address = {
      street: '',
      city: '',
      state: '',
      zipCode: '',
    };

    render(<ShippingForm initialData={emptyAddress} onSubmit={mockOnSubmit} />);
    
    // Trigger validation errors
    const submitButton = screen.getByText('Continue to Payment');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Street address is required')).toBeInTheDocument();
    });

    // Start typing in street field
    const streetInput = screen.getByLabelText('Street Address *');
    fireEvent.change(streetInput, { target: { value: '123' } });

    await waitFor(() => {
      expect(screen.queryByText('Street address is required')).not.toBeInTheDocument();
    });
  });

  it('submits form with valid data', async () => {
    render(<ShippingForm initialData={mockAddress} onSubmit={mockOnSubmit} />);
    
    const submitButton = screen.getByText('Continue to Payment');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(mockAddress);
    });
  });

  it('updates form data when inputs change', () => {
    render(<ShippingForm initialData={mockAddress} onSubmit={mockOnSubmit} />);
    
    const streetInput = screen.getByLabelText('Street Address *');
    fireEvent.change(streetInput, { target: { value: '456 Oak Ave' } });

    expect(streetInput).toHaveValue('456 Oak Ave');
  });
});