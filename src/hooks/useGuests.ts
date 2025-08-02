'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase, logActivity } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { Guest, GuestInsert, GuestUpdate, GuestCategory, RSVPStatus } from '@/types/database'

// =============================================
// GUEST MANAGEMENT HOOK
// =============================================
// Bulletproof guest management with comprehensive error handling

export const GUEST_CATEGORIES: Array<{ 
  value: GuestCategory; 
  label: string; 
  icon: string; 
  color: string; 
  description: string 
}> = [
  { value: 'family', label: 'Family', icon: '👨‍👩‍👧‍👦', color: '#f87171', description: 'Immediate and extended family' },
  { value: 'friends', label: 'Friends', icon: '👫', color: '#60a5fa', description: 'Close friends and social circle' },
  { value: 'wedding_party', label: 'Wedding Party', icon: '💐', color: '#a78bfa', description: 'Bridesmaids, groomsmen, etc.' },
  { value: 'colleagues', label: 'Colleagues', icon: '👔', color: '#34d399', description: 'Work friends and colleagues' },
  { value: 'plus_ones', label: 'Plus Ones', icon: '➕', color: '#fbbf24', description: 'Guest plus ones and dates' },
  { value: 'children', label: 'Children', icon: '👶', color: '#fb7185', description: 'Kids under 18' },
  { value: 'vendors', label: 'Vendors', icon: '🏪', color: '#6b7280', description: 'Wedding vendors and staff' },
]

export const RSVP_STATUSES: Array<{ 
  value: RSVPStatus; 
  label: string; 
  color: string;
  description: string 
}> = [
  { value: 'pending', label: 'Pending', color: '#6b7280', description: 'Invitation sent, awaiting response' },
  { value: 'attending', label: 'Attending', color: '#10b981', description: 'Confirmed attending' },
  { value: 'not_attending', label: 'Not Attending', color: '#ef4444', description: 'Declined invitation' },
  { value: 'maybe', label: 'Maybe', color: '#f59e0b', description: 'Tentative response' },
  { value: 'no_response', label: 'No Response', color: '#9ca3af', description: 'No response received' },
]

interface GuestStats {
  totalGuests: number
  totalInvited: number
  attendingGuests: number
  notAttendingGuests: number
  pendingResponses: number
  adultGuests: number
  childGuests: number
  totalMealsNeeded: number
  categoryBreakdown: Record<GuestCategory, number>
  rsvpBreakdown: Record<RSVPStatus, number>
}

