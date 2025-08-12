'use client'

import { useEffect } from 'react'
import { useSupabaseAuth } from '@/lib/auth/client'
import { useRouter } from 'next/navigation'
import OnboardingFlow from '@/components/onboarding/OnboardingFlow'

export default function OnboardingClient() {
  const { user, isSignedIn, isLoading } = useSupabaseAuth()
  const router = useRouter()

  useEffect(() => {
    // Check if user has already completed onboarding
    const checkOnboardingStatus = async () => {
      if (!isSignedIn || !user) return
      
      try {
        const response = await fetch('/api/user/onboarding-status')
        if (response.ok) {
          const { hasCompletedOnboarding } = await response.json()
          if (hasCompletedOnboarding) {
            // Set the onboarding completion cookie via API and redirect to dashboard
            await fetch('/api/user/set-onboarding-cookie', { method: 'POST' })
            router.push('/dashboard')
          }
        }
      } catch (error) {
        console.error('Error checking onboarding status:', error)
      }
    }

    if (!isLoading && isSignedIn && user) {
      checkOnboardingStatus()
    }
  }, [isLoading, isSignedIn, user])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your wedding planning journey...</p>
        </div>
      </div>
    )
  }

  if (!isSignedIn || !user) {
    // This should not happen as the server component checks authentication
    // But if it does, show a message
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Please sign in to continue</p>
          <a href="/sign-in" className="text-rose-600 hover:underline mt-2 inline-block">
            Go to Sign In
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 to-purple-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Welcome to Your Wedding Planning Journey! 💒
          </h1>
          <p className="text-xl text-gray-600">
            Let's set up your wedding details to personalize your experience
          </p>
        </div>

        {/* Onboarding Carousel */}
        <div className="max-w-3xl mx-auto">
          <OnboardingFlow 
            userId={user.id} 
            userEmail={user.email}
          />
        </div>

        {/* Features Preview */}
        <div className="max-w-4xl mx-auto mt-12 grid md:grid-cols-4 gap-6">
          <div className="text-center p-4">
            <div className="bg-rose-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-2xl">💰</span>
            </div>
            <h3 className="font-semibold mb-1">Budget Tracking</h3>
            <p className="text-sm text-gray-600">Keep your wedding expenses on track</p>
          </div>
          
          <div className="text-center p-4">
            <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-2xl">👥</span>
            </div>
            <h3 className="font-semibold mb-1">Guest Management</h3>
            <p className="text-sm text-gray-600">Track RSVPs and seating arrangements</p>
          </div>
          
          <div className="text-center p-4">
            <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-2xl">🏪</span>
            </div>
            <h3 className="font-semibold mb-1">Vendor Directory</h3>
            <p className="text-sm text-gray-600">Find and manage wedding vendors</p>
          </div>
          
          <div className="text-center p-4">
            <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-2xl">📸</span>
            </div>
            <h3 className="font-semibold mb-1">Photo Gallery</h3>
            <p className="text-sm text-gray-600">Share memories with guests</p>
          </div>
        </div>
      </div>
    </div>
  )
}