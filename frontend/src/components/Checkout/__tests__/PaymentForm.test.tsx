import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import PaymentForm from '../PaymentForm';

describe('PaymentForm', () => {
  const mockOnSubmit = vi.fn();
  const mockOnBack = vi.fn();

  beforeEach(() => {
    mockOnSubmit.mockClear();
    mockOnBack.mockClear();
  });

  it('renders payment form with default credit card method', () => {
    render(<PaymentForm onSubmit={mockOnSubmit} onBack={mockOnBack} isProcessing={false} />);
    
    expect(screen.getByText('Payment Information')).toBeInTheDocument();
    expect(screen.getByLabelText('Credit Card')).toBeChecked();
    expect(screen.getByLabelText('Cardholder Name *')).toBeInTheDocument();
  });

  it('shows different payment method options', () => {
    render(<PaymentForm onSubmit={mockOnSubmit} onBack={mockOnBack} isProcessing={false} />);
    
    expect(screen.getByLabelText('Credit Card')).toBeInTheDocument();
    expect(screen.getByLabelText('Debit Card')).toBeInTheDocument();
    expect(screen.getByLabelText('PayPal')).toBeInTheDocument();
    expect(screen.getByLabelText('Bank Transfer')).toBeInTheDocument();
  });

  it('shows card form for credit/debit card selection', () => {
    render(<PaymentForm onSubmit={mockOnSubmit} onBack={mockOnBack} isProcessing={false} />);
    
    expect(screen.getByLabelText('Cardholder Name *')).toBeInTheDocument();
    expect(screen.getByLabelText('Card Number *')).toBeInTheDocument();
    expect(screen.getByLabelText('Expiry Date *')).toBeInTheDocument();
    expect(screen.getByLabelText('CVV *')).toBeInTheDocument();
  });

  it('hides card form for PayPal selection', () => {
    render(<PaymentForm onSubmit={mockOnSubmit} onBack={mockOnBack} isProcessing={false} />);
    
    const paypalRadio = screen.getByLabelText('PayPal');
    fireEvent.click(paypalRadio);

    expect(screen.queryByLabelText('Cardholder Name *')).not.toBeInTheDocument();
    expect(screen.getByText('You will be redirected to PayPal to complete your payment securely.')).toBeInTheDocument();
  });

  it('validates card form fields', async () => {
    render(<PaymentForm onSubmit={mockOnSubmit} onBack={mockOnBack} isProcessing={false} />);
    
    const submitButton = screen.getByText('Place Order');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Cardholder name is required')).toBeInTheDocument();
      expect(screen.getByText('Card number is required')).toBeInTheDocument();
      expect(screen.getByText('Expiry date is required')).toBeInTheDocument();
      expect(screen.getByText('CVV is required')).toBeInTheDocument();
    });

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('formats card number with spaces', () => {
    render(<PaymentForm onSubmit={mockOnSubmit} onBack={mockOnBack} isProcessing={false} />);
    
    const cardNumberInput = screen.getByLabelText('Card Number *');
    fireEvent.change(cardNumberInput, { target: { value: '1234567890123456' } });

    expect(cardNumberInput).toHaveValue('1234 5678 9012 3456');
  });

  it('formats expiry date with slash', () => {
    render(<PaymentForm onSubmit={mockOnSubmit} onBack={mockOnBack} isProcessing={false} />);
    
    const expiryInput = screen.getByLabelText('Expiry Date *');
    fireEvent.change(expiryInput, { target: { value: '1225' } });

    expect(expiryInput).toHaveValue('12/25');
  });

  it('validates expiry date format', async () => {
    render(<PaymentForm onSubmit={mockOnSubmit} onBack={mockOnBack} isProcessing={false} />);
    
    // Fill required fields
    fireEvent.change(screen.getByLabelText('Cardholder Name *'), { target: { value: 'John Doe' } });
    fireEvent.change(screen.getByLabelText('Card Number *'), { target: { value: '1234567890123456' } });
    fireEvent.change(screen.getByLabelText('Expiry Date *'), { target: { value: '13/25' } }); // Invalid month
    fireEvent.change(screen.getByLabelText('CVV *'), { target: { value: '123' } });

    const submitButton = screen.getByText('Place Order');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Please enter a valid month (01-12)')).toBeInTheDocument();
    });
  });

  it('validates expired card', async () => {
    render(<PaymentForm onSubmit={mockOnSubmit} onBack={mockOnBack} isProcessing={false} />);
    
    // Fill required fields with expired date
    fireEvent.change(screen.getByLabelText('Cardholder Name *'), { target: { value: 'John Doe' } });
    fireEvent.change(screen.getByLabelText('Card Number *'), { target: { value: '1234567890123456' } });
    fireEvent.change(screen.getByLabelText('Expiry Date *'), { target: { value: '01/20' } }); // Expired
    fireEvent.change(screen.getByLabelText('CVV *'), { target: { value: '123' } });

    const submitButton = screen.getByText('Place Order');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Card has expired')).toBeInTheDocument();
    });
  });

  it('submits form with valid card data', async () => {
    render(<PaymentForm onSubmit={mockOnSubmit} onBack={mockOnBack} isProcessing={false} />);
    
    // Fill valid card data
    fireEvent.change(screen.getByLabelText('Cardholder Name *'), { target: { value: 'John Doe' } });
    fireEvent.change(screen.getByLabelText('Card Number *'), { target: { value: '4111111111111111' } });
    fireEvent.change(screen.getByLabelText('Expiry Date *'), { target: { value: '12/25' } });
    fireEvent.change(screen.getByLabelText('CVV *'), { target: { value: '123' } });

    const submitButton = screen.getByText('Place Order');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        method: 'credit_card',
        cardLast4: '1111',
        cardBrand: 'Visa',
      });
    });
  });

  it('calls onBack when back button is clicked', () => {
    render(<PaymentForm onSubmit={mockOnSubmit} onBack={mockOnBack} isProcessing={false} />);
    
    const backButton = screen.getByText('Back to Shipping');
    fireEvent.click(backButton);

    expect(mockOnBack).toHaveBeenCalled();
  });

  it('disables buttons when processing', () => {
    render(<PaymentForm onSubmit={mockOnSubmit} onBack={mockOnBack} isProcessing={true} />);
    
    const submitButton = screen.getByText('Processing...');
    const backButton = screen.getByText('Back to Shipping');

    expect(submitButton).toBeDisabled();
    expect(backButton).toBeDisabled();
  });

  it('submits PayPal payment without card validation', async () => {
    render(<PaymentForm onSubmit={mockOnSubmit} onBack={mockOnBack} isProcessing={false} />);
    
    // Select PayPal
    const paypalRadio = screen.getByLabelText('PayPal');
    fireEvent.click(paypalRadio);

    const submitButton = screen.getByText('Place Order');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        method: 'paypal',
      });
    });
  });
});