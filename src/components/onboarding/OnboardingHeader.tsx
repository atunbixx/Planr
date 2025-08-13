'use client'

import { useRouter, usePathname } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ONBOARDING_STEPS, getPreviousStep } from '@/lib/onboarding'

interface OnboardingHeaderProps {
  currentStep: string
  onSaveAndExit?: () => void
}

export default function OnboardingHeader({ currentStep, onSaveAndExit }: OnboardingHeaderProps) {
  const router = useRouter()
  const pathname = usePathname()
  const fromPath = typeof window !== 'undefined' ? sessionStorage.getItem('onboarding-from') : null
  
  const currentStepIndex = ONBOARDING_STEPS.indexOf(currentStep as any)
  const totalSteps = ONBOARDING_STEPS.length - 1 // Exclude success step from count
  
  const handleBack = () => {
    const previousStep = getPreviousStep(currentStep)
    if (previousStep) {
      router.push(`/onboarding/${previousStep}`)
    }
  }
  
  const handleSaveAndExit = () => {
    if (onSaveAndExit) {
      onSaveAndExit()
    }
    // Navigate to where user came from, or dashboard
    const destination = fromPath || '/dashboard'
    router.push(destination)
  }
  
  // Don't show header on success page
  if (currentStep === 'success') {
    return null
  }
  
  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-gray-200">
      <div className="max-w-4xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {currentStepIndex > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBack}
                className="gap-1"
              >
                <ChevronLeft className="h-4 w-4" />
                Back
              </Button>
            )}
            
            <div className="text-sm text-gray-600">
              Step {currentStepIndex + 1} of {totalSteps}
            </div>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleSaveAndExit}
          >
            Save & Exit
          </Button>
        </div>
      </div>
    </header>
  )
}