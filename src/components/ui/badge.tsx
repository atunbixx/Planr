import React from 'react'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function Badge({ 
  children, 
  variant = 'default', 
  size = 'md',
  className = '' 
}: BadgeProps) {
  const variantClasses = {
    default: 'bg-[#F1F5F9] text-[#475569] border-[#E2E8F0]',
    primary: 'bg-[#722F37] text-white border-[#722F37]',
    secondary: 'bg-[#6B7C32] text-white border-[#6B7C32]',
    success: 'bg-green-100 text-green-800 border-green-200',
    warning: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    error: 'bg-red-100 text-red-800 border-red-200',
    outline: 'bg-white text-[#475569] border-[#E2E8F0]'
  }
  
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-2 text-base'
  }

  return (
    <span className={`
      inline-flex items-center font-semibold rounded-full border transition-all duration-200
      ${variantClasses[variant]} ${sizeClasses[size]} ${className}
    `}>
      {children}
    </span>
  )
}