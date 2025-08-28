'use client'

import { useState, useEffect, useRef } from 'react'
import { z } from 'zod'
import { InviteRecord, InviteRSVPRecord } from '@/features/rsvp/repo/rsvp.repository'
import { RSVPForm } from './components/RSVPForm'
import { RSVPConfirmation } from './components/RSVPConfirmation'
import { LoadingSpinner } from './components/LoadingSpinner'

interface RSVPPageClientProps {
  invite: InviteRecord
  existingRSVP: InviteRSVPRecord | null
  inviteToken: string
}

export function RSVPPageClient({ invite, existingRSVP, inviteToken }: RSVPPageClientProps) {
  const [currentRSVP, setCurrentRSVP] = useState<InviteRSVPRecord | null>(existingRSVP)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [showConfirmation, setShowConfirmation] = useState(false)
  
  // Refs for focus management
  const mainContentRef = useRef<HTMLDivElement>(null)
  const errorRef = useRef<HTMLDivElement>(null)

  // Handle client-side hydration
  useEffect(() => {
    setIsLoading(false)
    
    // Check for existing RSVP on page refresh
    const checkExistingRSVP = async () => {
      try {
        const response = await fetch(`/api/rsvp?inviteId=${invite.id}`)
        if (response.ok) {
          const result = await response.json()
          if (result.success && result.data) {
            setCurrentRSVP(result.data)
          }
        }
      } catch (error) {
        console.warn('Failed to check existing RSVP:', error)
      }
    }

    // Only check if we don't already have an RSVP
    if (!existingRSVP) {
      checkExistingRSVP()
    }
  }, [invite.id, existingRSVP])

  // Handle RSVP submission
  const handleRSVPSubmit = async (rsvpData: {
    guestName: string
    attending: boolean
    partySize: number
    dietaryRestrictions?: string
    notes?: string
  }) => {
    setIsSubmitting(true)
    setSubmitError(null)

    try {
      // Optimistic update
      const optimisticRSVP: InviteRSVPRecord = {
        id: 'temp-' + Date.now(),
        userId: invite.userId,
        inviteId: invite.id,
        email: invite.email,
        status: rsvpData.attending ? 'accepted' : 'declined',
        partySize: rsvpData.partySize,
        notes: rsvpData.notes || undefined,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      setCurrentRSVP(optimisticRSVP)
      setShowConfirmation(true)

      // Submit to API
      const response = await fetch('/api/rsvp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          inviteId: inviteToken,
          email: invite.email,
          status: rsvpData.attending ? 'accepted' : 'declined',
          partySize: rsvpData.partySize,
          notes: rsvpData.notes
        })
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error?.message || 'Failed to submit RSVP')
      }

      // Update with real data from server
      setCurrentRSVP(result.data)

      // Announce success to screen readers
      const announcement = document.createElement('div')
      announcement.setAttribute('aria-live', 'polite')
      announcement.setAttribute('aria-atomic', 'true')
      announcement.className = 'sr-only'
      announcement.textContent = 'RSVP submitted successfully'
      document.body.appendChild(announcement)
      
      setTimeout(() => {
        document.body.removeChild(announcement)
      }, 1000)

    } catch (error) {
      console.error('RSVP submission error:', error)
      
      // Revert optimistic update
      setCurrentRSVP(existingRSVP)
      setShowConfirmation(false)
      
      // Set error message
      const errorMessage = error instanceof Error ? error.message : 'Failed to submit RSVP. Please try again.'
      setSubmitError(errorMessage)

      // Focus error message for accessibility
      setTimeout(() => {
        errorRef.current?.focus()
      }, 100)

    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle RSVP update (for existing RSVPs)
  const handleRSVPUpdate = async (rsvpData: {
    guestName: string
    attending: boolean
    partySize: number
    dietaryRestrictions?: string
    notes?: string
  }) => {
    // For now, treat updates the same as new submissions
    // In a real implementation, you might have a separate update endpoint
    await handleRSVPSubmit(rsvpData)
  }

  // Reset form (allow user to change their response)
  const handleResetForm = () => {
    setCurrentRSVP(null)
    setShowConfirmation(false)
    setSubmitError(null)
    
    // Focus main content for accessibility
    setTimeout(() => {
      mainContentRef.current?.focus()
    }, 100)
  }

  if (isLoading) {
    return <LoadingSpinner />
  }

  return (
    <div ref={mainContentRef} tabIndex={-1} className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Wedding RSVP
          </h1>
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <p className="text-xl text-gray-700 mb-2">
              Dear <span className="font-semibold">{invite.email || 'Guest'}</span>,
            </p>
            <p className="text-gray-600">
              You have been invited to a special wedding celebration. 
              Please let us know if you'll be able to join us!
            </p>
          </div>
        </div>

        {/* Error Message */}
        {submitError && (
          <div 
            ref={errorRef}
            tabIndex={-1}
            className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6"
            role="alert"
            aria-live="assertive"
          >
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-red-800 font-medium">Error submitting RSVP</p>
            </div>
            <p className="text-red-700 text-sm mt-1">{submitError}</p>
            <button
              onClick={() => setSubmitError(null)}
              className="mt-2 text-red-600 hover:text-red-800 text-sm underline focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 rounded"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Main Content */}
        {currentRSVP && showConfirmation ? (
          <RSVPConfirmation 
            rsvp={currentRSVP}
            invite={invite}
            onEdit={handleResetForm}
            isSubmitting={isSubmitting}
          />
        ) : (
          <RSVPForm
            invite={invite}
            existingRSVP={currentRSVP}
            onSubmit={handleRSVPSubmit}
            onUpdate={handleRSVPUpdate}
            isSubmitting={isSubmitting}
          />
        )}

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>
            Having trouble with this form? Please contact the couple directly.
          </p>
          <p className="mt-1">
            Powered by <span className="font-semibold">Planr</span>
          </p>
        </div>
      </div>

      {/* Live region for announcements */}
      <div aria-live="polite" aria-atomic="true" className="sr-only" id="rsvp-announcements">
        {/* Dynamic announcements will be inserted here */}
      </div>
    </div>
  )
}
