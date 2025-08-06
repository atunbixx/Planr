'use client'

import { useEffect } from 'react'
import { redirect } from 'next/navigation'
import { useAuth, useUser } from '@clerk/nextjs'
import OnboardingFlow from '@/components/onboarding/OnboardingFlow'
import { prisma } from '@/lib/prisma'

export default function OnboardingPage() {
  const { userId, isLoaded: authLoaded } = useAuth()
  const { user, isLoaded: userLoaded } = useUser()

  useEffect(() => {
    // Check if user has already completed onboarding
    const checkOnboardingStatus = async () => {
      if (!userId) return
      
      try {
        const response = await fetch('/api/user/onboarding-status')
        if (response.ok) {
          const { hasCompletedOnboarding } = await response.json()
          if (hasCompletedOnboarding) {
            // User has already completed onboarding, redirect to dashboard
            window.location.href = '/dashboard'
          }
        }
      } catch (error) {
        console.error('Error checking onboarding status:', error)
      }
    }

    if (authLoaded && userId) {
      checkOnboardingStatus()
    }
  }, [authLoaded, userId])

  if (!authLoaded || !userLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your wedding planning journey...</p>
        </div>
      </div>
    )
  }

  if (!userId || !user) {
    redirect('/sign-in')
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
            userId={userId} 
            userEmail={user.emailAddresses[0]?.emailAddress}
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