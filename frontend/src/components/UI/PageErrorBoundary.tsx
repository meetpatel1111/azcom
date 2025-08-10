import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Link } from 'react-router-dom';
import ErrorMessage from './ErrorMessage';

interface Props {
  children: ReactNode;
  pageName?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class PageErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`Error in ${this.props.pageName || 'page'}:`, error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-96 flex items-center justify-center py-12 px-4">
          <div className="max-w-md w-full text-center space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                Unable to load {this.props.pageName || 'this page'}
              </h3>
              <p className="mt-2 text-sm text-gray-600">
                Something went wrong while loading the content. Please try again.
              </p>
            </div>
            
            <ErrorMessage 
              message={this.state.error?.message || 'Page failed to load'} 
            />
            
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => window.location.reload()}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition duration-150 ease-in-out"
              >
                Reload Page
              </button>
              <Link
                to="/"
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-md transition duration-150 ease-in-out text-center"
              >
                Go Home
              </Link>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default PageErrorBoundary;