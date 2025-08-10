import React from 'react';

interface QuantitySelectorProps {
  quantity: number;
  maxQuantity: number;
  onQuantityChange: (quantity: number) => void;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const QuantitySelector: React.FC<QuantitySelectorProps> = ({
  quantity,
  maxQuantity,
  onQuantityChange,
  disabled = false,
  size = 'md',
}) => {
  const handleDecrease = () => {
    if (quantity > 1 && !disabled) {
      onQuantityChange(quantity - 1);
    }
  };

  const handleIncrease = () => {
    if (quantity < maxQuantity && !disabled) {
      onQuantityChange(quantity + 1);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value) && value >= 1 && value <= maxQuantity && !disabled) {
      onQuantityChange(value);
    }
  };

  const sizeClasses = {
    sm: {
      button: 'w-6 h-6 text-xs',
      input: 'w-12 h-6 text-xs',
    },
    md: {
      button: 'w-8 h-8 text-sm',
      input: 'w-16 h-8 text-sm',
    },
    lg: {
      button: 'w-10 h-10 text-base',
      input: 'w-20 h-10 text-base',
    },
  };

  const classes = sizeClasses[size];

  return (
    <div className="flex items-center">
      <button
        type="button"
        onClick={handleDecrease}
        disabled={disabled || quantity <= 1}
        aria-label="Decrease quantity"
        className={`${classes.button} flex items-center justify-center border border-gray-300 rounded-l-md bg-white text-gray-600 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        <svg
          className="w-3 h-3"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M20 12H4"
          />
        </svg>
      </button>

      <input
        type="number"
        min="1"
        max={maxQuantity}
        value={quantity}
        onChange={handleInputChange}
        disabled={disabled}
        data-testid="quantity-input"
        className={`${classes.input} text-center border-t border-b border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed`}
      />

      <button
        type="button"
        onClick={handleIncrease}
        disabled={disabled || quantity >= maxQuantity}
        aria-label="Increase quantity"
        className={`${classes.button} flex items-center justify-center border border-gray-300 rounded-r-md bg-white text-gray-600 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        <svg
          className="w-3 h-3"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 6v6m0 0v6m0-6h6m-6 0H6"
          />
        </svg>
      </button>
    </div>
  );
};

export default QuantitySelector;