'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { AlertCircle, RefreshCw, Home } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function AuthErrorContent() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')
  const description = searchParams.get('description')

  const getErrorMessage = () => {
    switch (error) {
      case 'access_denied':
        return {
          title: 'Access Denied',
          message: 'You denied access to your Google account. Please try again and allow access to continue.',
          suggestion: 'Make sure to click "Allow" when prompted by Google.'
        }
      case 'exchange_failed':
        return {
          title: 'Authentication Failed',
          message: description || 'Failed to complete the authentication process.',
          suggestion: 'This might be a temporary issue. Please try signing in again.'
        }
      case 'no_code':
        return {
          title: 'Invalid Authentication',
          message: 'No authorization code was received from the authentication provider.',
          suggestion: 'Please try the sign-in process again from the beginning.'
        }
      case 'unexpected_error':
        return {
          title: 'Unexpected Error',
          message: description || 'An unexpected error occurred during authentication.',
          suggestion: 'Please try again. If the problem persists, contact support.'
        }
      default:
        return {
          title: 'Authentication Error',
          message: description || 'There was an error during the authentication process.',
          suggestion: 'Please try signing in again.'
        }
    }
  }

  const errorInfo = getErrorMessage()

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            {errorInfo.title}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {errorInfo.message}
          </p>
          {errorInfo.suggestion && (
            <p className="mt-4 text-xs text-gray-500 bg-gray-100 p-3 rounded-md">
              💡 {errorInfo.suggestion}
            </p>
          )}
          {error && (
            <details className="mt-4 text-left">
              <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-600">
                Technical Details
              </summary>
              <div className="mt-2 text-xs text-gray-500 bg-gray-50 p-2 rounded border font-mono">
                <div><strong>Error:</strong> {error}</div>
                {description && <div><strong>Description:</strong> {description}</div>}
              </div>
            </details>
          )}
        </div>
        <div className="mt-8 space-y-6">
          <div className="flex flex-col space-y-4">
            <Button asChild className="w-full">
              <Link href="/sign-in" className="flex items-center justify-center gap-2">
                <RefreshCw className="h-4 w-4" />
                Try Again
              </Link>
            </Button>
            <Button variant="outline" asChild className="w-full">
              <Link href="/" className="flex items-center justify-center gap-2">
                <Home className="h-4 w-4" />
                Go to Homepage
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AuthCodeError() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Loading...
          </h2>
        </div>
      </div>
    }>
      <AuthErrorContent />
    </Suspense>
  )
}