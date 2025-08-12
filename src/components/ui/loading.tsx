import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function LoadingSpinner({ size = 'md', className }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  }
  
  return (
    <Loader2 className={cn('animate-spin', sizeClasses[size], className)} />
  )
}

interface LoadingOverlayProps {
  message?: string
  className?: string
}

export function LoadingOverlay({ message = 'Loading...', className }: LoadingOverlayProps) {
  return (
    <div className={cn(
      'absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50',
      className
    )}>
      <div className="flex flex-col items-center gap-3">
        <LoadingSpinner size="lg" />
        <p className="text-sm text-gray-600">{message}</p>
      </div>
    </div>
  )
}

interface LoadingCardProps {
  message?: string
  className?: string
}

export function LoadingCard({ message = 'Loading...', className }: LoadingCardProps) {
  return (
    <div className={cn('p-8 text-center', className)}>
      <LoadingSpinner size="lg" className="mx-auto mb-4" />
      <p className="text-gray-600">{message}</p>
    </div>
  )
}

interface LoadingButtonProps {
  loading?: boolean
  children: React.ReactNode
  loadingText?: string
  className?: string
}

export function LoadingButton({ 
  loading, 
  children, 
  loadingText = 'Loading...', 
  className 
}: LoadingButtonProps) {
  return (
    <button className={className} disabled={loading}>
      {loading ? (
        <>
          <LoadingSpinner size="sm" className="mr-2" />
          {loadingText}
        </>
      ) : (
        children
      )}
    </button>
  )
}

// Skeleton loaders
export function SkeletonText({ className }: { className?: string }) {
  return (
    <div className={cn('h-4 bg-gray-200 rounded animate-pulse', className)} />
  )
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn('bg-white rounded-lg shadow-sm p-6 space-y-4', className)}>
      <SkeletonText className="w-1/3" />
      <SkeletonText className="w-full" />
      <SkeletonText className="w-2/3" />
    </div>
  )
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="w-full">
      <div className="h-10 bg-gray-100 rounded-t-lg animate-pulse" />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 p-4 border-b">
          <SkeletonText className="w-1/4" />
          <SkeletonText className="w-1/3" />
          <SkeletonText className="w-1/4" />
          <SkeletonText className="w-1/6" />
        </div>
      ))}
    </div>
  )
}