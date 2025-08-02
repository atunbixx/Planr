'use client';

import React, { useState } from 'react';
import { cn } from '@/utils/cn';

interface MobileInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: string;
  clearable?: boolean;
  haptic?: boolean;
}

export const MobileInput = React.forwardRef<HTMLInputElement, MobileInputProps>(
  ({ 
    className, 
    label,
    error,
    icon,
    clearable = true,
    haptic = true,
    type = 'text',
    value,
    onChange,
    onFocus,
    onBlur,
    ...props 
  }, ref) => {
    const [isFocused, setIsFocused] = useState(false);
    const [inputValue, setInputValue] = useState(value || '');

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true);
      if (haptic && 'vibrate' in navigator) {
        navigator.vibrate(5);
      }
      onFocus?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false);
      onBlur?.(e);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setInputValue(e.target.value);
      onChange?.(e);
    };

    const handleClear = () => {
      if (haptic && 'vibrate' in navigator) {
        navigator.vibrate(10);
      }
      setInputValue('');
      // Create synthetic event
      const event = {
        target: { value: '' },
        currentTarget: { value: '' }
      } as React.ChangeEvent<HTMLInputElement>;
      onChange?.(event);
    };

    const showClearButton = clearable && inputValue && isFocused;

    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            {label}
          </label>
        )}
        
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              <i className={cn(icon, "text-lg")} />
            </div>
          )}
          
          <input
            ref={ref}
            type={type}
            value={inputValue}
            onChange={handleChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            className={cn(
              // Base styles
              "w-full min-h-[48px] px-4 rounded-lg border-2 transition-all duration-200",
              "text-base font-medium text-gray-900",
              "placeholder:text-gray-400",
              "focus:outline-none",
              
              // Touch optimization
              "touch-manipulation select-none",
              
              // Border colors
              error 
                ? "border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20" 
                : isFocused
                  ? "border-accent focus:ring-2 focus:ring-accent/20"
                  : "border-gray-300",
              
              // Padding adjustments
              icon && "pl-11",
              showClearButton && "pr-11",
              
              // Disabled state
              "disabled:bg-gray-50 disabled:text-gray-500 disabled:border-gray-200",
              
              className
            )}
            {...props}
          />
          
          {showClearButton && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1.5 text-gray-400 hover:text-gray-600 transition-colors"
              tabIndex={-1}
            >
              <i className="fas fa-times-circle text-lg" />
            </button>
          )}
        </div>
        
        {error && (
          <p className="mt-1.5 text-sm text-red-500 flex items-center">
            <i className="fas fa-exclamation-circle mr-1.5" />
            {error}
          </p>
        )}
      </div>
    );
  }
);

MobileInput.displayName = 'MobileInput';

// Mobile Textarea Component
interface MobileTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  haptic?: boolean;
}

export const MobileTextarea = React.forwardRef<HTMLTextAreaElement, MobileTextareaProps>(
  ({ 
    className, 
    label,
    error,
    haptic = true,
    onFocus,
    ...props 
  }, ref) => {
    const [isFocused, setIsFocused] = useState(false);

    const handleFocus = (e: React.FocusEvent<HTMLTextAreaElement>) => {
      setIsFocused(true);
      if (haptic && 'vibrate' in navigator) {
        navigator.vibrate(5);
      }
      onFocus?.(e);
    };

    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            {label}
          </label>
        )}
        
        <textarea
          ref={ref}
          onFocus={handleFocus}
          onBlur={() => setIsFocused(false)}
          className={cn(
            // Base styles
            "w-full min-h-[100px] px-4 py-3 rounded-lg border-2 transition-all duration-200",
            "text-base font-medium text-gray-900",
            "placeholder:text-gray-400",
            "focus:outline-none resize-none",
            
            // Touch optimization
            "touch-manipulation",
            
            // Border colors
            error 
              ? "border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20" 
              : isFocused
                ? "border-accent focus:ring-2 focus:ring-accent/20"
                : "border-gray-300",
            
            // Disabled state
            "disabled:bg-gray-50 disabled:text-gray-500 disabled:border-gray-200",
            
            className
          )}
          {...props}
        />
        
        {error && (
          <p className="mt-1.5 text-sm text-red-500 flex items-center">
            <i className="fas fa-exclamation-circle mr-1.5" />
            {error}
          </p>
        )}
      </div>
    );
  }
);

MobileTextarea.displayName = 'MobileTextarea';