'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle, Calendar, DollarSign, Users, Camera } from 'lucide-react'
import { trackOnboardingEvent } from '@/lib/onboarding'
import { Button } from '@/components/ui/button'

export default function SuccessPage() {
  const router = useRouter()
  
  useEffect(() => {
    trackOnboardingEvent('ob_completed', { step: 'success' })
  }, [])
  
  const handleGoToDashboard = () => {
    router.push('/dashboard')
  }
  
  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-50 to-rose-50 flex items-center justify-center px-4">
      <div className="max-w-2xl w-full">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 mb-6">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Welcome to Your Wedding Command Center!
          </h1>
          
          <p className="text-lg text-gray-600 mb-8">
            Your personalized wedding plan is ready. Let's make your dream wedding a reality!
          </p>
          
          <div className="grid md:grid-cols-2 gap-4 mb-8">
            <div className="bg-purple-50 rounded-lg p-4 text-left">
              <Calendar className="h-6 w-6 text-purple-600 mb-2" />
              <h3 className="font-semibold text-gray-900 mb-1">Your Timeline</h3>
              <p className="text-sm text-gray-600">
                Customized checklist with everything you need to do
              </p>
            </div>
            
            <div className="bg-rose-50 rounded-lg p-4 text-left">
              <DollarSign className="h-6 w-6 text-rose-600 mb-2" />
              <h3 className="font-semibold text-gray-900 mb-1">Budget Tracker</h3>
              <p className="text-sm text-gray-600">
                Keep track of expenses and stay within budget
              </p>
            </div>
            
            <div className="bg-indigo-50 rounded-lg p-4 text-left">
              <Users className="h-6 w-6 text-indigo-600 mb-2" />
              <h3 className="font-semibold text-gray-900 mb-1">Guest Manager</h3>
              <p className="text-sm text-gray-600">
                Manage invitations and track RSVPs
              </p>
            </div>
            
            <div className="bg-amber-50 rounded-lg p-4 text-left">
              <Camera className="h-6 w-6 text-amber-600 mb-2" />
              <h3 className="font-semibold text-gray-900 mb-1">Vendor Directory</h3>
              <p className="text-sm text-gray-600">
                Find and book the perfect vendors
              </p>
            </div>
          </div>
          
          <Button
            onClick={handleGoToDashboard}
            className="w-full md:w-auto px-8 py-3 bg-gradient-to-r from-rose-500 to-purple-600 text-white rounded-lg font-medium text-lg hover:from-rose-600 hover:to-purple-700 transition-all"
          >
            Go to Dashboard
          </Button>
          
          <p className="text-sm text-gray-500 mt-4">
            Tip: Start by reviewing your timeline and adding key dates
          </p>
        </div>
      </div>
    </main>
  )
}