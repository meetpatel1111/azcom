import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import QuantitySelector from '../QuantitySelector';

describe('QuantitySelector Component', () => {
  const defaultProps = {
    quantity: 2,
    maxQuantity: 10,
    onQuantityChange: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders with correct initial quantity', () => {
    render(<QuantitySelector {...defaultProps} />);

    const input = screen.getByDisplayValue('2');
    expect(input).toBeInTheDocument();
  });

  it('calls onQuantityChange when decrease button is clicked', () => {
    const mockOnQuantityChange = vi.fn();
    render(<QuantitySelector {...defaultProps} onQuantityChange={mockOnQuantityChange} />);

    const decreaseButton = screen.getByLabelText('Decrease quantity');
    fireEvent.click(decreaseButton);

    expect(mockOnQuantityChange).toHaveBeenCalledWith(1);
  });

  it('calls onQuantityChange when increase button is clicked', () => {
    const mockOnQuantityChange = vi.fn();
    render(<QuantitySelector {...defaultProps} onQuantityChange={mockOnQuantityChange} />);

    const increaseButton = screen.getByLabelText('Increase quantity');
    fireEvent.click(increaseButton);

    expect(mockOnQuantityChange).toHaveBeenCalledWith(3);
  });

  it('disables decrease button when quantity is 1', () => {
    render(<QuantitySelector {...defaultProps} quantity={1} />);

    const decreaseButton = screen.getByLabelText('Decrease quantity');
    expect(decreaseButton).toBeDisabled();
  });

  it('disables increase button when quantity equals maxQuantity', () => {
    render(<QuantitySelector {...defaultProps} quantity={10} maxQuantity={10} />);

    const increaseButton = screen.getByLabelText('Increase quantity');
    expect(increaseButton).toBeDisabled();
  });

  it('does not call onQuantityChange when decrease is clicked at minimum quantity', () => {
    const mockOnQuantityChange = vi.fn();
    render(<QuantitySelector {...defaultProps} quantity={1} onQuantityChange={mockOnQuantityChange} />);

    const decreaseButton = screen.getByLabelText('Decrease quantity');
    fireEvent.click(decreaseButton);

    expect(mockOnQuantityChange).not.toHaveBeenCalled();
  });

  it('does not call onQuantityChange when increase is clicked at maximum quantity', () => {
    const mockOnQuantityChange = vi.fn();
    render(<QuantitySelector {...defaultProps} quantity={10} maxQuantity={10} onQuantityChange={mockOnQuantityChange} />);

    const increaseButton = screen.getByLabelText('Increase quantity');
    fireEvent.click(increaseButton);

    expect(mockOnQuantityChange).not.toHaveBeenCalled();
  });

  it('calls onQuantityChange when input value changes to valid number', () => {
    const mockOnQuantityChange = vi.fn();
    render(<QuantitySelector {...defaultProps} onQuantityChange={mockOnQuantityChange} />);

    const input = screen.getByDisplayValue('2');
    fireEvent.change(input, { target: { value: '5' } });

    expect(mockOnQuantityChange).toHaveBeenCalledWith(5);
  });

  it('does not call onQuantityChange when input value is invalid', () => {
    const mockOnQuantityChange = vi.fn();
    render(<QuantitySelector {...defaultProps} onQuantityChange={mockOnQuantityChange} />);

    const input = screen.getByDisplayValue('2');
    
    // Test invalid values
    fireEvent.change(input, { target: { value: 'abc' } });
    expect(mockOnQuantityChange).not.toHaveBeenCalled();

    fireEvent.change(input, { target: { value: '0' } });
    expect(mockOnQuantityChange).not.toHaveBeenCalled();

    fireEvent.change(input, { target: { value: '15' } }); // Above maxQuantity
    expect(mockOnQuantityChange).not.toHaveBeenCalled();
  });

  it('disables all controls when disabled prop is true', () => {
    render(<QuantitySelector {...defaultProps} disabled={true} />);

    const decreaseButton = screen.getByLabelText('Decrease quantity');
    const increaseButton = screen.getByLabelText('Increase quantity');
    const input = screen.getByDisplayValue('2');

    expect(decreaseButton).toBeDisabled();
    expect(increaseButton).toBeDisabled();
    expect(input).toBeDisabled();
  });

  it('does not call onQuantityChange when disabled', () => {
    const mockOnQuantityChange = vi.fn();
    render(<QuantitySelector {...defaultProps} disabled={true} onQuantityChange={mockOnQuantityChange} />);

    const decreaseButton = screen.getByLabelText('Decrease quantity');
    const increaseButton = screen.getByLabelText('Increase quantity');
    const input = screen.getByDisplayValue('2');

    fireEvent.click(decreaseButton);
    fireEvent.click(increaseButton);
    fireEvent.change(input, { target: { value: '5' } });

    expect(mockOnQuantityChange).not.toHaveBeenCalled();
  });

  it('applies correct size classes for small size', () => {
    render(<QuantitySelector {...defaultProps} size="sm" />);

    const decreaseButton = screen.getByLabelText('Decrease quantity');
    const increaseButton = screen.getByLabelText('Increase quantity');
    const input = screen.getByDisplayValue('2');

    expect(decreaseButton).toHaveClass('w-6', 'h-6', 'text-xs');
    expect(increaseButton).toHaveClass('w-6', 'h-6', 'text-xs');
    expect(input).toHaveClass('w-12', 'h-6', 'text-xs');
  });

  it('applies correct size classes for medium size (default)', () => {
    render(<QuantitySelector {...defaultProps} />);

    const decreaseButton = screen.getByLabelText('Decrease quantity');
    const increaseButton = screen.getByLabelText('Increase quantity');
    const input = screen.getByDisplayValue('2');

    expect(decreaseButton).toHaveClass('w-8', 'h-8', 'text-sm');
    expect(increaseButton).toHaveClass('w-8', 'h-8', 'text-sm');
    expect(input).toHaveClass('w-16', 'h-8', 'text-sm');
  });

  it('applies correct size classes for large size', () => {
    render(<QuantitySelector {...defaultProps} size="lg" />);

    const decreaseButton = screen.getByLabelText('Decrease quantity');
    const increaseButton = screen.getByLabelText('Increase quantity');
    const input = screen.getByDisplayValue('2');

    expect(decreaseButton).toHaveClass('w-10', 'h-10', 'text-base');
    expect(increaseButton).toHaveClass('w-10', 'h-10', 'text-base');
    expect(input).toHaveClass('w-20', 'h-10', 'text-base');
  });

  it('sets correct input attributes', () => {
    render(<QuantitySelector {...defaultProps} />);

    const input = screen.getByDisplayValue('2') as HTMLInputElement;
    expect(input.type).toBe('number');
    expect(input.min).toBe('1');
    expect(input.max).toBe('10');
  });

  it('handles edge case where maxQuantity is 1', () => {
    const mockOnQuantityChange = vi.fn();
    render(<QuantitySelector quantity={1} maxQuantity={1} onQuantityChange={mockOnQuantityChange} />);

    const decreaseButton = screen.getByLabelText('Decrease quantity');
    const increaseButton = screen.getByLabelText('Increase quantity');

    expect(decreaseButton).toBeDisabled();
    expect(increaseButton).toBeDisabled();
  });
});