'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import StepWrapper from '@/components/onboarding/StepWrapper'
import { Button } from '@/components/ui/button'
import { Check, Edit2, Calendar, MapPin, Users, DollarSign, Camera, UserPlus } from 'lucide-react'
import { ONBOARDING_STEPS } from '@/lib/onboarding'

interface StepData {
  profile?: any
  event?: any
  invite?: any
  budget?: any
  vendors?: any
  guests?: any
}

export default function ReviewPage() {
  const router = useRouter()
  const [stepData, setStepData] = useState<StepData>({})
  const [isGenerating, setIsGenerating] = useState(false)
  
  // Load all step data
  useEffect(() => {
    const loadAllData = async () => {
      try {
        const steps = ['profile', 'event', 'invite', 'budget', 'vendors', 'guests']
        const data: StepData = {}
        
        for (const step of steps) {
          const response = await fetch(`/api/onboarding/${step}`)
          if (response.ok) {
            const result = await response.json()
            data[step as keyof StepData] = result.stepData || {}
          }
        }
        
        setStepData(data)
      } catch (error) {
        console.error('Error loading review data:', error)
      }
    }
    loadAllData()
  }, [])
  
  const handleEdit = (step: string) => {
    router.push(`/onboarding/${step}`)
  }
  
  const handleGeneratePlan = async () => {
    setIsGenerating(true)
    
    try {
      // Complete onboarding
      const response = await fetch('/api/onboarding/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      
      if (response.ok) {
        router.push('/onboarding/success')
      } else {
        console.error('Error completing onboarding')
        setIsGenerating(false)
      }
    } catch (error) {
      console.error('Error generating plan:', error)
      setIsGenerating(false)
    }
  }
  
  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'Not set'
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    })
  }
  
  const formatCurrency = (amount: string, currency: string) => {
    const symbol = currency === 'NGN' ? '₦' : '$'
    return `${symbol}${parseInt(amount).toLocaleString()}`
  }
  
  return (
    <StepWrapper
      step="review"
      title="Review your wedding details"
      subtitle="Make sure everything looks good before we create your personalized plan"
      onNext={handleGeneratePlan}
      nextLabel={isGenerating ? 'Generating...' : 'Generate My Plan'}
    >
      <div className="space-y-6">
        {/* Profile Section */}
        <div className="border rounded-lg p-4">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Your Profile</h3>
              <div className="space-y-1 text-sm text-gray-600">
                <p><strong>Name:</strong> {stepData.profile?.userName || 'Not provided'}</p>
                {stepData.profile?.partnerName && (
                  <p><strong>Partner:</strong> {stepData.profile.partnerName}</p>
                )}
                <p><strong>Role:</strong> {stepData.profile?.role || 'Not provided'}</p>
                <p><strong>Location:</strong> {stepData.profile?.country || 'Not provided'}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleEdit('profile')}
            >
              <Edit2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {/* Event Section */}
        <div className="border rounded-lg p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Event Details
              </h3>
              <div className="space-y-1 text-sm text-gray-600">
                <p><strong>Date:</strong> {
                  stepData.event?.weddingDate 
                    ? formatDate(stepData.event.weddingDate)
                    : `${stepData.event?.estimatedMonth || ''}/${stepData.event?.estimatedYear || 'TBD'}`
                }</p>
                <p><strong>Location:</strong> {stepData.event?.city || 'Not provided'}</p>
                <p><strong>Guest Count:</strong> {stepData.event?.estimatedGuests || 'Not provided'}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleEdit('event')}
            >
              <Edit2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {/* Budget Section */}
        <div className="border rounded-lg p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Budget
              </h3>
              <div className="text-sm text-gray-600">
                {stepData.budget?.budgetType === 'exact' && stepData.budget?.exactBudget ? (
                  <p>{formatCurrency(stepData.budget.exactBudget, stepData.budget.currency || 'USD')}</p>
                ) : stepData.budget?.budgetTier ? (
                  <p>{stepData.budget.budgetTier} tier selected</p>
                ) : (
                  <p>Not provided</p>
                )}
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleEdit('budget')}
            >
              <Edit2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {/* Vendors Section */}
        <div className="border rounded-lg p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                <Camera className="h-4 w-4" />
                Priority Vendors
              </h3>
              <div className="text-sm text-gray-600">
                {stepData.vendors?.categories?.length > 0 ? (
                  <p>{stepData.vendors.categories.join(', ')}</p>
                ) : (
                  <p>No vendors selected</p>
                )}
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleEdit('vendors')}
            >
              <Edit2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {/* Team Section */}
        <div className="border rounded-lg p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                <UserPlus className="h-4 w-4" />
                Team & Guests
              </h3>
              <div className="space-y-1 text-sm text-gray-600">
                {stepData.invite?.partnerEmail || stepData.invite?.teamEmail ? (
                  <>
                    {stepData.invite.partnerEmail && <p>Partner: {stepData.invite.partnerEmail}</p>}
                    {stepData.invite.teamEmail && <p>Team: {stepData.invite.teamEmail}</p>}
                  </>
                ) : (
                  <p>No team members added</p>
                )}
                {stepData.guests?.guests?.length > 0 && (
                  <p>{stepData.guests.guests.length} guests added</p>
                )}
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleEdit('invite')}
            >
              <Edit2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Check className="h-5 w-5 text-purple-600 mt-0.5" />
            <div className="text-sm text-purple-800">
              <p className="font-medium mb-1">Ready to generate your plan!</p>
              <p>We'll create a personalized timeline, budget breakdown, and vendor recommendations based on your preferences.</p>
            </div>
          </div>
        </div>
      </div>
    </StepWrapper>
  )
}