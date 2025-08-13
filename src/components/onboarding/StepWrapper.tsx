'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { debounce } from 'lodash'
import OnboardingHeader from './OnboardingHeader'
import { getNextStep, isOptionalStep, trackOnboardingEvent } from '@/lib/onboarding'
import { Check } from 'lucide-react'

interface StepWrapperProps {
  step: string
  title: string
  subtitle?: string
  children: React.ReactNode
  onNext?: () => Promise<boolean> // Return false to prevent navigation
  onSkip?: () => Promise<void>
  nextLabel?: string
  showSkip?: boolean
  onAutosave?: (data: any) => void
}

export default function StepWrapper({
  step,
  title,
  subtitle,
  children,
  onNext,
  onSkip,
  nextLabel = 'Continue',
  showSkip = false,
  onAutosave
}: StepWrapperProps) {
  const router = useRouter()
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle')
  const [isNavigating, setIsNavigating] = useState(false)
  
  // Autosave handler
  const handleAutosave = useCallback(
    debounce(async (data: any) => {
      setSaveStatus('saving')
      try {
        const response = await fetch(`/api/onboarding/${step}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        })
        
        if (response.ok) {
          setSaveStatus('saved')
          setTimeout(() => setSaveStatus('idle'), 2000)
        }
      } catch (error) {
        console.error('Autosave error:', error)
        setSaveStatus('idle')
      }
    }, 1000),
    [step]
  )
  
  // Pass autosave handler to parent if provided
  useEffect(() => {
    if (onAutosave) {
      onAutosave(handleAutosave)
    }
  }, [onAutosave, handleAutosave])
  
  const handleNext = async () => {
    if (isNavigating) return
    
    setIsNavigating(true)
    
    try {
      // Call onNext if provided
      if (onNext) {
        const shouldContinue = await onNext()
        if (!shouldContinue) {
          setIsNavigating(false)
          return
        }
      }
      
      // Mark step as completed
      await fetch(`/api/onboarding/${step}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: true })
      })
      
      // Navigate to next step
      const nextStep = getNextStep(step)
      if (nextStep) {
        router.push(`/onboarding/${nextStep}`)
      }
    } catch (error) {
      console.error('Error navigating to next step:', error)
      setIsNavigating(false)
    }
  }
  
  const handleSkip = async () => {
    if (isNavigating || !onSkip) return
    
    setIsNavigating(true)
    
    try {
      await onSkip()
      
      // Navigate to next step
      const nextStep = getNextStep(step)
      if (nextStep) {
        router.push(`/onboarding/${nextStep}`)
      }
    } catch (error) {
      console.error('Error skipping step:', error)
      setIsNavigating(false)
    }
  }
  
  // Track step view
  useEffect(() => {
    trackOnboardingEvent('ob_step_viewed', { step })
  }, [step])
  
  // Store where user came from for Save & Exit
  useEffect(() => {
    const referrer = document.referrer
    if (referrer && !referrer.includes('/onboarding')) {
      sessionStorage.setItem('onboarding-from', referrer)
    }
  }, [])
  
  return (
    <>
      <OnboardingHeader currentStep={step} />
      
      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm p-6 md:p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{title}</h1>
            {subtitle && (
              <p className="text-gray-600">{subtitle}</p>
            )}
          </div>
          
          <div className="space-y-6">
            {children}
          </div>
          
          <div className="mt-8 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              {saveStatus === 'saving' && (
                <span>Saving...</span>
              )}
              {saveStatus === 'saved' && (
                <>
                  <Check className="h-4 w-4 text-green-600" />
                  <span className="text-green-600">Saved</span>
                </>
              )}
            </div>
            
            <div className="flex items-center gap-3">
              {showSkip && isOptionalStep(step) && (
                <button
                  onClick={handleSkip}
                  disabled={isNavigating}
                  className="text-gray-500 hover:text-gray-700 text-sm"
                >
                  Skip
                </button>
              )}
              
              <button
                onClick={handleNext}
                disabled={isNavigating}
                className="px-6 py-2.5 bg-gradient-to-r from-rose-500 to-purple-600 text-white rounded-lg font-medium hover:from-rose-600 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isNavigating ? 'Loading...' : nextLabel}
              </button>
            </div>
          </div>
        </div>
      </main>
    </>
  )
}

// Export autosave handler type for use in step components
export type AutosaveHandler = (data: any) => void