import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import SearchBar from '../SearchBar';

// Mock timers for debounce testing
vi.useFakeTimers();

describe('SearchBar', () => {
  afterEach(() => {
    vi.clearAllTimers();
  });

  it('renders with default placeholder', () => {
    const mockOnSearch = vi.fn();
    render(<SearchBar onSearch={mockOnSearch} />);

    expect(screen.getByPlaceholderText('Search products...')).toBeInTheDocument();
  });

  it('renders with custom placeholder', () => {
    const mockOnSearch = vi.fn();
    render(<SearchBar onSearch={mockOnSearch} placeholder="Find items..." />);

    expect(screen.getByPlaceholderText('Find items...')).toBeInTheDocument();
  });

  it('renders with initial value', () => {
    const mockOnSearch = vi.fn();
    render(<SearchBar onSearch={mockOnSearch} initialValue="test query" />);

    expect(screen.getByDisplayValue('test query')).toBeInTheDocument();
  });

  it('calls onSearch with debounced input', async () => {
    const mockOnSearch = vi.fn();
    render(<SearchBar onSearch={mockOnSearch} debounceMs={300} />);

    const input = screen.getByPlaceholderText('Search products...');
    
    // Type in the input
    fireEvent.change(input, { target: { value: 'test search' } });

    // Should not call immediately
    expect(mockOnSearch).not.toHaveBeenCalled();

    // Fast-forward time to trigger debounce
    vi.advanceTimersByTime(300);

    await waitFor(() => {
      expect(mockOnSearch).toHaveBeenCalledWith('test search');
    });
  });

  it('debounces multiple rapid changes', async () => {
    const mockOnSearch = vi.fn();
    render(<SearchBar onSearch={mockOnSearch} debounceMs={300} />);

    const input = screen.getByPlaceholderText('Search products...');
    
    // Type multiple characters rapidly
    fireEvent.change(input, { target: { value: 't' } });
    fireEvent.change(input, { target: { value: 'te' } });
    fireEvent.change(input, { target: { value: 'test' } });

    // Should not call yet
    expect(mockOnSearch).not.toHaveBeenCalled();

    // Fast-forward time
    vi.advanceTimersByTime(300);

    await waitFor(() => {
      expect(mockOnSearch).toHaveBeenCalledTimes(1);
      expect(mockOnSearch).toHaveBeenCalledWith('test');
    });
  });

  it('shows clear button when there is text', () => {
    const mockOnSearch = vi.fn();
    render(<SearchBar onSearch={mockOnSearch} />);

    const input = screen.getByPlaceholderText('Search products...');
    
    // Initially no clear button
    expect(screen.queryByLabelText('Clear search')).not.toBeInTheDocument();

    // Type something
    fireEvent.change(input, { target: { value: 'test' } });

    // Clear button should appear
    expect(screen.getByLabelText('Clear search')).toBeInTheDocument();
  });

  it('clears input when clear button is clicked', async () => {
    const mockOnSearch = vi.fn();
    render(<SearchBar onSearch={mockOnSearch} debounceMs={300} />);

    const input = screen.getByPlaceholderText('Search products...');
    
    // Type something
    fireEvent.change(input, { target: { value: 'test' } });
    expect(input).toHaveValue('test');

    // Click clear button
    const clearButton = screen.getByLabelText('Clear search');
    fireEvent.click(clearButton);

    // Input should be cleared
    expect(input).toHaveValue('');

    // Should trigger search with empty string after debounce
    vi.advanceTimersByTime(300);
    await waitFor(() => {
      expect(mockOnSearch).toHaveBeenCalledWith('');
    });
  });

  it('calls onSearch with initial value on mount', async () => {
    const mockOnSearch = vi.fn();
    render(<SearchBar onSearch={mockOnSearch} initialValue="initial" debounceMs={300} />);

    // Should call with initial value after debounce
    vi.advanceTimersByTime(300);
    await waitFor(() => {
      expect(mockOnSearch).toHaveBeenCalledWith('initial');
    });
  });
});