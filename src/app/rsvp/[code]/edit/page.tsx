'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import RSVPForm from '@/components/rsvp/RSVPForm'

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
  rsvpNotes?: string
}

interface MealOption {
  id: string
  name: string
  description: string
  category: string
}

export default function EditRSVPPage() {
  const params = useParams()
  const router = useRouter()
  const supabase = createClientComponentClient()
  
  const [loading, setLoading] = useState(true)
  const [guest, setGuest] = useState<Guest | null>(null)
  const [mealOptions, setMealOptions] = useState<MealOption[]>([])
  const [initialData, setInitialData] = useState<any>(null)
  
  const inviteCode = params.code as string

  useEffect(() => {
    loadGuestData()
  }, [])

  const loadGuestData = async () => {
    try {
      // Verify session cookie
      const cookies = document.cookie.split(';')
      const sessionCookie = cookies.find(c => c.trim().startsWith('rsvp_session='))
      
      if (!sessionCookie) {
        router.push(`/rsvp/${inviteCode}`)
        return
      }

      // Load guest data
      const { data: guestData, error: guestError } = await supabase
        .from('wedding_guests')
        .select('*')
        .eq('invite_code', inviteCode.toUpperCase())
        .single()

      if (guestError || !guestData) {
        router.push(`/rsvp/${inviteCode}`)
        return
      }

      // Check if guest has already responded
      if (guestData.rsvp_status !== 'confirmed' && guestData.rsvp_status !== 'declined') {
        router.push(`/rsvp/${inviteCode}`)
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

      // Load the latest RSVP response
      const { data: rsvpData, error: rsvpError } = await supabase
        .from('rsvp_responses')
        .select('*')
        .eq('guest_id', guestData.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

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
        plusOneDietaryRestrictions: guestData.plus_one_dietary_restrictions,
        rsvpNotes: guestData.rsvp_notes
      }

      // Set initial form data
      const initial = {
        attending: guestData.rsvp_status === 'confirmed',
        email: guestData.email || '',
        phone: guestData.phone || '',
        mealChoice: guestData.meal_choice || '',
        dietaryRestrictions: guestData.dietary_restrictions || '',
        plusOneAttending: !!guestData.plus_one_name,
        plusOneName: guestData.plus_one_name || '',
        plusOneMealChoice: guestData.plus_one_meal_choice || '',
        plusOneDietaryRestrictions: guestData.plus_one_dietary_restrictions || '',
        notes: rsvpData?.notes || guestData.rsvp_notes || ''
      }

      setGuest(transformedGuest)
      setMealOptions(meals || [])
      setInitialData(initial)
    } catch (err) {
      console.error('Error loading guest data:', err)
      router.push(`/rsvp/${inviteCode}`)
    } finally {
      setLoading(false)
    }
  }

  const handleRSVPSubmit = async (data: any) => {
    try {
      // Submit updated RSVP response
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
      console.error('Error updating RSVP:', err)
      throw new Error('Failed to update RSVP. Please try again.')
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ink"></div>
        <p className="mt-4 text-gray-600">Loading your RSVP...</p>
      </div>
    )
  }

  if (!guest || !initialData) {
    return null
  }

  return (
    <div>
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm font-medium text-blue-800 flex items-center gap-2">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
          </svg>
          You're updating your RSVP response
        </p>
      </div>

      <RSVPForm
        guest={guest}
        mealOptions={mealOptions}
        onSubmit={handleRSVPSubmit}
        initialData={initialData}
      />
    </div>
  )
}