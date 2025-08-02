'use client';

import React, { useEffect, useState } from 'react';
import { cn } from '@/utils/cn';

interface MobileButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'accent' | 'ghost' | 'link';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  fullWidth?: boolean;
  loading?: boolean;
  ripple?: boolean;
  haptic?: boolean;
  children: React.ReactNode;
}

interface RippleProps {
  x: number;
  y: number;
  id: number;
}

export const MobileButton = React.forwardRef<HTMLButtonElement, MobileButtonProps>(
  ({ 
    className, 
    variant = 'primary', 
    size = 'md', 
    fullWidth = false,
    loading = false,
    ripple = true,
    haptic = true,
    disabled,
    onClick,
    children, 
    ...props 
  }, ref) => {
    const [ripples, setRipples] = useState<RippleProps[]>([]);

    // Clean up ripples after animation
    useEffect(() => {
      const timers = ripples.map((ripple) =>
        setTimeout(() => {
          setRipples((prev) => prev.filter((r) => r.id !== ripple.id));
        }, 600)
      );

      return () => {
        timers.forEach(clearTimeout);
      };
    }, [ripples]);

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (ripple && !disabled) {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const id = Date.now();
        
        setRipples((prev) => [...prev, { x, y, id }]);
      }

      if (haptic && !disabled && 'vibrate' in navigator) {
        navigator.vibrate(10);
      }

      onClick?.(e);
    };
    
    const buttonStyles = cn(
      // Base styles - Mobile optimized
      'relative inline-flex items-center justify-center font-sans font-medium',
      'transition-all duration-normal focus:outline-none focus:ring-2 focus:ring-offset-2',
      'disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden',
      'select-none touch-manipulation', // Prevent text selection and optimize touch
      
      // Variants
      {
        // Primary - Strong black button
        'bg-ink text-paper hover:bg-gray-800 focus:ring-gray-500 active:bg-gray-900': 
          variant === 'primary',
        
        // Secondary - Outlined button
        'bg-paper text-ink border border-gray-300 hover:bg-gray-50 focus:ring-gray-500 active:bg-gray-100': 
          variant === 'secondary',
        
        // Accent - Red accent button
        'bg-accent text-paper hover:bg-red-600 focus:ring-red-500 active:bg-red-700': 
          variant === 'accent',
        
        // Ghost - Minimal button
        'bg-transparent text-ink hover:bg-gray-100 focus:ring-gray-500 active:bg-gray-200': 
          variant === 'ghost',
        
        // Link - Text-only button
        'bg-transparent text-ink hover:text-gray-600 focus:ring-0 focus:underline p-0 h-auto': 
          variant === 'link',
      },
      
      // Mobile-optimized sizes (min 44x44px for touch targets)
      {
        'min-h-[44px] px-4 text-sm rounded-md': size === 'sm',
        'min-h-[48px] px-5 text-base rounded-md': size === 'md',
        'min-h-[52px] px-6 text-lg rounded-lg': size === 'lg',
        'min-h-[56px] px-8 text-xl rounded-lg': size === 'xl',
      },
      
      // Full width
      {
        'w-full': fullWidth,
      },
      
      // Link variant doesn't get standard padding/height
      {
        '!h-auto !p-0 !min-h-0': variant === 'link',
      },
      
      className
    );

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={buttonStyles}
        onClick={handleClick}
        {...props}
      >
        {/* Ripple Effects */}
        {ripple && ripples.map((ripple) => (
          <span
            key={ripple.id}
            className="absolute bg-white/30 rounded-full pointer-events-none animate-ripple"
            style={{
              left: ripple.x,
              top: ripple.y,
              width: 20,
              height: 20,
              transform: 'translate(-50%, -50%)',
            }}
          />
        ))}

        {/* Button Content */}
        {loading ? (
          <>
            <svg 
              className="animate-spin -ml-1 mr-2 h-4 w-4" 
              xmlns="http://www.w3.org/2000/svg" 
              fill="none" 
              viewBox="0 0 24 24"
            >
              <circle 
                className="opacity-25" 
                cx="12" 
                cy="12" 
                r="10" 
                stroke="currentColor" 
                strokeWidth="4"
              />
              <path 
                className="opacity-75" 
                fill="currentColor" 
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Loading...
          </>
        ) : (
          children
        )}
      </button>
    );
  }
);

MobileButton.displayName = 'MobileButton';

// Mobile Icon Button - Touch-optimized icon-only button
interface MobileIconButtonProps extends Omit<MobileButtonProps, 'children'> {
  icon: React.ReactNode;
  'aria-label': string;
}

export const MobileIconButton = React.forwardRef<HTMLButtonElement, MobileIconButtonProps>(
  ({ icon, size = 'md', ...props }, ref) => {
    return (
      <MobileButton
        ref={ref}
        size={size}
        className={cn(
          'aspect-square',
          {
            'min-w-[44px] min-h-[44px]': size === 'sm',
            'min-w-[48px] min-h-[48px]': size === 'md',
            'min-w-[52px] min-h-[52px]': size === 'lg',
            'min-w-[56px] min-h-[56px]': size === 'xl',
          }
        )}
        {...props}
      >
        {icon}
      </MobileButton>
    );
  }
);

MobileIconButton.displayName = 'MobileIconButton';