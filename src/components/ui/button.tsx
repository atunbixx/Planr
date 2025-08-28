import React from 'react'
import { Slot } from '@radix-ui/react-slot'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg' | 'icon'
  isLoading?: boolean
}

export function Button({ 
  children, 
  asChild = false,
  variant = 'primary', 
  size = 'md', 
  isLoading = false,
  className = '',
  disabled,
  ...props 
}: ButtonProps) {
  const Comp = asChild ? Slot : 'button'
  const baseClasses = 'inline-flex items-center justify-center font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-0.5 active:translate-y-0'
  
  const variantClasses = {
    primary: 'bg-[hsl(var(--primary))] text-white hover:brightness-95 focus:ring-[hsl(var(--primary))] shadow-md hover:shadow-lg',
    secondary: 'bg-[hsl(var(--secondary))] text-white hover:brightness-95 focus:ring-[hsl(var(--secondary))] shadow-md hover:shadow-lg',
    outline: [
      'border-2 border-slate-200 bg-white text-slate-600 hover:border-[hsl(var(--primary))] hover:bg-slate-50 hover:text-[hsl(var(--primary))] focus:ring-[hsl(var(--primary))]',
      'dark:border-dark-3 dark:bg-transparent dark:text-neutral-100 dark:hover:bg-dark-2 dark:hover:text-white'
    ].join(' '),
    ghost: 'text-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))/0.1] focus:ring-[hsl(var(--primary))] dark:text-neutral-100 dark:hover:bg-white/5'
  }
  
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm rounded-lg',
    md: 'px-4 py-2 text-sm rounded-xl',
    lg: 'px-6 py-3 text-base rounded-xl',
    icon: 'h-9 w-9 rounded-full',
  }

  return (
    <Comp
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && (
        <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}
      {children}
    </Comp>
  )
}
