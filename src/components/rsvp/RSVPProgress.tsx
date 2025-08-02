'use client'

import React from 'react'
import { cn } from '@/utils/cn'

interface Step {
  id: string
  label: string
}

interface RSVPProgressProps {
  steps: Step[]
  currentStep: number
  attending: boolean | null
  guestName: string
}

export default function RSVPProgress({ steps, currentStep, attending, guestName }: RSVPProgressProps) {
  return (
    <div className="space-y-4">
      {/* Welcome Message */}
      <div className="text-center">
        <h1 className="font-playfair text-2xl sm:text-3xl font-semibold text-ink">
          Welcome, {guestName}
        </h1>
        {attending !== null && (
          <p className="text-gray-600 mt-1">
            {attending 
              ? "We're excited you'll be joining us!" 
              : "We'll miss celebrating with you"}
          </p>
        )}
      </div>

      {/* Progress Bar - Mobile Optimized */}
      <div className="relative">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => {
            const isActive = index === currentStep
            const isCompleted = index < currentStep
            const isLast = index === steps.length - 1

            return (
              <React.Fragment key={step.id}>
                <div className="flex flex-col items-center">
                  <div
                    className={cn(
                      'w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center',
                      'transition-all duration-300 font-semibold text-sm sm:text-base',
                      isActive
                        ? 'bg-ink text-white scale-110 shadow-lg'
                        : isCompleted
                        ? 'bg-wedding-sage text-white'
                        : 'bg-gray-200 text-gray-500'
                    )}
                  >
                    {isCompleted ? (
                      <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      index + 1
                    )}
                  </div>
                  <span
                    className={cn(
                      'mt-2 text-xs sm:text-sm font-medium text-center',
                      'hidden sm:block max-w-[80px]',
                      isActive ? 'text-ink' : 'text-gray-500'
                    )}
                  >
                    {step.label}
                  </span>
                </div>
                {!isLast && (
                  <div
                    className={cn(
                      'flex-1 h-1 mx-2',
                      'transition-all duration-300',
                      index < currentStep
                        ? 'bg-wedding-sage'
                        : 'bg-gray-200'
                    )}
                  />
                )}
              </React.Fragment>
            )
          })}
        </div>

        {/* Mobile Step Label */}
        <div className="sm:hidden mt-4 text-center">
          <p className="text-sm font-medium text-ink">
            Step {currentStep + 1} of {steps.length}: {steps[currentStep]?.label}
          </p>
        </div>
      </div>

      {/* Progress Percentage */}
      <div className="text-center">
        <p className="text-sm text-gray-500">
          {Math.round(((currentStep + 1) / steps.length) * 100)}% Complete
        </p>
      </div>
    </div>
  )
}