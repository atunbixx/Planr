import * as React from 'react'
import { cn } from '@/lib/utils'

interface WeddingPageLayoutProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

export function WeddingPageLayout({ 
  className,
  children,
  ...props 
}: WeddingPageLayoutProps) {
  return (
    <div 
      className={cn(
        'min-h-screen bg-wedding-background-primary w-full',
        className
      )} 
      {...props}
    >
      <div className="w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
        {children}
      </div>
    </div>
  )
}

interface WeddingContentSectionProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  spacing?: 'sm' | 'md' | 'lg'
}

export function WeddingContentSection({ 
  className,
  children,
  spacing = 'md',
  ...props 
}: WeddingContentSectionProps) {
  const spacingClasses = {
    sm: 'mb-4 sm:mb-6 lg:mb-8',
    md: 'mb-6 sm:mb-8 lg:mb-12',
    lg: 'mb-8 sm:mb-12 lg:mb-16'
  }
  
  return (
    <div 
      className={cn(
        spacingClasses[spacing],
        className
      )} 
      {...props}
    >
      {children}
    </div>
  )
}

interface WeddingGridProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  cols?: 1 | 2 | 3 | 4
  gap?: 'sm' | 'md' | 'lg'
  responsive?: boolean
}

export function WeddingGrid({ 
  className,
  children,
  cols = 4,
  gap = 'md',
  responsive = true,
  ...props 
}: WeddingGridProps) {
  const gapClasses = {
    sm: 'gap-3 sm:gap-4 lg:gap-6',
    md: 'gap-4 sm:gap-6 lg:gap-8',
    lg: 'gap-6 sm:gap-8 lg:gap-12'
  }
  
  const colClasses = {
    1: 'grid-cols-1',
    2: responsive ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-2',
    3: responsive ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-3',
    4: responsive ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4' : 'grid-cols-4'
  }
  
  return (
    <div 
      className={cn(
        'grid',
        colClasses[cols],
        gapClasses[gap],
        className
      )} 
      {...props}
    >
      {children}
    </div>
  )
}