import React from 'react'
import { cn } from '@/utils/cn'

interface UnreadBadgeProps {
  count: number
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function UnreadBadge({ count, size = 'md', className }: UnreadBadgeProps) {
  if (count <= 0) return null

  const sizeClasses = {
    sm: 'h-4 min-w-[16px] text-[10px] px-1',
    md: 'h-5 min-w-[20px] text-xs px-1.5',
    lg: 'h-6 min-w-[24px] text-sm px-2'
  }

  // Format count (99+ for large numbers)
  const displayCount = count > 99 ? '99+' : count.toString()

  return (
    <span 
      className={cn(
        'inline-flex items-center justify-center rounded-full bg-accent text-white font-medium',
        sizeClasses[size],
        className
      )}
    >
      {displayCount}
    </span>
  )
}