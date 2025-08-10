import React from 'react';

interface FormInputProps {
  id?: string;
  name?: string;
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url';
  label: string;
  value: string | number;
  onChange: ((e: React.ChangeEvent<HTMLInputElement>) => void) | ((value: string) => void);
  error?: string;
  placeholder?: string;
  required?: boolean;
  autoComplete?: string;
  disabled?: boolean;
  className?: string;
  helpText?: string;
  min?: string;
  max?: string;
  step?: string;
  'data-testid'?: string;
}

const FormInput: React.FC<FormInputProps> = ({
  id,
  name,
  type = 'text',
  label,
  value,
  onChange,
  error,
  placeholder,
  required = false,
  autoComplete,
  disabled = false,
  className = '',
  helpText,
  min,
  max,
  step,
  'data-testid': dataTestId,
}) => {
  const inputId = id || name || label.toLowerCase().replace(/\s+/g, '-');
  const inputName = name || inputId;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (typeof onChange === 'function') {
      // Check if onChange expects just the value or the full event
      if (onChange.length === 1) {
        (onChange as (value: string) => void)(e.target.value);
      } else {
        (onChange as (e: React.ChangeEvent<HTMLInputElement>) => void)(e);
      }
    }
  };

  return (
    <div className={className}>
      <label htmlFor={inputId} className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <input
        id={inputId}
        name={inputName}
        type={type}
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        required={required}
        autoComplete={autoComplete}
        disabled={disabled}
        min={min}
        max={max}
        step={step}
        data-testid={dataTestId}
        className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500 ${
          error ? 'border-red-300' : 'border-gray-300'
        }`}
      />
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
      {helpText && !error && (
        <p className="mt-1 text-sm text-gray-500">{helpText}</p>
      )}
    </div>
  );
};

export default FormInput;