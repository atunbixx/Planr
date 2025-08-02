'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase, logActivity } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

// =============================================
// TIMELINE MANAGEMENT HOOK
// =============================================
// Wedding day timeline and schedule management

export interface TimelineItem {
  id: string
  couple_id: string
  vendor_id?: string
  title: string
  description?: string
  type: 'ceremony' | 'reception' | 'photo_session' | 'vendor_arrival' | 'vendor_setup' | 'hair_makeup' | 'getting_ready' | 'transportation' | 'meal' | 'speech' | 'dance' | 'special_moment' | 'vendor_breakdown' | 'other'
  start_time: string
  end_time?: string
  duration_minutes?: number
  buffer_time_minutes: number
  location?: string
  notes?: string
  depends_on_item_id?: string
  created_at: string
  updated_at: string
}

export interface TimelineItemInsert {
  vendor_id?: string
  title: string
  description?: string
  type?: 'ceremony' | 'reception' | 'photo_session' | 'vendor_arrival' | 'vendor_setup' | 'hair_makeup' | 'getting_ready' | 'transportation' | 'meal' | 'speech' | 'dance' | 'special_moment' | 'vendor_breakdown' | 'other'
  start_time: string
  end_time?: string
  duration_minutes?: number
  buffer_time_minutes?: number
  location?: string
  notes?: string
  depends_on_item_id?: string
}

export interface TimelineItemUpdate {
  title?: string
  description?: string
  type?: 'ceremony' | 'reception' | 'photo_session' | 'vendor_arrival' | 'vendor_setup' | 'hair_makeup' | 'getting_ready' | 'transportation' | 'meal' | 'speech' | 'dance' | 'special_moment' | 'vendor_breakdown' | 'other'
  start_time?: string
  end_time?: string
  duration_minutes?: number
  buffer_time_minutes?: number
  location?: string
  notes?: string
  depends_on_item_id?: string
}

