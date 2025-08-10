import React from 'react';
import { render, screen } from '@testing-library/react';
import LoadingState from '../LoadingState';

describe('LoadingState', () => {
  const mockChildren = <div>Content loaded</div>;

  it('renders children when not loading and no error', () => {
    render(
      <LoadingState isLoading={false}>
        {mockChildren}
      </LoadingState>
    );

    expect(screen.getByText('Content loaded')).toBeInTheDocument();
  });

  it('renders loading spinner when isLoading is true', () => {
    render(
      <LoadingState isLoading={true}>
        {mockChildren}
      </LoadingState>
    );

    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(screen.queryByText('Content loaded')).not.toBeInTheDocument();
  });

  it('renders custom loading text', () => {
    render(
      <LoadingState isLoading={true} loadingText="Please wait...">
        {mockChildren}
      </LoadingState>
    );

    expect(screen.getByText('Please wait...')).toBeInTheDocument();
  });

  it('renders loading without text when loadingText is empty', () => {
    render(
      <LoadingState isLoading={true} loadingText="">
        {mockChildren}
      </LoadingState>
    );

    expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    // Should still render the spinner (svg element)
    expect(document.querySelector('svg')).toBeInTheDocument();
  });

  it('renders error message when error is provided', () => {
    render(
      <LoadingState isLoading={false} error="Something went wrong">
        {mockChildren}
      </LoadingState>
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.queryByText('Content loaded')).not.toBeInTheDocument();
  });

  it('renders custom error component when provided', () => {
    const customError = <div>Custom error component</div>;

    render(
      <LoadingState 
        isLoading={false} 
        error="Something went wrong" 
        errorComponent={customError}
      >
        {mockChildren}
      </LoadingState>
    );

    expect(screen.getByText('Custom error component')).toBeInTheDocument();
    expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
  });

  it('prioritizes loading state over error state', () => {
    render(
      <LoadingState isLoading={true} error="Something went wrong">
        {mockChildren}
      </LoadingState>
    );

    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
    expect(screen.queryByText('Content loaded')).not.toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <LoadingState isLoading={true} className="custom-class">
        {mockChildren}
      </LoadingState>
    );

    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('renders with different spinner sizes', () => {
    const { rerender } = render(
      <LoadingState isLoading={true} spinnerSize="large">
        {mockChildren}
      </LoadingState>
    );

    expect(document.querySelector('svg')).toHaveClass('h-12', 'w-12');

    rerender(
      <LoadingState isLoading={true} spinnerSize="small">
        {mockChildren}
      </LoadingState>
    );

    expect(document.querySelector('svg')).toHaveClass('h-4', 'w-4');
  });
});