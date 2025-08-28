'use client'

import { useState, useEffect, useRef } from 'react'
import { z } from 'zod'
import { InviteRecord, InviteRSVPRecord } from '@/features/rsvp/repo/rsvp.repository'

interface RSVPFormProps {
  invite: InviteRecord
  existingRSVP: InviteRSVPRecord | null
  onSubmit: (data: RSVPFormData) => Promise<void>
  onUpdate: (data: RSVPFormData) => Promise<void>
  isSubmitting: boolean
}

interface RSVPFormData {
  guestName: string
  attending: boolean
  partySize: number
  dietaryRestrictions?: string
  notes?: string
}

// Validation schema
const rsvpSchema = z.object({
  guestName: z.string().min(1, 'Guest name is required').max(100, 'Name is too long'),
  attending: z.boolean(),
  partySize: z.number().min(1, 'Party size must be at least 1').max(20, 'Party size cannot exceed 20'),
  dietaryRestrictions: z.string().max(500, 'Dietary restrictions are too long').optional(),
  notes: z.string().max(1000, 'Notes are too long').optional()
})

export function RSVPForm({ invite, existingRSVP, onSubmit, onUpdate, isSubmitting }: RSVPFormProps) {
  const [formData, setFormData] = useState<RSVPFormData>({
    guestName: existingRSVP?.email || invite.email || '',
    attending: existingRSVP ? (existingRSVP.status === 'accepted') : true,
    partySize: existingRSVP?.partySize || 1,
    dietaryRestrictions: '',
    notes: existingRSVP?.notes || ''
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  
  const firstInputRef = useRef<HTMLInputElement>(null)
  const attendingYesRef = useRef<HTMLInputElement>(null)
  const attendingNoRef = useRef<HTMLInputElement>(null)

  // Focus first input on mount
  useEffect(() => {
    setTimeout(() => {
      firstInputRef.current?.focus()
    }, 100)
  }, [])

  // Validate form data
  const validateForm = (): boolean => {
    try {
      // Validate party size against invite limit
      const validatedData = rsvpSchema.parse({
        ...formData,
        partySize: formData.attending ? formData.partySize : 0
      })

      // Additional validation for party size limit (fixed max of 10)
      const MAX_PARTY = 10
      if (formData.attending && formData.partySize > MAX_PARTY) {
        setErrors({ partySize: `Party size cannot exceed ${MAX_PARTY}` })
        return false
      }

      setErrors({})
      return true
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {}
        error.issues.forEach((issue) => {
          const key = issue.path[0]
          if (key) newErrors[String(key)] = issue.message
        })
        setErrors(newErrors)
      }
      return false
    }
  }

  // Handle input changes
  const handleInputChange = (field: keyof RSVPFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setTouched(prev => ({ ...prev, [field]: true }))
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  // Handle form submission
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    
    if (!validateForm()) {
      // Focus first error field
      const firstErrorField = Object.keys(errors)[0]
      if (firstErrorField) {
        const errorElement = document.getElementById(firstErrorField)
        errorElement?.focus()
      }
      return
    }

    try {
      if (existingRSVP) {
        await onUpdate(formData)
      } else {
        await onSubmit(formData)
      }
    } catch (error) {
      console.error('Form submission error:', error)
    }
  }

  // Handle attending status change
  const handleAttendingChange = (attending: boolean) => {
    handleInputChange('attending', attending)
    
    // Reset party size to 1 when switching to attending
    if (attending && formData.partySize === 0) {
      handleInputChange('partySize', 1)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-8">
      <form onSubmit={handleSubmit} noValidate>
        {/* Guest Name */}
        <div className="mb-6">
          <label htmlFor="guestName" className="block text-sm font-medium text-gray-700 mb-2">
            Your Name *
          </label>
          <input
            ref={firstInputRef}
            type="text"
            id="guestName"
            value={formData.guestName}
            onChange={(e) => handleInputChange('guestName', e.target.value)}
            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.guestName ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Enter your full name"
            aria-describedby={errors.guestName ? 'guestName-error' : undefined}
            aria-invalid={!!errors.guestName}
            required
          />
          {errors.guestName && (
            <p id="guestName-error" className="text-red-500 text-sm mt-1" role="alert">
              {errors.guestName}
            </p>
          )}
        </div>

        {/* Attending Status */}
        <fieldset className="mb-6">
          <legend className="block text-sm font-medium text-gray-700 mb-3">
            Will you be attending? *
          </legend>
          <div className="space-y-3">
            <div className="flex items-center">
              <input
                ref={attendingYesRef}
                type="radio"
                id="attending-yes"
                name="attending"
                checked={formData.attending === true}
                onChange={() => handleAttendingChange(true)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                aria-describedby="attending-yes-desc"
              />
              <label htmlFor="attending-yes" className="ml-3 block text-sm font-medium text-gray-700">
                Yes, I'll be there! 🎉
              </label>
            </div>
            <p id="attending-yes-desc" className="ml-7 text-sm text-gray-500">
              We're excited to celebrate with you
            </p>

            <div className="flex items-center">
              <input
                ref={attendingNoRef}
                type="radio"
                id="attending-no"
                name="attending"
                checked={formData.attending === false}
                onChange={() => handleAttendingChange(false)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                aria-describedby="attending-no-desc"
              />
              <label htmlFor="attending-no" className="ml-3 block text-sm font-medium text-gray-700">
                Sorry, I can't make it 😔
              </label>
            </div>
            <p id="attending-no-desc" className="ml-7 text-sm text-gray-500">
              We'll miss you, but we understand
            </p>
          </div>
        </fieldset>

        {/* Party Size (only if attending) */}
        {formData.attending && (
          <div className="mb-6">
            <label htmlFor="partySize" className="block text-sm font-medium text-gray-700 mb-2">
              Number of Guests *
            </label>
            <div className="flex items-center space-x-4">
              <input
                type="number"
                id="partySize"
                min="1"
                max={10}
                value={formData.partySize}
                onChange={(e) => handleInputChange('partySize', parseInt(e.target.value) || 1)}
                className={`w-24 px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.partySize ? 'border-red-500' : 'border-gray-300'
                }`}
                aria-describedby={errors.partySize ? 'partySize-error' : 'partySize-help'}
                aria-invalid={!!errors.partySize}
                required
              />
              <span className="text-sm text-gray-600">
                (Maximum: 10)
              </span>
            </div>
            {errors.partySize ? (
              <p id="partySize-error" className="text-red-500 text-sm mt-1" role="alert">
                {errors.partySize}
              </p>
            ) : (
              <p id="partySize-help" className="text-gray-500 text-sm mt-1">
                Including yourself, how many people will be attending?
              </p>
            )}
          </div>
        )}

        {/* Dietary Restrictions (only if attending) */}
        {formData.attending && (
          <div className="mb-6">
            <label htmlFor="dietaryRestrictions" className="block text-sm font-medium text-gray-700 mb-2">
              Dietary Restrictions or Allergies
            </label>
            <textarea
              id="dietaryRestrictions"
              rows={3}
              value={formData.dietaryRestrictions}
              onChange={(e) => handleInputChange('dietaryRestrictions', e.target.value)}
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical ${
                errors.dietaryRestrictions ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Please let us know about any dietary restrictions, allergies, or special meal requirements..."
              aria-describedby={errors.dietaryRestrictions ? 'dietaryRestrictions-error' : 'dietaryRestrictions-help'}
              aria-invalid={!!errors.dietaryRestrictions}
            />
            {errors.dietaryRestrictions ? (
              <p id="dietaryRestrictions-error" className="text-red-500 text-sm mt-1" role="alert">
                {errors.dietaryRestrictions}
              </p>
            ) : (
              <p id="dietaryRestrictions-help" className="text-gray-500 text-sm mt-1">
                This helps us ensure everyone has a great dining experience
              </p>
            )}
          </div>
        )}

        {/* Additional Notes */}
        <div className="mb-8">
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
            Additional Notes
          </label>
          <textarea
            id="notes"
            rows={4}
            value={formData.notes}
            onChange={(e) => handleInputChange('notes', e.target.value)}
            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical ${
              errors.notes ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Any special requests, questions, or messages for the couple..."
            aria-describedby={errors.notes ? 'notes-error' : 'notes-help'}
            aria-invalid={!!errors.notes}
          />
          {errors.notes ? (
            <p id="notes-error" className="text-red-500 text-sm mt-1" role="alert">
              {errors.notes}
            </p>
          ) : (
            <p id="notes-help" className="text-gray-500 text-sm mt-1">
              {formData.notes?.length || 0}/1000 characters
            </p>
          )}
        </div>

        {/* Submit Button */}
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500">
            * Required fields
          </div>
          
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center"
          >
            {isSubmitting ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                {existingRSVP ? 'Updating...' : 'Submitting...'}
              </>
            ) : (
              <>
                {existingRSVP ? 'Update RSVP' : 'Submit RSVP'}
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </>
            )}
          </button>
        </div>

        {/* Existing RSVP Notice */}
        {existingRSVP && (
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-blue-800 font-medium">You have already responded to this invitation</p>
            </div>
            <p className="text-blue-700 text-sm mt-1">
              You can update your response using the form above. Your previous response was submitted on {new Date(existingRSVP.createdAt).toLocaleDateString()}.
            </p>
          </div>
        )}
      </form>
    </div>
  )
}
