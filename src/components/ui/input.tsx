import React from 'react'
import { cn } from '@/utils/cn'

// =============================================
// NEW YORK MAGAZINE INPUT COMPONENTS
// =============================================
// Editorial-style form inputs with sophisticated styling

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
  fullWidth?: boolean
  variant?: 'default' | 'filled' | 'outlined'
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ 
    className, 
    label, 
    error, 
    helperText, 
    fullWidth = false,
    variant = 'default',
    id,
    ...props 
  }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')
    
    return (
      <div className={cn('flex flex-col space-y-2', { 'w-full': fullWidth })}>
        {label && (
          <label 
            htmlFor={inputId}
            className="text-sm font-medium text-ink font-sans"
          >
            {label}
          </label>
        )}
        
        <input
          ref={ref}
          id={inputId}
          className={cn(
            // Base styles - Editorial aesthetic
            'font-sans text-base leading-normal transition-colors duration-normal',
            'placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-1',
            
            // Variants
            {
              // Default - Clean border style
              'bg-paper border border-gray-300 rounded-md px-3 py-2 focus:border-ink focus:ring-ink/20': 
                variant === 'default',
              
              // Filled - Subtle background
              'bg-gray-50 border-0 rounded-md px-3 py-2 focus:bg-paper focus:ring-ink/20': 
                variant === 'filled',
              
              // Outlined - Prominent border
              'bg-paper border-2 border-gray-300 rounded-md px-3 py-2 focus:border-ink focus:ring-ink/20': 
                variant === 'outlined',
            },
            
            // Error state
            {
              'border-red-500 focus:border-red-500 focus:ring-red-500/20': error,
            },
            
            // Full width
            {
              'w-full': fullWidth,
            },
            
            className
          )}
          {...props}
        />
        
        {(error || helperText) && (
          <div className="text-sm">
            {error ? (
              <span className="text-red-500 font-sans">{error}</span>
            ) : (
              <span className="text-gray-500 font-sans">{helperText}</span>
            )}
          </div>
        )}
      </div>
    )
  }
)
Input.displayName = 'Input'

// Textarea component with similar styling
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  helperText?: string
  fullWidth?: boolean
  variant?: 'default' | 'filled' | 'outlined'
  resize?: 'none' | 'vertical' | 'horizontal' | 'both'
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ 
    className, 
    label, 
    error, 
    helperText, 
    fullWidth = false,
    variant = 'default',
    resize = 'vertical',
    id,
    rows = 4,
    ...props 
  }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')
    
    return (
      <div className={cn('flex flex-col space-y-2', { 'w-full': fullWidth })}>
        {label && (
          <label 
            htmlFor={inputId}
            className="text-sm font-medium text-ink font-sans"
          >
            {label}
          </label>
        )}
        
        <textarea
          ref={ref}
          id={inputId}
          rows={rows}
          className={cn(
            // Base styles
            'font-sans text-base leading-normal transition-colors duration-normal',
            'placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-1',
            
            // Resize behavior
            {
              'resize-none': resize === 'none',
              'resize-y': resize === 'vertical',
              'resize-x': resize === 'horizontal',
              'resize': resize === 'both',
            },
            
            // Variants
            {
              'bg-paper border border-gray-300 rounded-md px-3 py-2 focus:border-ink focus:ring-ink/20': 
                variant === 'default',
              'bg-gray-50 border-0 rounded-md px-3 py-2 focus:bg-paper focus:ring-ink/20': 
                variant === 'filled',
              'bg-paper border-2 border-gray-300 rounded-md px-3 py-2 focus:border-ink focus:ring-ink/20': 
                variant === 'outlined',
            },
            
            // Error state
            {
              'border-red-500 focus:border-red-500 focus:ring-red-500/20': error,
            },
            
            // Full width
            {
              'w-full': fullWidth,
            },
            
            className
          )}
          {...props}
        />
        
        {(error || helperText) && (
          <div className="text-sm">
            {error ? (
              <span className="text-red-500 font-sans">{error}</span>
            ) : (
              <span className="text-gray-500 font-sans">{helperText}</span>
            )}
          </div>
        )}
      </div>
    )
  }
)
Textarea.displayName = 'Textarea'

// Select component
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  helperText?: string
  fullWidth?: boolean
  variant?: 'default' | 'filled' | 'outlined'
  children: React.ReactNode
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ 
    className, 
    label, 
    error, 
    helperText, 
    fullWidth = false,
    variant = 'default',
    id,
    children,
    ...props 
  }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')
    
    return (
      <div className={cn('flex flex-col space-y-2', { 'w-full': fullWidth })}>
        {label && (
          <label 
            htmlFor={inputId}
            className="text-sm font-medium text-ink font-sans"
          >
            {label}
          </label>
        )}
        
        <select
          ref={ref}
          id={inputId}
          className={cn(
            // Base styles
            'font-sans text-base leading-normal transition-colors duration-normal',
            'focus:outline-none focus:ring-2 focus:ring-offset-1 cursor-pointer',
            
            // Variants
            {
              'bg-paper border border-gray-300 rounded-md px-3 py-2 focus:border-ink focus:ring-ink/20': 
                variant === 'default',
              'bg-gray-50 border-0 rounded-md px-3 py-2 focus:bg-paper focus:ring-ink/20': 
                variant === 'filled',
              'bg-paper border-2 border-gray-300 rounded-md px-3 py-2 focus:border-ink focus:ring-ink/20': 
                variant === 'outlined',
            },
            
            // Error state
            {
              'border-red-500 focus:border-red-500 focus:ring-red-500/20': error,
            },
            
            // Full width
            {
              'w-full': fullWidth,
            },
            
            className
          )}
          {...props}
        >
          {children}
        </select>
        
        {(error || helperText) && (
          <div className="text-sm">
            {error ? (
              <span className="text-red-500 font-sans">{error}</span>
            ) : (
              <span className="text-gray-500 font-sans">{helperText}</span>
            )}
          </div>
        )}
      </div>
    )
  }
)
Select.displayName = 'Select'

export { Input, Textarea, Select }