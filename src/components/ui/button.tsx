import React from 'react'
import { cn } from '@/utils/cn'

// =============================================
// NEW YORK MAGAZINE BUTTON COMPONENTS
// =============================================
// Editorial-style buttons with sophisticated interactions

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'accent' | 'ghost' | 'link'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  fullWidth?: boolean
  loading?: boolean
  asChild?: boolean
  children: React.ReactNode
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    className, 
    variant = 'primary', 
    size = 'md', 
    fullWidth = false,
    loading = false,
    disabled,
    asChild = false,
    children, 
    ...props 
  }, ref) => {
    
    const buttonStyles = cn(
          // Base styles - Editorial aesthetic
          'inline-flex items-center justify-center font-sans font-medium',
          'transition-all duration-normal focus:outline-none focus:ring-2 focus:ring-offset-2',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          
          // Variants
          {
            // Primary - Strong black button (NY Mag style)
            'bg-ink text-paper hover:bg-gray-800 focus:ring-gray-500 active:bg-gray-900': 
              variant === 'primary',
            
            // Secondary - Outlined button
            'bg-paper text-ink border border-gray-300 hover:bg-gray-50 focus:ring-gray-500 active:bg-gray-100': 
              variant === 'secondary',
            
            // Accent - Red accent button (sparingly used)
            'bg-accent text-paper hover:bg-red-600 focus:ring-red-500 active:bg-red-700': 
              variant === 'accent',
            
            // Ghost - Minimal button
            'bg-transparent text-ink hover:bg-gray-100 focus:ring-gray-500 active:bg-gray-200': 
              variant === 'ghost',
            
            // Link - Text-only button
            'bg-transparent text-ink hover:text-gray-600 focus:ring-0 focus:underline p-0 h-auto': 
              variant === 'link',
          },
          
          // Sizes
          {
            'h-8 px-3 text-sm rounded-md': size === 'sm',
            'h-10 px-4 text-base rounded-md': size === 'md',
            'h-12 px-6 text-lg rounded-lg': size === 'lg',
            'h-14 px-8 text-xl rounded-lg': size === 'xl',
          },
          
          // Full width
          {
            'w-full': fullWidth,
          },
          
          // Link variant doesn't get standard padding/height
          {
            '!h-auto !p-0': variant === 'link',
          },
          
          className
        );

    // Handle asChild prop - if true, pass styles to child component
    if (asChild) {
      return React.cloneElement(children as React.ReactElement, {
        className: cn(buttonStyles, (children as React.ReactElement).props?.className),
        ref,
        ...props
      });
    }

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={buttonStyles}
        {...props}
      >
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
    )
  }
)
Button.displayName = 'Button'

// Icon button for actions with icons only
interface IconButtonProps extends Omit<ButtonProps, 'children'> {
  icon: React.ReactNode
  'aria-label': string
}

const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ icon, size = 'md', ...props }, ref) => {
    return (
      <Button
        ref={ref}
        size={size}
        className={cn(
          'aspect-square',
          {
            'w-8 h-8': size === 'sm',
            'w-10 h-10': size === 'md',
            'w-12 h-12': size === 'lg',
            'w-14 h-14': size === 'xl',
          }
        )}
        {...props}
      >
        {icon}
      </Button>
    )
  }
)
IconButton.displayName = 'IconButton'

export { Button, IconButton }