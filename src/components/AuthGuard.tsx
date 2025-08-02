'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

interface AuthGuardProps {
  children: React.ReactNode
  requireAuth?: boolean
  redirectTo?: string
}

export function AuthGuard({ children, requireAuth = true, redirectTo = '/auth/signin' }: AuthGuardProps) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isRedirecting, setIsRedirecting] = useState(false)

  useEffect(() => {
    // Don't do anything while still loading or already redirecting
    if (loading || isRedirecting) return

    const currentPath = pathname
    const isAuthPage = currentPath.startsWith('/auth/')
    const isProtectedRoute = requireAuth && !isAuthPage

    // If we need auth but don't have a user
    if (isProtectedRoute && !user) {
      setIsRedirecting(true)
      const redirectUrl = `${redirectTo}?redirectTo=${encodeURIComponent(currentPath)}`
      console.log('🔒 Redirecting to auth:', redirectUrl)
      router.push(redirectUrl)
      return
    }

    // If we have a user but are on an auth page, redirect to intended destination
    if (user && isAuthPage) {
      setIsRedirecting(true)
      const intendedPath = searchParams.get('redirectTo') || '/dashboard'
      console.log('🏠 Redirecting authenticated user to:', intendedPath)
      router.push(intendedPath)
      return
    }

    // Reset redirecting state if no redirect needed
    if (isRedirecting) {
      setIsRedirecting(false)
    }
  }, [user, loading, pathname, searchParams, requireAuth, redirectTo, router, isRedirecting])

  // Show loading state during auth loading or redirect
  if (loading || isRedirecting) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-gray-600">
            {isRedirecting ? 'Redirecting...' : 'Loading...'}
          </p>
        </div>
      </div>
    )
  }

  // For protected routes, only show content if user is authenticated
  if (requireAuth && !user) {
    return null // Will be redirected by useEffect
  }

  return <>{children}</>
}