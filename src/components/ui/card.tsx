import React from 'react'
import { cn } from "@/lib/utils";

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
  };

  const variantClasses = {
    default: 'bg-white shadow-[0_2px_8px_rgba(0,0,0,0.06)] border-none hover:shadow-[0_4px_16px_rgba(0,0,0,0.10)]',
    elevated: 'bg-white shadow-[0_4px_16px_rgba(0,0,0,0.10)] border-none',
    outlined: 'bg-white border-2 border-[#E2E8F0] shadow-none hover:shadow-[0_4px_16px_rgba(0,0,0,0.10)]'
  };

  return (
    <div className={
      `${variantClasses[variant]} rounded-none transition-all duration-200 ${paddingClasses[padding]} ${className}`
    }>
      {children}
    </div>
  );
}

interface CardHeaderProps {
  children: React.ReactNode
  className?: string
}

export function CardHeader({ children, className = '' }: CardHeaderProps) {
  return (
    <div className={`border-b border-[#E5E7EB] pb-5 mb-6 flex flex-col gap-1 rounded-none ${className}`}>
      {children}
    </div>
  );
}

interface CardTitleProps {
  children: React.ReactNode
  className?: string
}

export function CardTitle({ children, className = '' }: CardTitleProps) {
  return (
    <h3 className={`text-2xl font-light font-serif text-black tracking-tight leading-tight ${className}`} style={{fontFamily: 'Bodoni Moda, serif'}}>
      {children}
    </h3>
  );
}

interface CardDescriptionProps {
  children: React.ReactNode
  className?: string
}

export function CardDescription({ children, className = '' }: CardDescriptionProps) {
  return (
    <p className={`text-base text-[#666666] mt-2 font-sans ${className}`} style={{fontFamily: 'Inter, Helvetica Neue, sans-serif'}}>
      {children}
    </p>
  );
}

interface CardContentProps {
  children: React.ReactNode
  className?: string
}

export function CardContent({ children, className = '' }: CardContentProps) {
  return (
    <div className={`px-0 py-0 ${className}`}>
      {children}
    </div>
  )
}

export function CardFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex items-center p-6 pt-0 border-t border-[#E5E7EB] bg-[#F9F9F9] rounded-none",
        className
      )}
      {...props}
    />
  );
}
export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter };