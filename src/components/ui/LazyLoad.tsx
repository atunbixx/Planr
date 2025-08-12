'use client'

import { Suspense, ComponentType } from 'react'
import { Card, CardContent } from '@/components/ui/card'

interface LazyLoadProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  minHeight?: string
}

const DefaultFallback = () => (
  <Card className="animate-pulse">
    <CardContent className="p-6">
      <div className="h-32 bg-gray-200 rounded-md flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    </CardContent>
  </Card>
)

export function LazyLoad({ children, fallback, minHeight = "200px" }: LazyLoadProps) {
  return (
    <div style={{ minHeight }}>
      <Suspense fallback={fallback || <DefaultFallback />}>
        {children}
      </Suspense>
    </div>
  )
}

// Higher-order component for lazy loading
export function withLazyLoad<T extends object>(
  Component: ComponentType<T>,
  fallback?: React.ReactNode
) {
  return function LazyLoadedComponent(props: T) {
    return (
      <LazyLoad fallback={fallback}>
        <Component {...props} />
      </LazyLoad>
    )
  }
}

export default LazyLoad