'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Step1AboutYou from './steps/Step1AboutYou'
import Step2WeddingDetails from './steps/Step2WeddingDetails'
import Step3VenueLocation from './steps/Step3VenueLocation'
import Step4PlanningBudget from './steps/Step4PlanningBudget'
import ProgressBar from './ProgressBar'

export interface OnboardingData {
  // Step 1 - About You
  partner1_name: string
  partner2_name?: string
  
  // Step 2 - Wedding Details
  wedding_style?: string
  wedding_date?: string
  
  // Step 3 - Venue & Location
  venue_name?: string
  venue_location?: string
  
  // Step 4 - Planning & Budget
  guest_count_estimate?: number
  budget_total?: number
}

interface OnboardingFlowProps {
  userId: string
  userEmail?: string
}

export default function OnboardingFlow({ userId, userEmail }: OnboardingFlowProps) {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error' | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  
  const [formData, setFormData] = useState<OnboardingData>({
    partner1_name: '',
    partner2_name: '',
    wedding_style: '',
    wedding_date: '',
    venue_name: '',
    venue_location: '',
    guest_count_estimate: undefined,
    budget_total: undefined,
  })

  // Auto-save functionality with debouncing
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (formData.partner1_name) { // Only save if there's meaningful data
        localStorage.setItem('onboarding-data', JSON.stringify(formData))
        setSaveStatus('saved')
        setTimeout(() => setSaveStatus(null), 2000)
      }
    }, 1000)

    return () => clearTimeout(timeoutId)
  }, [formData])

  // Load saved data on mount
  useEffect(() => {
    const savedData = localStorage.getItem('onboarding-data')
    if (savedData) {
      try {
        setFormData(JSON.parse(savedData))
      } catch (error) {
        console.error('Error loading saved onboarding data:', error)
      }
    }
  }, [])

  const updateFormData = (updates: Partial<OnboardingData>) => {
    setSaveStatus('saving')
    setFormData(prev => ({ ...prev, ...updates }))
  }

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(prev => prev + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1)
    }
  }

  const handleSkip = () => {
    if (currentStep < 4) {
      setCurrentStep(prev => prev + 1)
    }
  }

  const handleComplete = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/couples', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clerk_user_id: userId,
          email: userEmail,
          ...formData,
          onboarding_completed: true,
        }),
      })

      if (response.ok) {
        // Clear saved data
        localStorage.removeItem('onboarding-data')
        // Redirect to dashboard
        router.push('/dashboard')
      } else {
        const errorData = await response.json()
        console.error('API Error:', errorData)
        throw new Error(errorData.error || 'Failed to save onboarding data')
      }
    } catch (error) {
      console.error('Error completing onboarding:', error)
      setSaveStatus('error')
      setErrorMessage(error instanceof Error ? error.message : 'An error occurred while saving')
    } finally {
      setIsLoading(false)
    }
  }

  const steps = [
    { number: 1, title: 'About You', component: Step1AboutYou },
    { number: 2, title: 'Wedding Details', component: Step2WeddingDetails },
    { number: 3, title: 'Venue & Location', component: Step3VenueLocation },
    { number: 4, title: 'Planning & Budget', component: Step4PlanningBudget },
  ]

  const CurrentStepComponent = steps[currentStep - 1].component

  return (
    <div className="bg-white rounded-lg shadow-lg p-8">
      <ProgressBar currentStep={currentStep} totalSteps={4} />
      
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Step {currentStep} of 4: {steps[currentStep - 1].title}
        </h2>
        <div className="text-sm text-gray-500">
          {Math.round((currentStep / 4) * 100)}% Complete
        </div>
      </div>

      {saveStatus && (
        <div className="mb-4 text-sm">
          {saveStatus === 'saving' && (
            <span className="text-blue-600">Saving...</span>
          )}
          {saveStatus === 'saved' && (
            <span className="text-green-600">Progress saved automatically</span>
          )}
          {saveStatus === 'error' && (
            <div className="text-red-600">
              <p>Error saving progress</p>
              {errorMessage && (
                <p className="text-xs mt-1">{errorMessage}</p>
              )}
            </div>
          )}
        </div>
      )}

      <CurrentStepComponent
        formData={formData}
        updateFormData={updateFormData}
        onNext={handleNext}
        onPrevious={handlePrevious}
        onSkip={handleSkip}
        onComplete={handleComplete}
        isLoading={isLoading}
        currentStep={currentStep}
      />
    </div>
  )
}
