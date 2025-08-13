'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Heart, Calendar, Users, DollarSign } from 'lucide-react'
import { trackOnboardingEvent } from '@/lib/onboarding'

export default function WelcomePage() {
  const router = useRouter()
  
  useEffect(() => {
    trackOnboardingEvent('ob_started', { step: 'welcome' })
  }, [])
  
  const handleGetStarted = () => {
    router.push('/onboarding/profile')
  }
  
  return (
    <main className="max-w-4xl mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-rose-100 to-purple-100 mb-6">
          <Heart className="h-10 w-10 text-rose-600" />
        </div>
        
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
          Welcome to Your Wedding Journey
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Let's create your perfect wedding plan together. In just a few minutes, 
          we'll set up everything you need to start planning your dream day.
        </p>
      </div>
      
      <div className="grid md:grid-cols-3 gap-6 mb-12">
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center mb-4">
            <Calendar className="h-6 w-6 text-purple-600" />
          </div>
          <h3 className="font-semibold text-gray-900 mb-2">Timeline & Tasks</h3>
          <p className="text-gray-600 text-sm">
            Get a personalized timeline with all the tasks you need to complete
          </p>
        </div>
        
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center mb-4">
            <DollarSign className="h-6 w-6 text-rose-600" />
          </div>
          <h3 className="font-semibold text-gray-900 mb-2">Budget Planning</h3>
          <p className="text-gray-600 text-sm">
            Track expenses and stay within your budget with smart recommendations
          </p>
        </div>
        
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center mb-4">
            <Users className="h-6 w-6 text-indigo-600" />
          </div>
          <h3 className="font-semibold text-gray-900 mb-2">Guest Management</h3>
          <p className="text-gray-600 text-sm">
            Manage your guest list, send invitations, and track RSVPs effortlessly
          </p>
        </div>
      </div>
      
      <div className="text-center">
        <button
          onClick={handleGetStarted}
          className="px-8 py-3 bg-gradient-to-r from-rose-500 to-purple-600 text-white rounded-lg font-medium text-lg hover:from-rose-600 hover:to-purple-700 transition-all inline-flex items-center gap-2"
        >
          Get Started
        </button>
        <p className="text-sm text-gray-500 mt-4">
          Takes only 5 minutes • No credit card required
        </p>
      </div>
    </main>
  )
}