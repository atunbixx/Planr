'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'

export default function HomePage() {
  const router = useRouter()
  const { user, isLoading } = useAuth()
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (isClient && !isLoading) {
      if (!user) {
        // Not authenticated, redirect to signup
        router.push('/signup')
      } else if (user.role === 'couple' && !user.onboardingCompleted) {
        // Couple who hasn't completed onboarding
        router.push('/onboarding')
      } else {
        // Authenticated user, go to dashboard
        router.push('/dashboard')
      }
    }
  }, [user, isLoading, router, isClient])

  // Prevent hydration mismatch by not rendering until client-side
  if (!isClient) {
    return null
  }

  // Show loading state
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading...</p>
      </div>
    </div>
  )
}
