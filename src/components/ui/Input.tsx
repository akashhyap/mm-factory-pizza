// Input component with label and error handling

import React from 'react';
import { cn } from '../../utils/format';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export function Input({
  label,
  error,
  helperText,
  className,
  id,
  ...props
}: InputProps) {
  const inputId = id || props.name;
  
  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-charcoal mb-1"
        >
          {label}
          {props.required && <span className="text-accent-red ml-1">*</span>}
        </label>
      )}
      <input
        id={inputId}
        className={cn(
          'w-full px-4 py-2 border rounded-lg text-charcoal placeholder-gray-400 transition-colors duration-200',
          'focus:outline-none focus:ring-2 focus:ring-royal-blue focus:border-royal-blue',
          error
            ? 'border-accent-red focus:ring-accent-red focus:border-accent-red'
            : 'border-gray-300',
          className
        )}
        {...props}
      />
      {error && (
        <p className="mt-1 text-sm text-accent-red">{error}</p>
      )}
      {helperText && !error && (
        <p className="mt-1 text-sm text-gray-500">{helperText}</p>
      )}
    </div>
  );
}

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export function Textarea({
  label,
  error,
  helperText,
  className,
  id,
  ...props
}: TextareaProps) {
  const inputId = id || props.name;
  
  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-charcoal mb-1"
        >
          {label}
          {props.required && <span className="text-accent-red ml-1">*</span>}
        </label>
      )}
      <textarea
        id={inputId}
        className={cn(
          'w-full px-4 py-2 border rounded-lg text-charcoal placeholder-gray-400 transition-colors duration-200 resize-none',
          'focus:outline-none focus:ring-2 focus:ring-royal-blue focus:border-royal-blue',
          error
            ? 'border-accent-red focus:ring-accent-red focus:border-accent-red'
            : 'border-gray-300',
          className
        )}
        {...props}
      />
      {error && (
        <p className="mt-1 text-sm text-accent-red">{error}</p>
      )}
      {helperText && !error && (
        <p className="mt-1 text-sm text-gray-500">{helperText}</p>
      )}
    </div>
  );
}

export default Input;