export function useGuests() {
  const [guests, setGuests] = useState<Guest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)

  const { user, couple } = useAuth()

  // Generate unique invite code
  const generateInviteCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let code = ''
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return code
  }

  // Load guests with comprehensive error handling
  const loadGuests = useCallback(async () => {
    if (!couple?.id) {
      console.log('🔧 useGuests: No couple ID, clearing guests')
      setGuests([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      console.log('🔧 useGuests: Loading guests for couple:', couple.id)

      // Add timeout protection
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Guest query timeout - check database connection')), 10000)
      )

      const guestPromise = supabase
        .from('wedding_guests')
        .select(`
          id, first_name, last_name, email, phone, 
          address, city, state, zip_code, country,
          category, rsvp_status, rsvp_date, rsvp_notes,
          is_adult, age_group, dietary_restrictions, accessibility_needs,
          plus_one_allowed, plus_one_name, plus_one_attending,
          invitation_sent_date, save_the_date_sent, thank_you_sent,
          table_number, meal_choice, gift_received, gift_description,
          relationship_to_couple, relationship_notes,
          created_at, updated_at
        `)
        .eq('couple_id', couple.id)
        .order('last_name', { ascending: true })
        .order('first_name', { ascending: true })

      const result = await Promise.race([guestPromise, timeoutPromise]) as any
      const { data, error: guestError } = result

      if (guestError) {
        console.error('🚨 Database error loading guests:', guestError)
        throw new Error(`Database error: ${guestError.message}`)
      }

      console.log('✅ useGuests: Successfully loaded guests:', data?.length || 0)
      setGuests(data || [])
      setRetryCount(0) // Reset retry count on success
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load guests'
      console.error('🚨 Exception loading guests:', errorMessage)
      
      // Implement retry logic for transient errors
      if (retryCount < 3 && (errorMessage.includes('timeout') || errorMessage.includes('network'))) {
        console.log(`🔄 Retrying guest load (attempt ${retryCount + 1}/3)...`)
        setRetryCount(prev => prev + 1)
        setTimeout(() => loadGuests(), 1000 * (retryCount + 1)) // Exponential backoff
        return
      }
      
      setError(errorMessage)
      setGuests([]) // Ensure we have empty array on error
    } finally {
      setLoading(false)
    }
  }, [couple?.id, retryCount])

  // Load guests on mount and couple change
  useEffect(() => {
    loadGuests()
  }, [loadGuests])

  // Add guest with bulletproof error handling
  const addGuest = useCallback(async (guestData: Omit<GuestInsert, 'couple_id'>) => {
    console.log('👥 addGuest called with:', guestData)
    
    if (!couple?.id) {
      throw new Error('No couple profile found. Please complete your profile first.')
    }

    if (!user?.id) {
      throw new Error('Please log in to add guests.')
    }

    try {
      console.log('📤 Creating guest with couple ID:', couple.id)
      
      // Generate unique invite code
      let inviteCode = ''
      let codeIsUnique = false
      
      // Keep generating until we get a unique code
      while (!codeIsUnique) {
        inviteCode = generateInviteCode()
        const { data: existingGuest } = await supabase
          .from('wedding_guests')
          .select('id')
          .eq('invite_code', inviteCode)
          .single()
        
        if (!existingGuest) {
          codeIsUnique = true
        }
      }

      // Prepare guest data with all required fields and sensible defaults
      const guestDataWithDefaults: GuestInsert = {
        ...guestData,
        couple_id: couple.id,
        invite_code: inviteCode,
        // Ensure all required fields have defaults
        country: guestData.country || 'US',
        rsvp_status: guestData.rsvp_status || 'pending',
        is_adult: guestData.is_adult ?? true,
        age_group: guestData.age_group || (guestData.is_adult ? 'adult' : 'child'),
        plus_one_allowed: guestData.plus_one_allowed ?? false,
        plus_one_attending: guestData.plus_one_attending ?? false,
        save_the_date_sent: guestData.save_the_date_sent ?? false,
        invitation_sent_date: guestData.invitation_sent_date || null,
        thank_you_sent: guestData.thank_you_sent ?? false,
        gift_received: guestData.gift_received ?? false,
      }
      
      // Insert guest with comprehensive error handling
      const { data, error } = await supabase
        .from('wedding_guests')
        .insert(guestDataWithDefaults)
        .select()
        .single()

      if (error) {
        console.error('❌ Database error creating guest:', error)
        throw new Error(`Failed to save guest: ${error.message}`)
      }
      
      if (!data) {
        console.error('❌ No guest data returned from creation')
        throw new Error('Guest was not created properly. Please try again.')
      }

      console.log('✅ Guest created successfully:', data.id)

      // Log activity (bulletproof - never fails the main operation)
      try {
        await logActivity(
          couple.id,
          user.id,
          'guest_added',
          'guest',
          data.id,
          `${data.first_name} ${data.last_name}`,
          {
            category: data.category,
            email: data.email,
            rsvp_status: data.rsvp_status
          }
        )
      } catch (activityError) {
        console.warn('⚠️ Activity logging failed but guest was created:', activityError)
      }

      // Update local state
      setGuests(prev => [data, ...prev])
      return data
      
    } catch (err) {
      console.error('❌ Error in addGuest:', err)
      throw err
    }
  }, [couple?.id, user?.id])

  // Update guest with error handling
  const updateGuest = useCallback(async (guestId: string, updates: Partial<GuestUpdate>) => {
    if (!couple?.id || !user?.id) {
      throw new Error('Authentication required to update guest')
    }

    try {
      const { data, error } = await supabase
        .from('wedding_guests')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', guestId)
        .eq('couple_id', couple.id) // Security: ensure guest belongs to couple
        .select()
        .single()

      if (error) {
        console.error('❌ Error updating guest:', error)
        throw new Error(`Failed to update guest: ${error.message}`)
      }

      if (!data) {
        throw new Error('Guest not found or you do not have permission to update it')
      }

      // Log activity (bulletproof)
      try {
        await logActivity(
          couple.id,
          user.id,
          'guest_updated',
          'guest',
          data.id,
          `${data.first_name} ${data.last_name}`,
          { updates }
        )
      } catch (activityError) {
        console.warn('⚠️ Activity logging failed but guest was updated:', activityError)
      }

      // Update local state
      setGuests(prev => prev.map(guest => 
        guest.id === guestId ? data : guest
      ))
      
      return data
    } catch (err) {
      console.error('❌ Error updating guest:', err)
      throw err
    }
  }, [couple?.id, user?.id])

  // Delete guest with error handling
  const deleteGuest = useCallback(async (guestId: string) => {
    if (!couple?.id || !user?.id) {
      throw new Error('Authentication required to delete guest')
    }

    try {
      // Get guest name for activity logging
      const guest = guests.find(g => g.id === guestId)
      
      const { error } = await supabase
        .from('wedding_guests')
        .delete()
        .eq('id', guestId)
        .eq('couple_id', couple.id) // Security: ensure guest belongs to couple

      if (error) {
        console.error('❌ Error deleting guest:', error)
        throw new Error(`Failed to delete guest: ${error.message}`)
      }

      // Log activity (bulletproof)
      try {
        await logActivity(
          couple.id,
          user.id,
          'guest_removed',
          'guest',
          guestId,
          guest ? `${guest.first_name} ${guest.last_name}` : 'Unknown Guest',
          { reason: 'deleted' }
        )
      } catch (activityError) {
        console.warn('⚠️ Activity logging failed but guest was deleted:', activityError)
      }

      // Update local state
      setGuests(prev => prev.filter(guest => guest.id !== guestId))
      return true
    } catch (err) {
      console.error('❌ Error deleting guest:', err)
      throw err
    }
  }, [couple?.id, user?.id, guests])

  // Bulk RSVP update function
  const updateRSVP = useCallback(async (guestId: string, rsvpStatus: RSVPStatus, rsvpNotes?: string) => {
    const updates: Partial<GuestUpdate> = {
      rsvp_status: rsvpStatus,
      rsvp_date: new Date().toISOString(),
      rsvp_notes: rsvpNotes || null
    }
    
    return await updateGuest(guestId, updates)
  }, [updateGuest])

  // Send invitation function
  const sendInvitation = useCallback(async (guestIds: string[]) => {
    if (!couple?.id || !user?.id) {
      throw new Error('Authentication required to send invitations')
    }

    try {
      const invitationDate = new Date().toISOString()
      
      // Update multiple guests
      const { data, error } = await supabase
        .from('wedding_guests')
        .update({ 
          invitation_sent_date: invitationDate,
          updated_at: invitationDate
        })
        .in('id', guestIds)
        .eq('couple_id', couple.id)
        .select()

      if (error) {
        throw new Error(`Failed to send invitations: ${error.message}`)
      }

      // Log activity for each guest
      for (const guest of data) {
        try {
          await logActivity(
            couple.id,
            user.id,
            'invitation_sent',
            'guest',
            guest.id,
            `${guest.first_name} ${guest.last_name}`
          )
        } catch (activityError) {
          console.warn('⚠️ Activity logging failed for invitation:', activityError)
        }
      }

      // Update local state
      setGuests(prev => prev.map(guest => 
        guestIds.includes(guest.id) 
          ? { ...guest, invitation_sent_date: invitationDate }
          : guest
      ))

      return data
    } catch (err) {
      console.error('❌ Error sending invitations:', err)
      throw err
    }
  }, [couple?.id, user?.id])

  // Calculate guest statistics
  const guestStats: GuestStats = {
    totalGuests: guests.length,
    totalInvited: guests.filter(g => g.invitation_sent_date).length,
    attendingGuests: guests.filter(g => g.rsvp_status === 'attending').length,
    notAttendingGuests: guests.filter(g => g.rsvp_status === 'not_attending').length,
    pendingResponses: guests.filter(g => g.rsvp_status === 'pending').length,
    adultGuests: guests.filter(g => g.is_adult).length,
    childGuests: guests.filter(g => !g.is_adult).length,
    totalMealsNeeded: guests.filter(g => g.rsvp_status === 'attending').length + 
      guests.filter(g => g.rsvp_status === 'attending' && g.plus_one_attending).length,
    categoryBreakdown: guests.reduce((acc, guest) => {
      acc[guest.category] = (acc[guest.category] || 0) + 1
      return acc
    }, {} as Record<GuestCategory, number>),
    rsvpBreakdown: guests.reduce((acc, guest) => {
      acc[guest.rsvp_status] = (acc[guest.rsvp_status] || 0) + 1
      return acc
    }, {} as Record<RSVPStatus, number>)
  }

  return {
    guests,
    loading,
    error,
    guestStats,
    addGuest,
    updateGuest,
    deleteGuest,
    updateRSVP,
    sendInvitation,
    refreshGuests: loadGuests,
    retryCount,
    // Helper functions
    getGuestsByCategory: (category: GuestCategory) => 
      guests.filter(g => g.category === category),
    getGuestsByRSVP: (status: RSVPStatus) => 
      guests.filter(g => g.rsvp_status === status),
    getAttendingGuests: () => 
      guests.filter(g => g.rsvp_status === 'attending'),
    getPendingGuests: () => 
      guests.filter(g => g.rsvp_status === 'pending'),
  }
}