'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import SecureRSVPForm from '@/components/rsvp/SecureRSVPForm'
import InviteCodeInput from '@/components/rsvp/InviteCodeInput'
import { Button } from '@/components/ui/button'

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

export default function RSVPPage() {
  const params = useParams()
  const router = useRouter()
  const supabase = createClientComponentClient()
  
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [guest, setGuest] = useState<Guest | null>(null)
  const [mealOptions, setMealOptions] = useState<MealOption[]>([])
  const [showCodeInput, setShowCodeInput] = useState(false)
  const [validatingCode, setValidatingCode] = useState(false)
  
  const inviteCode = params.code as string

  useEffect(() => {
    if (inviteCode && inviteCode !== 'enter-code') {
      validateAndLoadGuest(inviteCode)
    } else {
      setShowCodeInput(true)
      setLoading(false)
    }
  }, [inviteCode])

  const validateAndLoadGuest = async (code: string) => {
    try {
      setLoading(true)
      setError(null)

      // Track RSVP access
      const { data: sessionData, error: sessionError } = await supabase
        .rpc('track_rsvp_access', {
          p_invite_code: code.toUpperCase(),
          p_ip_address: null, // Will be set by the function
          p_user_agent: navigator.userAgent
        })

      if (sessionError || !sessionData) {
        setError('Invalid invite code. Please check and try again.')
        setShowCodeInput(true)
        return
      }

      // Load guest data
      const { data: guestData, error: guestError } = await supabase
        .from('wedding_guests')
        .select('*')
        .eq('invite_code', code.toUpperCase())
        .single()

      if (guestError || !guestData) {
        setError('Guest not found. Please contact the couple.')
        setShowCodeInput(true)
        return
      }

      // Load meal options
      const { data: meals, error: mealsError } = await supabase
        .from('meal_options')
        .select('*')
        .eq('couple_id', guestData.couple_id)
        .eq('is_active', true)
        .order('sort_order')

      if (mealsError) {
        console.error('Error loading meal options:', mealsError)
      }

      // Transform guest data
      const transformedGuest: Guest = {
        id: guestData.id,
        firstName: guestData.first_name,
        lastName: guestData.last_name,
        email: guestData.email,
        phone: guestData.phone,
        plusOneAllowed: guestData.plus_one_allowed,
        mealChoice: guestData.meal_choice,
        dietaryRestrictions: guestData.dietary_restrictions,
        rsvpStatus: guestData.rsvp_status,
        plusOneName: guestData.plus_one_name,
        plusOneMealChoice: guestData.plus_one_meal_choice,
        plusOneDietaryRestrictions: guestData.plus_one_dietary_restrictions
      }

      setGuest(transformedGuest)
      setMealOptions(meals || [])
      
      // Set session cookie
      document.cookie = `rsvp_session=${sessionData.session_token}; path=/; max-age=7200; SameSite=Strict`
    } catch (err) {
      console.error('Error validating guest:', err)
      setError('Something went wrong. Please try again.')
      setShowCodeInput(true)
    } finally {
      setLoading(false)
    }
  }

  const handleCodeSubmit = async (code: string) => {
    setValidatingCode(true)
    // Navigate to the URL with the code
    router.push(`/rsvp/${code}`)
  }

  const handleRSVPSubmit = async (data: any) => {
    try {
      // Submit RSVP response
      const { error: submitError } = await supabase.rpc('submit_rsvp_response', {
        p_guest_id: guest!.id,
        p_attending: data.attending,
        p_meal_choice: data.attending ? data.mealChoice : null,
        p_dietary_restrictions: data.dietaryRestrictions,
        p_plus_one_attending: data.plusOneAttending,
        p_plus_one_name: data.plusOneName,
        p_plus_one_meal_choice: data.plusOneMealChoice,
        p_plus_one_dietary_restrictions: data.plusOneDietaryRestrictions,
        p_notes: data.notes,
        p_email: data.email,
        p_phone: data.phone
      })

      if (submitError) {
        throw submitError
      }

      // Navigate to confirmation page
      router.push(`/rsvp/${inviteCode}/confirm`)
    } catch (err) {
      console.error('Error submitting RSVP:', err)
      throw new Error('Failed to submit RSVP. Please try again.')
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ink"></div>
        <p className="mt-4 text-gray-600">Loading your invitation...</p>
      </div>
    )
  }

  if (showCodeInput || !guest) {
    return (
      <InviteCodeInput
        onSubmit={handleCodeSubmit}
        error={error || undefined}
        loading={validatingCode}
      />
    )
  }

  return (
    <div>
      {guest.rsvpStatus === 'confirmed' && (
        <div className="mb-6 p-4 bg-wedding-sage/20 border border-wedding-sage rounded-lg">
          <p className="text-sm font-medium text-wedding-sage flex items-center gap-2">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            You've already submitted your RSVP. You can update it below.
          </p>
        </div>
      )}

      <SecureRSVPForm
        guest={guest}
        mealOptions={mealOptions}
        onSubmit={handleRSVPSubmit}
        initialData={
          guest.rsvpStatus === 'confirmed'
            ? {
                attending: guest.rsvpStatus === 'confirmed',
                email: guest.email || '',
                phone: guest.phone || '',
                mealChoice: guest.mealChoice || '',
                dietaryRestrictions: guest.dietaryRestrictions || '',
                plusOneAttending: !!guest.plusOneName,
                plusOneName: guest.plusOneName || '',
                plusOneMealChoice: guest.plusOneMealChoice || '',
                plusOneDietaryRestrictions: guest.plusOneDietaryRestrictions || ''
              }
            : undefined
        }
      />
    </div>
  )
}