'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { ActivityFeed } from '@/types/database'
import { RealtimeChannel } from '@supabase/supabase-js'

interface ActivityStats {
  totalActivities: number
  todayActivities: number
  unreadActivities: number
  activityByType: Record<string, number>
}

export function useActivityFeed(limit = 50) {
  const [activities, setActivities] = useState<ActivityFeed[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [channel, setChannel] = useState<RealtimeChannel | null>(null)
  const onNewActivityRef = useRef<((activity: ActivityFeed) => void) | null>(null)
  
  const { couple } = useAuth()

  // Load initial activities
  const loadActivities = useCallback(async () => {
    if (!couple?.id) {
      setActivities([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      const { data, error: fetchError } = await supabase
        .from('activity_feed')
        .select('*')
        .eq('couple_id', couple.id)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (fetchError) {
        throw fetchError
      }

      setActivities(data || [])
    } catch (err) {
      console.error('Error loading activities:', err)
      setError(err instanceof Error ? err.message : 'Failed to load activities')
    } finally {
      setLoading(false)
    }
  }, [couple?.id, limit])

  // Mark activity as read
  const markAsRead = useCallback(async (activityId: string) => {
    if (!couple?.id) return

    try {
      const { error: updateError } = await supabase
        .from('activity_feed')
        .update({ is_read: true })
        .eq('id', activityId)
        .eq('couple_id', couple.id)

      if (updateError) {
        throw updateError
      }

      // Update local state
      setActivities(prev => 
        prev.map(activity => 
          activity.id === activityId 
            ? { ...activity, is_read: true }
            : activity
        )
      )
    } catch (err) {
      console.error('Error marking activity as read:', err)
    }
  }, [couple?.id])

  // Mark all as read
  const markAllAsRead = useCallback(async () => {
    if (!couple?.id) return

    try {
      const { error: updateError } = await supabase
        .from('activity_feed')
        .update({ is_read: true })
        .eq('couple_id', couple.id)
        .eq('is_read', false)

      if (updateError) {
        throw updateError
      }

      // Update local state
      setActivities(prev => 
        prev.map(activity => ({ ...activity, is_read: true }))
      )
    } catch (err) {
      console.error('Error marking all as read:', err)
    }
  }, [couple?.id])

  // Set up real-time subscription
  useEffect(() => {
    if (!couple?.id) return

    // Load initial data
    loadActivities()

    // Set up real-time subscription
    const newChannel = supabase
      .channel(`activity_feed:${couple.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'activity_feed',
          filter: `couple_id=eq.${couple.id}`
        },
        (payload) => {
          console.log('New activity:', payload.new)
          
          // Add new activity to the beginning of the list
          setActivities(prev => {
            const newActivity = payload.new as ActivityFeed
            
            // Check if activity already exists (prevent duplicates)
            if (prev.some(a => a.id === newActivity.id)) {
              return prev
            }
            
            // Add to beginning and limit array size
            return [newActivity, ...prev].slice(0, limit)
          })

          // Trigger notification callback if provided
          if (onNewActivity) {
            onNewActivity(payload.new as ActivityFeed)
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'activity_feed',
          filter: `couple_id=eq.${couple.id}`
        },
        (payload) => {
          console.log('Updated activity:', payload.new)
          
          // Update the activity in the list
          setActivities(prev => 
            prev.map(activity => 
              activity.id === payload.new.id 
                ? payload.new as ActivityFeed
                : activity
            )
          )
        }
      )
      .subscribe()

    setChannel(newChannel)

    // Cleanup subscription on unmount
    return () => {
      if (newChannel) {
        supabase.removeChannel(newChannel)
      }
    }
  }, [couple?.id, limit, loadActivities])

  // Calculate activity statistics
  const stats: ActivityStats = {
    totalActivities: activities.length,
    todayActivities: activities.filter(a => {
      const activityDate = new Date(a.created_at || '')
      const today = new Date()
      return activityDate.toDateString() === today.toDateString()
    }).length,
    unreadActivities: activities.filter(a => !a.is_read).length,
    activityByType: activities.reduce((acc, activity) => {
      acc[activity.action_type] = (acc[activity.action_type] || 0) + 1
      return acc
    }, {} as Record<string, number>)
  }

  // Callback for new activities (can be used for notifications)
  let onNewActivity: ((activity: ActivityFeed) => void) | undefined

  const setOnNewActivity = (callback: (activity: ActivityFeed) => void) => {
    onNewActivity = callback
  }

  return {
    activities,
    loading,
    error,
    stats,
    markAsRead,
    markAllAsRead,
    refreshActivities: loadActivities,
    setOnNewActivity,
    isConnected: channel?.state === 'joined'
  }
}

// Helper function to format activity messages
export function formatActivityMessage(activity: ActivityFeed): string {
  const { action_type, entity_type, entity_name, user_name, details } = activity

  switch (action_type) {
    case 'vendor_added':
      return `${user_name} added a new vendor: ${entity_name}`
    
    case 'vendor_updated':
      return `${user_name} updated vendor: ${entity_name}`
    
    case 'vendor_booked':
      return `${user_name} booked vendor: ${entity_name} 🎉`
    
    case 'vendor_cancelled':
      return `${user_name} cancelled vendor: ${entity_name}`
    
    case 'guest_added':
      return `${user_name} added a new guest: ${entity_name}`
    
    case 'guest_updated':
      return `${user_name} updated guest: ${entity_name}`
    
    case 'guest_rsvp':
      const status = details?.status as string
      if (status === 'accepted') {
        return `${entity_name} accepted the invitation! 🎉`
      } else if (status === 'declined') {
        return `${entity_name} declined the invitation`
      } else {
        return `${entity_name} updated their RSVP`
      }
    
    case 'budget_updated':
      return `${user_name} updated the budget`
    
    case 'expense_added':
      const amount = details?.amount as number
      return `${user_name} added expense: $${amount?.toLocaleString()} for ${entity_name}`
    
    case 'task_completed':
      return `${user_name} completed task: ${entity_name} ✅`
    
    case 'task_added':
      return `${user_name} added a new task: ${entity_name}`
    
    case 'timeline_updated':
      return `${user_name} updated the timeline`
    
    case 'event_added':
      return `${user_name} added timeline event: ${entity_name}`
    
    default:
      return `${user_name} ${action_type.replace(/_/g, ' ')} ${entity_name}`
  }
}

// Helper function to get activity icon
export function getActivityIcon(action_type: string): string {
  const iconMap: Record<string, string> = {
    vendor_added: '🏪',
    vendor_updated: '✏️',
    vendor_booked: '✅',
    vendor_cancelled: '❌',
    guest_added: '👥',
    guest_updated: '✏️',
    guest_rsvp: '💌',
    budget_updated: '💰',
    expense_added: '💸',
    task_completed: '✅',
    task_added: '📝',
    timeline_updated: '📅',
    event_added: '🎉',
  }

  return iconMap[action_type] || '📌'
}

// Helper function to format relative time
export function formatRelativeTime(date: string | null): string {
  if (!date) return 'Just now'
  
  const activityDate = new Date(date)
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - activityDate.getTime()) / 1000)

  if (diffInSeconds < 60) return 'Just now'
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`
  
  return activityDate.toLocaleDateString()
}