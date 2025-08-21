import React from 'react'

interface CardProps {
  children: React.ReactNode
  className?: string
  padding?: 'none' | 'sm' | 'md' | 'lg'
  variant?: 'default' | 'elevated' | 'outlined'
}

export function Card({ children, className = '', padding = 'md', variant = 'default' }: CardProps) {
  const paddingClasses = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  }

  const variantClasses = {
    default: 'bg-white shadow-sm border border-[#F1F5F9]',
    elevated: 'bg-white shadow-lg border-0',
    outlined: 'bg-white border-2 border-[#E2E8F0] shadow-none'
  }

  return (
    <div className={`${variantClasses[variant]} rounded-xl transition-all duration-200 hover:shadow-md ${paddingClasses[padding]} ${className}`}>
      {children}
    </div>
  )
}

interface CardHeaderProps {
  children: React.ReactNode
  className?: string
}

export function CardHeader({ children, className = '' }: CardHeaderProps) {
  return (
    <div className={`border-b border-[#F1F5F9] pb-4 mb-6 ${className}`}>
      {children}
    </div>
  )
}

interface CardTitleProps {
  children: React.ReactNode
  className?: string
}

export function CardTitle({ children, className = '' }: CardTitleProps) {
  return (
    <h3 className={`text-lg font-semibold text-[#1E293B] ${className}`}>
      {children}
    </h3>
  )
}

interface CardContentProps {
  children: React.ReactNode
  className?: string
}

export function CardContent({ children, className = '' }: CardContentProps) {
  return (
    <div className={className}>
      {children}
    </div>
  )
}