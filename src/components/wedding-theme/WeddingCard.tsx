import * as React from 'react'
import { cn } from '@/lib/utils'

interface WeddingCardProps extends React.HTMLAttributes<HTMLDivElement> {
  hover?: boolean
  padding?: 'sm' | 'md' | 'lg'
}

export function WeddingCard({ 
  className, 
  hover = true, 
  padding = 'md',
  children,
  ...props 
}: WeddingCardProps) {
  const paddingClasses = {
    sm: 'p-4 sm:p-6 lg:p-8',
    md: 'p-4 sm:p-8 lg:p-12',
    lg: 'p-8 sm:p-12 lg:p-16'
  }
  
  return (
    <div
      className={cn(
        'bg-white rounded-sm shadow-sm',
        hover && 'hover:shadow-md transition-shadow',
        paddingClasses[padding],
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

interface WeddingCardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string
  subtitle?: string
}

export function WeddingCardHeader({ 
  className,
  title,
  subtitle,
  children,
  ...props 
}: WeddingCardHeaderProps) {
  return (
    <div className={cn('mb-6', className)} {...props}>
      {title && (
        <h3 className="text-xs font-medium tracking-[0.2em] text-gray-500 uppercase mb-2">
          {title}
        </h3>
      )}
      {subtitle && (
        <p className="text-sm font-light text-gray-600">
          {subtitle}
        </p>
      )}
      {children}
    </div>
  )
}

interface WeddingCardContentProps extends React.HTMLAttributes<HTMLDivElement> {}

export function WeddingCardContent({ 
  className,
  children,
  ...props 
}: WeddingCardContentProps) {
  return (
    <div className={cn('space-y-4', className)} {...props}>
      {children}
    </div>
  )
}

interface WeddingStatCardProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string | number
  label: string
  sublabel?: string
  valueColor?: 'default' | 'sage' | 'brown' | 'amber'
  icon?: React.ReactNode
}

export function WeddingStatCard({ 
  className,
  value,
  label,
  sublabel,
  valueColor = 'default',
  icon,
  ...props 
}: WeddingStatCardProps) {
  const valueColorClasses = {
    default: 'text-gray-900',
    sage: 'text-wedding-sage',
    brown: 'text-wedding-brown',
    amber: 'text-amber-600'
  }
  
  return (
    <div
      className={cn(
        'bg-white p-4 sm:p-6 lg:p-8 rounded-sm shadow-sm text-center hover:shadow-md transition-shadow',
        className
      )}
      {...props}
    >
      {icon && (
        <div className="mb-3 flex justify-center">
          {icon}
        </div>
      )}
      <p className={cn('text-3xl font-light', valueColorClasses[valueColor])}>
        {value}
      </p>
      <p className="text-xs font-medium tracking-[0.2em] text-gray-500 uppercase mt-2">
        {label}
      </p>
      {sublabel && (
        <p className="text-xs font-light text-gray-500 mt-1">
          {sublabel}
        </p>
      )}
    </div>
  )
}