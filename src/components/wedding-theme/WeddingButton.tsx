import * as React from 'react'
import { cn } from '@/lib/utils'

interface WeddingButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'link'
  size?: 'sm' | 'md' | 'lg'
  fullWidth?: boolean
}

export const WeddingButton = React.forwardRef<HTMLButtonElement, WeddingButtonProps>(
  ({ 
    className, 
    variant = 'primary',
    size = 'md',
    fullWidth = false,
    children,
    ...props 
  }, ref) => {
    const variantClasses = {
      primary: 'bg-wedding-sage hover:bg-wedding-sage-hover text-white',
      secondary: 'border border-wedding-brown text-wedding-brown hover:bg-wedding-brown hover:text-white',
      ghost: 'text-wedding-sage hover:bg-gray-50',
      link: 'text-wedding-sage font-light hover:underline p-0'
    }
    
    const sizeClasses = {
      sm: 'px-3 py-1.5 text-xs',
      md: 'px-4 sm:px-6 lg:px-8 py-2 sm:py-3 text-xs sm:text-sm',
      lg: 'px-6 sm:px-8 lg:px-10 py-3 sm:py-4 text-sm sm:text-base'
    }
    
    return (
      <button
        className={cn(
          'font-light tracking-wider uppercase transition-colors',
          variant !== 'link' && 'rounded-sm',
          variantClasses[variant],
          variant !== 'link' && sizeClasses[size],
          fullWidth && 'w-full',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          className
        )}
        ref={ref}
        {...props}
      >
        {children}
      </button>
    )
  }
)

WeddingButton.displayName = 'WeddingButton'

// Icon button variant
interface WeddingIconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
}

export const WeddingIconButton = React.forwardRef<HTMLButtonElement, WeddingIconButtonProps>(
  ({ 
    className, 
    variant = 'ghost',
    size = 'md',
    children,
    ...props 
  }, ref) => {
    const variantClasses = {
      primary: 'bg-wedding-sage hover:bg-wedding-sage-hover text-white',
      secondary: 'border border-wedding-brown text-wedding-brown hover:bg-wedding-brown hover:text-white',
      ghost: 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
    }
    
    const sizeClasses = {
      sm: 'p-1',
      md: 'p-2',
      lg: 'p-3'
    }
    
    return (
      <button
        className={cn(
          'rounded-sm transition-colors',
          variantClasses[variant],
          sizeClasses[size],
          'disabled:opacity-50 disabled:cursor-not-allowed',
          className
        )}
        ref={ref}
        {...props}
      >
        {children}
      </button>
    )
  }
)

WeddingIconButton.displayName = 'WeddingIconButton'