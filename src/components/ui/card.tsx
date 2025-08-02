import React from 'react'
import { cn } from '@/utils/cn'

// =============================================
// NEW YORK MAGAZINE CARD COMPONENTS
// =============================================
// Editorial-style cards with sophisticated styling

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  variant?: 'default' | 'elevated' | 'flat'
  size?: 'sm' | 'md' | 'lg'
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', size = 'md', children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          // Base styles - New York Magazine aesthetic
          'bg-paper rounded-lg border border-gray-200 transition-all duration-normal',
          // Variants
          {
            'shadow-sm hover:shadow-md': variant === 'default',
            'shadow-lg hover:shadow-xl': variant === 'elevated',
            'shadow-none border-0': variant === 'flat',
          },
          // Sizes
          {
            'p-4': size === 'sm',
            'p-6': size === 'md',
            'p-8': size === 'lg',
          },
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)
Card.displayName = 'Card'

interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('flex flex-col space-y-1.5 pb-6', className)}
        {...props}
      >
        {children}
      </div>
    )
  }
)
CardHeader.displayName = 'CardHeader'

interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  children: React.ReactNode
  level?: 1 | 2 | 3 | 4 | 5 | 6
}

const CardTitle = React.forwardRef<HTMLHeadingElement, CardTitleProps>(
  ({ className, children, level = 3, ...props }, ref) => {
    const Component = `h${level}` as keyof JSX.IntrinsicElements
    
    return (
      <Component
        ref={ref as any}
        className={cn(
          // New York Magazine typography
          'font-serif font-semibold leading-tight tracking-tight text-ink',
          {
            'text-4xl': level === 1,
            'text-3xl': level === 2,
            'text-2xl': level === 3,
            'text-xl': level === 4,
            'text-lg': level === 5,
            'text-base': level === 6,
          },
          className
        )}
        {...props}
      >
        {children}
      </Component>
    )
  }
)
CardTitle.displayName = 'CardTitle'

interface CardDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {
  children: React.ReactNode
}

const CardDescription = React.forwardRef<HTMLParagraphElement, CardDescriptionProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <p
        ref={ref}
        className={cn(
          'text-base text-gray-600 leading-relaxed font-sans',
          className
        )}
        {...props}
      >
        {children}
      </p>
    )
  }
)
CardDescription.displayName = 'CardDescription'

interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

const CardContent = React.forwardRef<HTMLDivElement, CardContentProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('pt-0', className)}
        {...props}
      >
        {children}
      </div>
    )
  }
)
CardContent.displayName = 'CardContent'

interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

const CardFooter = React.forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('flex items-center pt-6', className)}
        {...props}
      >
        {children}
      </div>
    )
  }
)
CardFooter.displayName = 'CardFooter'

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter }