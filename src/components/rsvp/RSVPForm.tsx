'use client'

import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/utils/cn'
import MealSelection from './MealSelection'
import PlusOneManager from './PlusOneManager'
import RSVPProgress from './RSVPProgress'

interface Guest {
  id: string
  firstName: string
  lastName: string
  email?: string
  phone?: string
  plusOneAllowed: boolean
  mealChoice?: string
  dietaryRestrictions?: string
  rsvpStatus?: string
  plusOneName?: string
  plusOneMealChoice?: string
  plusOneDietaryRestrictions?: string
}

interface MealOption {
  id: string
  name: string
  description: string
  category: string
}

interface RSVPFormData {
  attending: boolean | null
  email: string
  phone: string
  mealChoice: string
  dietaryRestrictions: string
  plusOneAttending: boolean
  plusOneName: string
  plusOneMealChoice: string
  plusOneDietaryRestrictions: string
  notes: string
}

interface RSVPFormProps {
  guest: Guest
  mealOptions: MealOption[]
  onSubmit: (data: RSVPFormData) => Promise<void>
  initialData?: Partial<RSVPFormData>
}

const STEPS = [
  { id: 'attendance', label: 'Attendance' },
  { id: 'contact', label: 'Contact Info' },
  { id: 'meal', label: 'Meal Selection' },
  { id: 'plus-one', label: 'Plus One' },
  { id: 'notes', label: 'Additional Info' },
  { id: 'review', label: 'Review' }
]

export default function RSVPForm({ guest, mealOptions, onSubmit, initialData }: RSVPFormProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors }
  } = useForm<RSVPFormData>({
    defaultValues: {
      attending: initialData?.attending ?? null,
      email: initialData?.email || guest.email || '',
      phone: initialData?.phone || guest.phone || '',
      mealChoice: initialData?.mealChoice || guest.mealChoice || '',
      dietaryRestrictions: initialData?.dietaryRestrictions || guest.dietaryRestrictions || '',
      plusOneAttending: initialData?.plusOneAttending || false,
      plusOneName: initialData?.plusOneName || guest.plusOneName || '',
      plusOneMealChoice: initialData?.plusOneMealChoice || guest.plusOneMealChoice || '',
      plusOneDietaryRestrictions: initialData?.plusOneDietaryRestrictions || '',
      notes: initialData?.notes || ''
    }
  })

  const attending = watch('attending')
  const plusOneAttending = watch('plusOneAttending')

  const nextStep = () => {
    if (currentStep === 0 && attending === false) {
      // Skip to notes if not attending
      setCurrentStep(4)
    } else if (currentStep === 3 && !guest.plusOneAllowed) {
      // Skip plus-one step if not allowed
      setCurrentStep(4)
    } else if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep === 4 && attending === false) {
      // Go back to attendance if not attending
      setCurrentStep(0)
    } else if (currentStep === 4 && !guest.plusOneAllowed) {
      // Skip plus-one step when going back
      setCurrentStep(2)
    } else if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const onFormSubmit = async (data: RSVPFormData) => {
    setIsSubmitting(true)
    try {
      await onSubmit(data)
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // Attendance
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="font-playfair text-3xl font-semibold text-ink mb-2">
                Will you be joining us?
              </h2>
              <p className="text-gray-600">
                We'd love to celebrate with you on our special day
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => {
                  setValue('attending', true)
                  nextStep()
                }}
                className={cn(
                  'p-8 rounded-lg border-2 transition-all duration-200',
                  'hover:shadow-lg hover:scale-[1.02]',
                  attending === true
                    ? 'border-wedding-sage bg-wedding-sage/10'
                    : 'border-gray-200 hover:border-gray-300'
                )}
              >
                <span className="text-5xl mb-4 block">🎉</span>
                <span className="font-semibold text-lg">Joyfully Accept</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setValue('attending', false)
                  nextStep()
                }}
                className={cn(
                  'p-8 rounded-lg border-2 transition-all duration-200',
                  'hover:shadow-lg hover:scale-[1.02]',
                  attending === false
                    ? 'border-gray-400 bg-gray-100'
                    : 'border-gray-200 hover:border-gray-300'
                )}
              >
                <span className="text-5xl mb-4 block">😢</span>
                <span className="font-semibold text-lg">Regretfully Decline</span>
              </button>
            </div>
          </div>
        )

      case 1: // Contact Info
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="font-playfair text-3xl font-semibold text-ink mb-2">
                How can we reach you?
              </h2>
              <p className="text-gray-600">
                We'll use this to send you updates about the wedding
              </p>
            </div>

            <div className="space-y-4 max-w-md mx-auto">
              <Input
                label="Email Address"
                type="email"
                {...register('email', {
                  required: 'Email is required',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Invalid email address'
                  }
                })}
                error={errors.email?.message}
                fullWidth
              />

              <Input
                label="Phone Number"
                type="tel"
                placeholder="(555) 123-4567"
                {...register('phone')}
                helperText="Optional - in case we need to reach you"
                fullWidth
              />
            </div>
          </div>
        )

      case 2: // Meal Selection
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="font-playfair text-3xl font-semibold text-ink mb-2">
                Dinner Selection
              </h2>
              <p className="text-gray-600">
                Please select your meal preference
              </p>
            </div>

            <MealSelection
              mealOptions={mealOptions}
              selectedMeal={watch('mealChoice')}
              dietaryRestrictions={watch('dietaryRestrictions')}
              onMealSelect={(mealId) => setValue('mealChoice', mealId)}
              onDietaryChange={(value) => setValue('dietaryRestrictions', value)}
              error={errors.mealChoice?.message}
            />
          </div>
        )

      case 3: // Plus One
        return guest.plusOneAllowed ? (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="font-playfair text-3xl font-semibold text-ink mb-2">
                Plus One
              </h2>
              <p className="text-gray-600">
                Will you be bringing a guest?
              </p>
            </div>

            <PlusOneManager
              plusOneAttending={plusOneAttending}
              plusOneName={watch('plusOneName')}
              plusOneMealChoice={watch('plusOneMealChoice')}
              plusOneDietaryRestrictions={watch('plusOneDietaryRestrictions')}
              mealOptions={mealOptions}
              onAttendingChange={(value) => setValue('plusOneAttending', value)}
              onNameChange={(value) => setValue('plusOneName', value)}
              onMealSelect={(value) => setValue('plusOneMealChoice', value)}
              onDietaryChange={(value) => setValue('plusOneDietaryRestrictions', value)}
              errors={{
                name: errors.plusOneName?.message,
                meal: errors.plusOneMealChoice?.message
              }}
            />
          </div>
        ) : null

      case 4: // Additional Notes
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="font-playfair text-3xl font-semibold text-ink mb-2">
                Anything else?
              </h2>
              <p className="text-gray-600">
                Questions, song requests, or special notes for the couple
              </p>
            </div>

            <div className="max-w-md mx-auto">
              <textarea
                {...register('notes')}
                className={cn(
                  'w-full p-4 rounded-lg border border-gray-300',
                  'focus:outline-none focus:ring-2 focus:ring-ink/20 focus:border-ink',
                  'resize-none transition-all duration-200'
                )}
                rows={4}
                placeholder="Share your thoughts, song requests, or well wishes..."
              />
            </div>
          </div>
        )

      case 5: // Review
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="font-playfair text-3xl font-semibold text-ink mb-2">
                Review Your Response
              </h2>
              <p className="text-gray-600">
                Please confirm your RSVP details
              </p>
            </div>

            <div className="max-w-md mx-auto space-y-4">
              <div className="bg-gray-50 rounded-lg p-6 space-y-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Attendance</p>
                  <p className="font-semibold">
                    {attending ? '✅ Joyfully Accepting' : '❌ Regretfully Declining'}
                  </p>
                </div>

                {attending && (
                  <>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Contact</p>
                      <p className="font-semibold">{watch('email')}</p>
                      {watch('phone') && <p className="text-gray-700">{watch('phone')}</p>}
                    </div>

                    <div>
                      <p className="text-sm text-gray-600 mb-1">Meal Selection</p>
                      <p className="font-semibold">
                        {mealOptions.find(m => m.id === watch('mealChoice'))?.name || 'Not selected'}
                      </p>
                      {watch('dietaryRestrictions') && (
                        <p className="text-gray-700 text-sm">
                          Dietary notes: {watch('dietaryRestrictions')}
                        </p>
                      )}
                    </div>

                    {guest.plusOneAllowed && plusOneAttending && (
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Plus One</p>
                        <p className="font-semibold">{watch('plusOneName')}</p>
                        <p className="text-gray-700">
                          {mealOptions.find(m => m.id === watch('plusOneMealChoice'))?.name || 'No meal selected'}
                        </p>
                      </div>
                    )}
                  </>
                )}

                {watch('notes') && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Notes</p>
                    <p className="text-gray-700">{watch('notes')}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  const filteredSteps = STEPS.filter((step, index) => {
    if (index === 3 && !guest.plusOneAllowed) return false
    if (attending === false && (index === 1 || index === 2 || index === 3)) return false
    return true
  })

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-8">
      <RSVPProgress
        steps={filteredSteps}
        currentStep={currentStep}
        attending={attending}
        guestName={`${guest.firstName} ${guest.lastName}`}
      />

      <div className="min-h-[400px] flex flex-col justify-center">
        {renderStepContent()}
      </div>

      <div className="flex justify-between items-center pt-6 border-t">
        <Button
          type="button"
          variant="ghost"
          onClick={prevStep}
          disabled={currentStep === 0}
          className="min-w-[100px]"
        >
          Back
        </Button>

        {currentStep === STEPS.length - 1 ? (
          <Button
            type="submit"
            variant="primary"
            loading={isSubmitting}
            className="min-w-[150px]"
          >
            Submit RSVP
          </Button>
        ) : (
          <Button
            type="button"
            variant="primary"
            onClick={nextStep}
            className="min-w-[100px]"
          >
            Next
          </Button>
        )}
      </div>
    </form>
  )
}