export const DEFAULT_TIMELINE_ITEMS = [
  // Getting Ready (8:00 AM - 12:00 PM)
  { title: 'Hair and Makeup Begins', type: 'hair_makeup', start_time: '08:00', duration_minutes: 180, buffer_time_minutes: 15, location: 'Bridal Suite', description: 'Hair and makeup for bride and bridal party' },
  { title: 'Photographer Arrives', type: 'vendor_arrival', start_time: '09:00', duration_minutes: 60, buffer_time_minutes: 10, location: 'Getting Ready Location', description: 'Photographer begins getting ready photos' },
  { title: 'Groom Getting Ready', type: 'getting_ready', start_time: '10:00', duration_minutes: 90, buffer_time_minutes: 15, location: 'Groom Suite', description: 'Groom and groomsmen getting ready' },
  { title: 'Bridal Party Getting Ready Photos', type: 'photo_session', start_time: '11:00', duration_minutes: 60, buffer_time_minutes: 10, location: 'Bridal Suite', description: 'Photos of bride getting ready with bridal party' },
  
  // Pre-Ceremony (12:00 PM - 2:00 PM)
  { title: 'Vendor Setup Begins', type: 'vendor_setup', start_time: '12:00', duration_minutes: 120, buffer_time_minutes: 30, location: 'Ceremony Venue', description: 'Florist, decorations, and ceremony setup' },
  { title: 'First Look Photos', type: 'photo_session', start_time: '13:00', duration_minutes: 45, buffer_time_minutes: 15, location: 'Photo Location', description: 'Private first look between couple' },
  { title: 'Wedding Party Photos', type: 'photo_session', start_time: '13:45', duration_minutes: 60, buffer_time_minutes: 15, location: 'Photo Location', description: 'Group photos with wedding party' },
  { title: 'Guest Arrival', type: 'other', start_time: '14:30', duration_minutes: 30, buffer_time_minutes: 10, location: 'Ceremony Venue', description: 'Guests arrive and are seated' },
  
  // Ceremony (3:00 PM - 4:00 PM)
  { title: 'Ceremony Begins', type: 'ceremony', start_time: '15:00', duration_minutes: 45, buffer_time_minutes: 15, location: 'Ceremony Venue', description: 'Wedding ceremony' },
  { title: 'Recessional and Congratulations', type: 'ceremony', start_time: '15:45', duration_minutes: 15, buffer_time_minutes: 10, location: 'Ceremony Venue', description: 'Exit and immediate congratulations' },
  
  // Cocktail Hour (4:00 PM - 5:30 PM)
  { title: 'Cocktail Hour Begins', type: 'reception', start_time: '16:00', duration_minutes: 90, buffer_time_minutes: 15, location: 'Reception Venue', description: 'Cocktails and hors d\'oeuvres for guests' },
  { title: 'Family Photos', type: 'photo_session', start_time: '16:00', duration_minutes: 60, buffer_time_minutes: 15, location: 'Photo Location', description: 'Family portraits and group photos' },
  { title: 'Couple Portraits', type: 'photo_session', start_time: '17:00', duration_minutes: 30, buffer_time_minutes: 10, location: 'Photo Location', description: 'Romantic couple portraits' },
  
  // Reception (5:30 PM - 11:00 PM)
  { title: 'Reception Entrance', type: 'reception', start_time: '17:30', duration_minutes: 15, buffer_time_minutes: 5, location: 'Reception Venue', description: 'Grand entrance of wedding party and couple' },
  { title: 'Welcome Speech', type: 'speech', start_time: '17:45', duration_minutes: 10, buffer_time_minutes: 5, location: 'Reception Venue', description: 'Welcome speech from hosts' },
  { title: 'Dinner Service', type: 'meal', start_time: '18:00', duration_minutes: 90, buffer_time_minutes: 15, location: 'Reception Venue', description: 'Wedding dinner service' },
  { title: 'Toasts and Speeches', type: 'speech', start_time: '19:30', duration_minutes: 30, buffer_time_minutes: 10, location: 'Reception Venue', description: 'Best man, maid of honor, and parent speeches' },
  { title: 'First Dance', type: 'dance', start_time: '20:00', duration_minutes: 5, buffer_time_minutes: 5, location: 'Dance Floor', description: 'Couple\'s first dance' },
  { title: 'Parent Dances', type: 'dance', start_time: '20:05', duration_minutes: 10, buffer_time_minutes: 5, location: 'Dance Floor', description: 'Father-daughter and mother-son dances' },
  { title: 'Open Dancing', type: 'dance', start_time: '20:20', duration_minutes: 100, buffer_time_minutes: 10, location: 'Dance Floor', description: 'Dancing for all guests' },
  { title: 'Cake Cutting', type: 'special_moment', start_time: '21:30', duration_minutes: 15, buffer_time_minutes: 5, location: 'Reception Venue', description: 'Wedding cake cutting ceremony' },
  { title: 'Bouquet and Garter Toss', type: 'special_moment', start_time: '22:00', duration_minutes: 15, buffer_time_minutes: 5, location: 'Reception Venue', description: 'Traditional bouquet and garter toss' },
  { title: 'Last Dance', type: 'dance', start_time: '22:45', duration_minutes: 5, buffer_time_minutes: 5, location: 'Dance Floor', description: 'Final dance of the evening' },
  { title: 'Grand Exit', type: 'special_moment', start_time: '23:00', duration_minutes: 15, buffer_time_minutes: 5, location: 'Venue Exit', description: 'Grand exit with send-off' },
  
  // Cleanup
  { title: 'Vendor Breakdown', type: 'vendor_breakdown', start_time: '23:15', duration_minutes: 60, buffer_time_minutes: 15, location: 'All Venues', description: 'Vendor cleanup and breakdown' }
]

interface TimelineStats {
  totalItems: number
  totalDuration: number
  earliestStart: string
  latestEnd: string
  itemsByType: Record<string, number>
  averageBufferTime: number
  potentialConflicts: number
}

