'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useUser } from '@clerk/nextjs'

export function useUnreadMessages() {
  const [unreadCount, setUnreadCount] = useState(0)
  const [unreadByVendor, setUnreadByVendor] = useState<Record<string, number>>({})
  const { user } = useUser()
  
  // For now, we'll use a mock couple until we implement the database integration
  const couple = user ? { id: 'temp-couple-id' } : null

  useEffect(() => {
    if (!couple?.id) return

    // Initial load with error handling
    loadUnreadCounts()

    // Only subscribe if vendor_messages table exists
    let subscription: any = null
    
    // Test if vendor_messages table exists before subscribing
    checkTableExists().then(exists => {
      if (exists && couple?.id) {
        subscription = supabase
          .channel('unread-messages')
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'vendor_messages',
              filter: `couple_id=eq.${couple.id}`
            },
            () => {
              loadUnreadCounts()
            }
          )
          .subscribe()
      }
    })

    return () => {
      if (subscription) {
        subscription.unsubscribe()
      }
    }
  }, [couple?.id])

  const checkTableExists = async () => {
    try {
      const { error } = await supabase
        .from('vendor_messages')
        .select('id')
        .limit(1)
      
      return !error || !error.message.includes('does not exist')
    } catch {
      return false
    }
  }

  const loadUnreadCounts = async () => {
    if (!couple?.id) return

    try {
      // Since vendor_messages table doesn't exist, return zeros
      // This prevents dashboard crashes while maintaining the interface
      setUnreadCount(0)
      setUnreadByVendor({})
      
      console.log('📱 Messages feature not yet implemented - showing zero counts')
    } catch (error) {
      console.error('Error loading unread counts:', error)
      // Set safe defaults
      setUnreadCount(0)
      setUnreadByVendor({})
    }
  }

  const markAsRead = async (vendorId: string) => {
    if (!couple?.id) return

    try {
      // Messages feature not implemented yet
      console.log('📱 Mark as read not yet implemented for vendor:', vendorId)
      
      // Reload counts (will return zeros)
      loadUnreadCounts()
    } catch (error) {
      console.error('Error marking messages as read:', error)
    }
  }

  return {
    unreadCount,
    unreadByVendor,
    markAsRead,
    refresh: loadUnreadCounts
  }
}