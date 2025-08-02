'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Button } from '@/components/ui/button'
import confetti from 'canvas-confetti'

interface GuestDetails {
  firstName: string
  lastName: string
  email: string
  phone: string
  attending: boolean
  mealChoice?: string
  dietaryRestrictions?: string
  plusOneName?: string
  plusOneMealChoice?: string
  weddingDate: string
  weddingTime: string
  venueName: string
  venueAddress: string
}

export default function RSVPConfirmationPage() {
  const params = useParams()
  const router = useRouter()
  const supabase = createClientComponentClient()
  
  const [loading, setLoading] = useState(true)
  const [guestDetails, setGuestDetails] = useState<GuestDetails | null>(null)
  const [showSuccess, setShowSuccess] = useState(false)
  
  const inviteCode = params.code as string

  useEffect(() => {
    loadConfirmationDetails()
  }, [])

  useEffect(() => {
    if (showSuccess && guestDetails?.attending) {
      // Trigger confetti animation for accepted RSVPs
      const duration = 3 * 1000
      const animationEnd = Date.now() + duration
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 }

      function randomInRange(min: number, max: number) {
        return Math.random() * (max - min) + min
      }

      const interval = setInterval(function() {
        const timeLeft = animationEnd - Date.now()

        if (timeLeft <= 0) {
          return clearInterval(interval)
        }

        const particleCount = 50 * (timeLeft / duration)
        
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
        })
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
        })
      }, 250)

      return () => clearInterval(interval)
    }
  }, [showSuccess, guestDetails])

  const loadConfirmationDetails = async () => {
    try {
      // Get guest details from the database
      const { data: guestData, error } = await supabase
        .from('wedding_guests')
        .select(`
          *,
          couples:couple_id (
            wedding_date,
            wedding_time,
            venue_name,
            venue_address
          ),
          meal_options!wedding_guests_meal_choice_fkey (
            name
          ),
          plus_one_meal:meal_options!wedding_guests_plus_one_meal_choice_fkey (
            name
          )
        `)
        .eq('invite_code', inviteCode.toUpperCase())
        .single()

      if (error || !guestData) {
        router.push(`/rsvp/${inviteCode}`)
        return
      }

      const details: GuestDetails = {
        firstName: guestData.first_name,
        lastName: guestData.last_name,
        email: guestData.email,
        phone: guestData.phone,
        attending: guestData.rsvp_status === 'confirmed',
        mealChoice: guestData.meal_options?.name,
        dietaryRestrictions: guestData.dietary_restrictions,
        plusOneName: guestData.plus_one_name,
        plusOneMealChoice: guestData.plus_one_meal?.name,
        weddingDate: guestData.couples.wedding_date,
        weddingTime: guestData.couples.wedding_time,
        venueName: guestData.couples.venue_name,
        venueAddress: guestData.couples.venue_address
      }

      setGuestDetails(details)
      setShowSuccess(true)
    } catch (err) {
      console.error('Error loading confirmation:', err)
      router.push(`/rsvp/${inviteCode}`)
    } finally {
      setLoading(false)
    }
  }

  const handleAddToCalendar = () => {
    if (!guestDetails) return

    const startDate = new Date(`${guestDetails.weddingDate} ${guestDetails.weddingTime}`)
    const endDate = new Date(startDate.getTime() + 5 * 60 * 60 * 1000) // 5 hours later

    const formatDate = (date: Date) => {
      return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
    }

    const event = {
      title: 'Wedding Celebration',
      start: formatDate(startDate),
      end: formatDate(endDate),
      location: `${guestDetails.venueName}, ${guestDetails.venueAddress}`,
      details: 'Looking forward to celebrating with you!'
    }

    const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.title)}&dates=${event.start}/${event.end}&location=${encodeURIComponent(event.location)}&details=${encodeURIComponent(event.details)}`

    window.open(googleCalendarUrl, '_blank')
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ink"></div>
        <p className="mt-4 text-gray-600">Loading confirmation...</p>
      </div>
    )
  }

  if (!guestDetails) {
    return null
  }

  return (
    <div className="text-center space-y-8">
      {/* Success Icon */}
      <div className="flex justify-center">
        <div className={`w-24 h-24 rounded-full flex items-center justify-center ${
          guestDetails.attending ? 'bg-wedding-sage/20' : 'bg-gray-100'
        }`}>
          {guestDetails.attending ? (
            <svg className="w-12 h-12 text-wedding-sage" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg className="w-12 h-12 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          )}
        </div>
      </div>

      {/* Confirmation Message */}
      <div>
        <h1 className="font-playfair text-3xl sm:text-4xl font-semibold text-ink mb-3">
          {guestDetails.attending ? 'See You There!' : 'We\'ll Miss You'}
        </h1>
        <p className="text-lg text-gray-600">
          {guestDetails.attending 
            ? 'Your RSVP has been confirmed. We can\'t wait to celebrate with you!'
            : 'Thank you for letting us know. We\'ll be thinking of you on our special day.'}
        </p>
      </div>

      {/* Response Details */}
      {guestDetails.attending && (
        <div className="bg-gray-50 rounded-lg p-6 text-left max-w-md mx-auto space-y-4">
          <h2 className="font-semibold text-lg text-center mb-4">Your Response Details</h2>
          
          <div>
            <p className="text-sm text-gray-600">Guest</p>
            <p className="font-medium">{guestDetails.firstName} {guestDetails.lastName}</p>
          </div>

          {guestDetails.mealChoice && (
            <div>
              <p className="text-sm text-gray-600">Meal Selection</p>
              <p className="font-medium">{guestDetails.mealChoice}</p>
              {guestDetails.dietaryRestrictions && (
                <p className="text-sm text-gray-600 mt-1">
                  Note: {guestDetails.dietaryRestrictions}
                </p>
              )}
            </div>
          )}

          {guestDetails.plusOneName && (
            <div>
              <p className="text-sm text-gray-600">Plus One</p>
              <p className="font-medium">{guestDetails.plusOneName}</p>
              {guestDetails.plusOneMealChoice && (
                <p className="text-sm text-gray-600">
                  Meal: {guestDetails.plusOneMealChoice}
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Event Details */}
      {guestDetails.attending && (
        <div className="space-y-4">
          <h2 className="font-semibold text-lg">Event Details</h2>
          <div className="text-gray-600 space-y-2">
            <p>
              <strong>Date:</strong> {new Date(guestDetails.weddingDate).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
            <p><strong>Time:</strong> {guestDetails.weddingTime}</p>
            <p><strong>Venue:</strong> {guestDetails.venueName}</p>
            <p><strong>Address:</strong> {guestDetails.venueAddress}</p>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
        {guestDetails.attending && (
          <Button
            onClick={handleAddToCalendar}
            variant="secondary"
            className="min-w-[200px]"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Add to Calendar
          </Button>
        )}
        
        <Button
          onClick={() => router.push(`/rsvp/${inviteCode}/edit`)}
          variant="ghost"
          className="min-w-[200px]"
        >
          Edit Response
        </Button>
      </div>

      {/* Confirmation Email Note */}
      <p className="text-sm text-gray-500 pt-4">
        A confirmation email has been sent to {guestDetails.email}
      </p>
    </div>
  )
}