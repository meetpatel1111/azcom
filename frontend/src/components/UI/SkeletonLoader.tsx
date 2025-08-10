import React from 'react';

interface SkeletonLoaderProps {
  variant?: 'text' | 'rectangular' | 'circular' | 'card' | 'product';
  width?: string | number;
  height?: string | number;
  className?: string;
  count?: number;
}

const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  variant = 'text',
  width,
  height,
  className = '',
  count = 1,
}) => {
  const baseClasses = 'animate-pulse bg-gray-200 rounded';
  
  const getVariantClasses = () => {
    switch (variant) {
      case 'text':
        return 'h-4 w-full';
      case 'rectangular':
        return 'w-full h-32';
      case 'circular':
        return 'w-12 h-12 rounded-full';
      case 'card':
        return 'w-full h-64';
      case 'product':
        return 'w-full h-80';
      default:
        return 'h-4 w-full';
    }
  };

  const getInlineStyles = () => {
    const styles: React.CSSProperties = {};
    if (width) styles.width = typeof width === 'number' ? `${width}px` : width;
    if (height) styles.height = typeof height === 'number' ? `${height}px` : height;
    return styles;
  };

  const renderSkeleton = () => (
    <div
      className={`${baseClasses} ${getVariantClasses()} ${className}`}
      style={getInlineStyles()}
    />
  );

  if (count === 1) {
    return renderSkeleton();
  }

  return (
    <div className="space-y-3">
      {Array.from({ length: count }, (_, index) => (
        <div key={index}>
          {renderSkeleton()}
        </div>
      ))}
    </div>
  );
};

// Specific skeleton components for common use cases
export const ProductCardSkeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`border rounded-lg p-4 space-y-4 ${className}`}>
    <SkeletonLoader variant="rectangular" height={200} />
    <SkeletonLoader variant="text" width="75%" />
    <SkeletonLoader variant="text" width="50%" />
    <SkeletonLoader variant="text" width="25%" />
  </div>
);

export const ProductListSkeleton: React.FC<{ count?: number; className?: string }> = ({ 
  count = 6, 
  className = '' 
}) => (
  <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 ${className}`}>
    {Array.from({ length: count }, (_, index) => (
      <ProductCardSkeleton key={index} />
    ))}
  </div>
);

export const OrderItemSkeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`flex items-center space-x-4 p-4 border-b ${className}`}>
    <SkeletonLoader variant="rectangular" width={80} height={80} />
    <div className="flex-1 space-y-2">
      <SkeletonLoader variant="text" width="60%" />
      <SkeletonLoader variant="text" width="40%" />
      <SkeletonLoader variant="text" width="30%" />
    </div>
  </div>
);

export default SkeletonLoader;