export function useTimeline() {
  const [timelineItems, setTimelineItems] = useState<TimelineItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const { user, couple } = useAuth()

  // Helper function to calculate end time
  const calculateEndTime = (startTime: string, durationMinutes: number, bufferMinutes: number = 0): string => {
    const [hours, minutes] = startTime.split(':').map(Number)
    const startDate = new Date()
    startDate.setHours(hours, minutes, 0, 0)
    
    const endDate = new Date(startDate.getTime() + (durationMinutes + bufferMinutes) * 60000)
    
    return `${endDate.getHours().toString().padStart(2, '0')}:${endDate.getMinutes().toString().padStart(2, '0')}`
  }

  // Load timeline items
  const loadTimeline = useCallback(async () => {
    if (!couple?.id) {
      setTimelineItems([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const { data, error } = await supabase
        .from('timeline_items')
        .select('*')
        .eq('couple_id', couple.id)
        .order('start_time', { ascending: true })

      if (error) {
        throw new Error(`Failed to load timeline: ${error.message}`)
      }

      setTimelineItems(data || [])

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load timeline'
      console.error('Timeline loading error:', errorMessage)
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [couple?.id])

  // Initialize default timeline for new couples
  const initializeDefaultTimeline = useCallback(async () => {
    if (!couple?.id || !user?.id) {
      throw new Error('Authentication required to initialize timeline')
    }

    try {
      const timelineWithCoupleId = DEFAULT_TIMELINE_ITEMS.map(item => ({
        ...item,
        couple_id: couple.id,
        buffer_time_minutes: item.buffer_time_minutes || 15,
        end_time: item.duration_minutes ? calculateEndTime(item.start_time, item.duration_minutes, item.buffer_time_minutes) : undefined
      }))

      const { data, error } = await supabase
        .from('timeline_items')
        .insert(timelineWithCoupleId)
        .select()

      if (error) {
        throw new Error(`Failed to initialize default timeline: ${error.message}`)
      }

      // Log activity
      try {
        await logActivity(
          couple.id,
          user.id,
          'profile_updated',
          'timeline',
          couple.id,
          'Wedding Timeline',
          { action: 'initialized_default_timeline', count: data.length }
        )
      } catch (activityError) {
        console.warn('Activity logging failed:', activityError)
      }

      setTimelineItems(data)
      return data

    } catch (err) {
      console.error('Error initializing default timeline:', err)
      throw err
    }
  }, [couple?.id, user?.id])

  // Add new timeline item
  const addTimelineItem = useCallback(async (itemData: TimelineItemInsert) => {
    if (!couple?.id || !user?.id) {
      throw new Error('Authentication required to add timeline item')
    }

    try {
      const processedData = {
        ...itemData,
        couple_id: couple.id,
        type: itemData.type || 'other',
        buffer_time_minutes: itemData.buffer_time_minutes || 15,
        end_time: itemData.end_time || (itemData.duration_minutes ? calculateEndTime(itemData.start_time, itemData.duration_minutes, itemData.buffer_time_minutes) : undefined)
      }

      const { data, error } = await supabase
        .from('timeline_items')
        .insert(processedData)
        .select()
        .single()

      if (error) {
        throw new Error(`Failed to add timeline item: ${error.message}`)
      }

      // Log activity
      try {
        await logActivity(
          couple.id,
          user.id,
          'timeline_item_added',
          'timeline',
          data.id,
          data.title,
          { 
            type: data.type, 
            start_time: data.start_time,
            duration_minutes: data.duration_minutes,
            location: data.location
          }
        )
      } catch (activityError) {
        console.warn('Activity logging failed:', activityError)
      }

      setTimelineItems(prev => [...prev, data].sort((a, b) => a.start_time.localeCompare(b.start_time)))
      return data

    } catch (err) {
      console.error('Error adding timeline item:', err)
      throw err
    }
  }, [couple?.id, user?.id])

  // Update timeline item
  const updateTimelineItem = useCallback(async (itemId: string, updates: TimelineItemUpdate) => {
    if (!couple?.id || !user?.id) {
      throw new Error('Authentication required to update timeline item')
    }

    try {
      // Calculate end time if duration or start time changed
      if (updates.start_time || updates.duration_minutes !== undefined) {
        const currentItem = timelineItems.find(item => item.id === itemId)
        if (currentItem) {
          const startTime = updates.start_time || currentItem.start_time
          const duration = updates.duration_minutes !== undefined ? updates.duration_minutes : currentItem.duration_minutes
          const buffer = updates.buffer_time_minutes !== undefined ? updates.buffer_time_minutes : currentItem.buffer_time_minutes
          
          if (duration) {
            updates.end_time = calculateEndTime(startTime, duration, buffer)
          }
        }
      }

      const { data, error } = await supabase
        .from('timeline_items')
        .update(updates)
        .eq('id', itemId)
        .eq('couple_id', couple.id)
        .select()
        .single()

      if (error) {
        throw new Error(`Failed to update timeline item: ${error.message}`)
      }

      setTimelineItems(prev => prev.map(item => item.id === itemId ? data : item).sort((a, b) => a.start_time.localeCompare(b.start_time)))
      return data

    } catch (err) {
      console.error('Error updating timeline item:', err)
      throw err
    }
  }, [couple?.id, user?.id, timelineItems])

  // Delete timeline item
  const deleteTimelineItem = useCallback(async (itemId: string) => {
    if (!couple?.id || !user?.id) {
      throw new Error('Authentication required to delete timeline item')
    }

    try {
      const item = timelineItems.find(t => t.id === itemId)
      if (!item) {
        throw new Error('Timeline item not found')
      }

      const { error } = await supabase
        .from('timeline_items')
        .delete()
        .eq('id', itemId)
        .eq('couple_id', couple.id)

      if (error) {
        throw new Error(`Failed to delete timeline item: ${error.message}`)
      }

      // Log activity
      try {
        await logActivity(
          couple.id,
          user.id,
          'timeline_updated',
          'timeline',
          itemId,
          item.title,
          { action: 'deleted', type: item.type, start_time: item.start_time }
        )
      } catch (activityError) {
        console.warn('Activity logging failed:', activityError)
      }

      setTimelineItems(prev => prev.filter(t => t.id !== itemId))
      return true

    } catch (err) {
      console.error('Error deleting timeline item:', err)
      throw err
    }
  }, [couple?.id, user?.id, timelineItems])

  // Calculate timeline statistics
  const timelineStats: TimelineStats = {
    totalItems: timelineItems.length,
    totalDuration: timelineItems.reduce((sum, item) => sum + (item.duration_minutes || 0), 0),
    earliestStart: timelineItems.length > 0 ? Math.min(...timelineItems.map(item => item.start_time)).toString() : '00:00',
    latestEnd: timelineItems.length > 0 ? Math.max(...timelineItems.map(item => item.end_time || item.start_time)).toString() : '23:59',
    itemsByType: timelineItems.reduce((acc, item) => {
      acc[item.type] = (acc[item.type] || 0) + 1
      return acc
    }, {} as Record<string, number>),
    averageBufferTime: timelineItems.length > 0 
      ? timelineItems.reduce((sum, item) => sum + item.buffer_time_minutes, 0) / timelineItems.length
      : 0,
    potentialConflicts: 0 // TODO: Implement conflict detection
  }

  // Load data on mount
  useEffect(() => {
    loadTimeline()
  }, [loadTimeline])

  return {
    timelineItems,
    loading,
    error,
    timelineStats,
    addTimelineItem,
    updateTimelineItem,
    deleteTimelineItem,
    initializeDefaultTimeline,
    refreshTimeline: loadTimeline
  }
}