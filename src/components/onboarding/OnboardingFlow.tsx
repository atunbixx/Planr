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
  partner1Name: string
  partner2Name?: string
  
  // Step 2 - Wedding Details
  weddingStyle?: string
  weddingDate?: string
  
  // Step 3 - Venue & Location
  venueName?: string
  venueLocation?: string
  
  // Step 4 - Planning & Budget
  guestCountEstimate?: number
  totalBudget?: number
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
    partner1Name: '',
    partner2Name: '',
    weddingStyle: '',
    weddingDate: '',
    venueName: '',
    venueLocation: '',
    guestCountEstimate: undefined,
    totalBudget: undefined,
  })

  // Auto-save functionality with debouncing
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (formData.partner1Name) { // Only save if there's meaningful data
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
        const parsed = JSON.parse(savedData)
        
        // Clean up any old snake_case field names from cached data
        const cleanedData: OnboardingData = {
          partner1Name: parsed.partner1Name || parsed.partner1Name || '',
          partner2Name: parsed.partner2Name || parsed.partner2Name || '',
          weddingStyle: parsed.weddingStyle || parsed.weddingStyle || '',
          weddingDate: parsed.weddingDate || parsed.weddingDate || '',
          venueName: parsed.venueName || parsed.venueName || '',
          venueLocation: parsed.venueLocation || parsed.venueLocation || '',
          guestCountEstimate: parsed.guestCountEstimate || parsed.guestCountEstimate || undefined,
          totalBudget: parsed.totalBudget || parsed.budget_total || undefined,
        }
        
        setFormData(cleanedData)
        
        // Re-save the cleaned data to localStorage
        localStorage.setItem('onboarding-data', JSON.stringify(cleanedData))
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
          email: userEmail,
          ...formData,
        }),
      })

      let responseData
      try {
        responseData = await response.json()
      } catch (jsonError) {
        console.error('Failed to parse response as JSON:', jsonError)
        responseData = { error: 'Invalid response format' }
      }
      
      if (response.ok) {
        console.log('Onboarding completed successfully:', responseData)
        // Clear saved data
        localStorage.removeItem('onboarding-data')
        // Navigate to dashboard using Next.js router
        router.push('/dashboard')
      } else {
        console.error('API Error Response:', {
          status: response.status,
          statusText: response.statusText,
          data: responseData,
          url: response.url
        })
        throw new Error(responseData?.error || responseData?.details || `Failed to save onboarding data (Status: ${response.status})`)
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
          {Math.round(((currentStep / 4) * 100) * 100) / 100}% Complete
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
