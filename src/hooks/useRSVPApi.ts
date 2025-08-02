import { useState } from 'react'
import { fetchWithCSRF } from '@/lib/csrf-client'

interface RSVPValidateResponse {
  success: boolean
  data?: {
    guest: any
    mealOptions: any[]
    sessionId: string
  }
  error?: {
    message: string
    code: string
  }
}

interface RSVPSubmitResponse {
  success: boolean
  data?: {
    responseId: string
    guest: any
    message: string
  }
  error?: {
    message: string
    code: string
  }
}

export function useRSVPApi() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const validateInviteCode = async (inviteCode: string): Promise<RSVPValidateResponse | null> => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetchWithCSRF('/api/rsvp/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ inviteCode }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error?.message || 'Failed to validate invite code')
        return null
      }

      return data
    } catch (err) {
      console.error('Error validating invite code:', err)
      setError('Network error. Please try again.')
      return null
    } finally {
      setLoading(false)
    }
  }

  const submitRSVP = async (rsvpData: any): Promise<RSVPSubmitResponse | null> => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetchWithCSRF('/api/rsvp/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(rsvpData),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error?.message || 'Failed to submit RSVP')
        return null
      }

      return data
    } catch (err) {
      console.error('Error submitting RSVP:', err)
      setError('Network error. Please try again.')
      return null
    } finally {
      setLoading(false)
    }
  }

  const updateRSVP = async (inviteCode: string, rsvpData: any): Promise<RSVPSubmitResponse | null> => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetchWithCSRF(`/api/rsvp/${inviteCode}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(rsvpData),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error?.message || 'Failed to update RSVP')
        return null
      }

      return data
    } catch (err) {
      console.error('Error updating RSVP:', err)
      setError('Network error. Please try again.')
      return null
    } finally {
      setLoading(false)
    }
  }

  const getGuestInfo = async (inviteCode: string): Promise<any | null> => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetchWithCSRF(`/api/rsvp/${inviteCode}`, {
        method: 'GET',
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error?.message || 'Failed to get guest info')
        return null
      }

      return data
    } catch (err) {
      console.error('Error getting guest info:', err)
      setError('Network error. Please try again.')
      return null
    } finally {
      setLoading(false)
    }
  }

  const verifySession = async (sessionId: string): Promise<any | null> => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetchWithCSRF(`/api/rsvp/session/${sessionId}`, {
        method: 'GET',
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error?.message || 'Failed to verify session')
        return null
      }

      return data
    } catch (err) {
      console.error('Error verifying session:', err)
      setError('Network error. Please try again.')
      return null
    } finally {
      setLoading(false)
    }
  }

  return {
    loading,
    error,
    validateInviteCode,
    submitRSVP,
    updateRSVP,
    getGuestInfo,
    verifySession,
  }
}