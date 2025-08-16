'use client'

import React, { ErrorInfo, ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Import logger dynamically to avoid SSR issues
     import('@/lib/monitoring/Logger').then(({ logger }) => {
         logger.error('Error caught by boundary', error, {
           componentStack: errorInfo.componentStack,
           errorBoundary: true
         })
       })
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return <>{this.props.fallback}</>
      }

      return (
        <div className="min-h-[400px] flex items-center justify-center p-4">
          <Card className="max-w-md w-full">
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-500" />
                <CardTitle>Something went wrong</CardTitle>
              </div>
              <CardDescription>
                We encountered an error while loading this section.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <div className="text-sm bg-gray-100 rounded p-3 overflow-auto max-h-32">
                  <code className="text-red-600">
                    {this.state.error.message}
                  </code>
                </div>
              )}
              <div className="flex gap-2">
                <Button onClick={this.handleReset} size="sm">
                  Try Again
                </Button>
                <Button onClick={() => window.location.reload()} variant="outline" size="sm">
                  Reload Page
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}

// Hook version for functional components
export function useErrorBoundary() {
  const [error, setError] = React.useState<Error | null>(null)

  const resetError = React.useCallback(() => {
    setError(null)
  }, [])

  const captureError = React.useCallback((error: Error) => {
    setError(error)
  }, [])

  React.useEffect(() => {
    if (error) {
      throw error
    }
  }, [error])

  return { resetError, captureError }
}

// Async error boundary for handling promise rejections
export function AsyncErrorBoundary({ children, fallback }: Props) {
  const [error, setError] = React.useState<Error | null>(null)

  React.useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      setError(new Error(event.reason))
    }

    window.addEventListener('unhandledrejection', handleUnhandledRejection)

    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
    }
  }, [])

  if (error) {
    if (fallback) {
      return <>{fallback}</>
    }

    return (
      <div className="min-h-[400px] flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <CardTitle>Async Error</CardTitle>
            </div>
            <CardDescription>
              An asynchronous operation failed.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm bg-gray-100 rounded p-3">
              <code className="text-red-600">{error.message}</code>
            </div>
            <Button onClick={() => setError(null)} size="sm">
              Dismiss
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return <>{children}</>
}