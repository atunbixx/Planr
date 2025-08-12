import { useState, useEffect, useCallback } from 'react'
import { NotificationData, NotificationCategory, NotificationPriority, NotificationStats } from '@/lib/notifications/types'

interface UseNotificationsOptions {
  autoConnect?: boolean
  page?: number
  pageSize?: number
  unreadOnly?: boolean
  category?: NotificationCategory
  priority?: NotificationPriority
}

interface UseNotificationsReturn {
  notifications: NotificationData[]
  stats: NotificationStats | null
  loading: boolean
  error: string | null
  hasMore: boolean
  // Actions
  loadNotifications: () => Promise<void>
  loadMore: () => Promise<void>
  markAsRead: (id: string) => Promise<void>
  markAllAsRead: () => Promise<void>
  deleteNotification: (id: string) => Promise<void>
  refresh: () => Promise<void>
  // Real-time connection
  isConnected: boolean
  connect: () => void
  disconnect: () => void
}

export function useNotifications(options: UseNotificationsOptions = {}): UseNotificationsReturn {
  const {
    autoConnect = true,
    page = 1,
    pageSize = 20,
    unreadOnly = false,
    category,
    priority
  } = options

  // State
  const [notifications, setNotifications] = useState<NotificationData[]>([])
  const [stats, setStats] = useState<NotificationStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(false)
  const [currentPage, setCurrentPage] = useState(page)
  const [isConnected, setIsConnected] = useState(false)
  const [eventSource, setEventSource] = useState<EventSource | null>(null)

  // Build query parameters
  const getQueryParams = useCallback((pageNum = currentPage) => {
    const params = new URLSearchParams({
      page: pageNum.toString(),
      pageSize: pageSize.toString(),
      unreadOnly: unreadOnly.toString(),
    })
    if (category) params.set('category', category)
    if (priority) params.set('priority', priority)
    return params.toString()
  }, [currentPage, pageSize, unreadOnly, category, priority])

  // Load notifications
  const loadNotifications = useCallback(async (pageNum = 1, append = false) => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/notifications?${getQueryParams(pageNum)}`)
      if (!response.ok) {
        throw new Error('Failed to load notifications')
      }

      const result = await response.json()
      if (!result.success) {
        throw new Error(result.error || 'Failed to load notifications')
      }

      const { notifications: newNotifications, hasNextPage } = result.data
      
      if (append) {
        setNotifications(prev => [...prev, ...newNotifications])
      } else {
        setNotifications(newNotifications)
      }
      
      setHasMore(hasNextPage)
      setCurrentPage(pageNum)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [getQueryParams])

  // Load more notifications
  const loadMore = useCallback(async () => {
    if (hasMore && !loading) {
      await loadNotifications(currentPage + 1, true)
    }
  }, [hasMore, loading, currentPage, loadNotifications])

  // Load stats
  const loadStats = useCallback(async () => {
    try {
      const response = await fetch('/api/notifications/stats')
      if (!response.ok) return

      const result = await response.json()
      if (result.success) {
        setStats(result.data)
      }
    } catch (error) {
      console.error('Failed to load notification stats:', error)
    }
  }, [])

  // Mark notification as read
  const markAsRead = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/notifications/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'mark_read' })
      })

      if (!response.ok) return

      // Update local state
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, read: true } : n)
      )

      // Update stats
      setStats(prev => prev ? { ...prev, unread: prev.unread - 1 } : null)
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
    }
  }, [])

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    try {
      const response = await fetch('/api/notifications/actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'mark_all_read' })
      })

      if (!response.ok) return

      // Update local state
      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
      setStats(prev => prev ? { ...prev, unread: 0 } : null)
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error)
    }
  }, [])

  // Delete notification
  const deleteNotification = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/notifications/${id}`, {
        method: 'DELETE'
      })

      if (!response.ok) return

      // Update local state
      const notification = notifications.find(n => n.id === id)
      setNotifications(prev => prev.filter(n => n.id !== id))
      
      // Update stats
      if (notification) {
        setStats(prev => prev ? {
          ...prev,
          total: prev.total - 1,
          unread: notification.read ? prev.unread : prev.unread - 1
        } : null)
      }
    } catch (error) {
      console.error('Failed to delete notification:', error)
    }
  }, [notifications])

  // Refresh data
  const refresh = useCallback(async () => {
    await Promise.all([
      loadNotifications(1, false),
      loadStats()
    ])
  }, [loadNotifications, loadStats])

  // Connect to real-time updates
  const connect = useCallback(() => {
    if (eventSource || isConnected) return

    try {
      const source = new EventSource('/api/notifications/stream')
      
      source.onopen = () => {
        setIsConnected(true)
        setError(null)
      }

      source.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          
          switch (data.type) {
            case 'notification':
              // Add new notification to the list
              setNotifications(prev => [data.data, ...prev])
              setStats(prev => prev ? {
                ...prev,
                total: prev.total + 1,
                unread: prev.unread + 1
              } : null)
              break
              
            case 'notification_read':
              // Update notification as read
              setNotifications(prev => 
                prev.map(n => n.id === data.data.id ? { ...n, read: true } : n)
              )
              setStats(prev => prev ? { ...prev, unread: Math.max(0, prev.unread - 1) } : null)
              break
              
            case 'notification_deleted':
              // Remove notification
              const deletedNotification = notifications.find(n => n.id === data.data.id)
              setNotifications(prev => prev.filter(n => n.id !== data.data.id))
              if (deletedNotification) {
                setStats(prev => prev ? {
                  ...prev,
                  total: prev.total - 1,
                  unread: deletedNotification.read ? prev.unread : prev.unread - 1
                } : null)
              }
              break
          }
        } catch (error) {
          console.error('Failed to parse SSE message:', error)
        }
      }

      source.onerror = () => {
        setIsConnected(false)
        setError('Connection lost. Attempting to reconnect...')
        
        // Attempt to reconnect after delay
        setTimeout(() => {
          if (!eventSource) connect()
        }, 5000)
      }

      setEventSource(source)
    } catch (error) {
      setError('Failed to connect to real-time updates')
    }
  }, [eventSource, isConnected, notifications])

  // Disconnect from real-time updates
  const disconnect = useCallback(() => {
    if (eventSource) {
      eventSource.close()
      setEventSource(null)
      setIsConnected(false)
    }
  }, [eventSource])

  // Initialize
  useEffect(() => {
    Promise.all([
      loadNotifications(1, false),
      loadStats()
    ])

    if (autoConnect) {
      connect()
    }

    // Cleanup on unmount
    return () => {
      disconnect()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Reconnect when options change
  useEffect(() => {
    loadNotifications(1, false)
  }, [loadNotifications])

  return {
    notifications,
    stats,
    loading,
    error,
    hasMore,
    loadNotifications: () => loadNotifications(1, false),
    loadMore,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refresh,
    isConnected,
    connect,
    disconnect
  }
}