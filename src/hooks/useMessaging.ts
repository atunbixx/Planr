import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { createBrowserClient } from '@/lib/supabase-client'
import { 
  MessagingRealtimeManager, 
  TypingIndicatorManager,
  Message,
  Conversation,
  TypingIndicator
} from '@/lib/messaging-helpers'

// Hook for managing conversations list
export function useConversations() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [totalUnread, setTotalUnread] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const { user } = useAuth()
  const supabase = createBrowserClient()
  const realtimeManager = useRef<MessagingRealtimeManager | null>(null)

  // Fetch conversations
  const fetchConversations = useCallback(async () => {
    if (!user) return

    try {
      setLoading(true)
      const response = await fetch('/api/messages/conversations')
      
      if (!response.ok) {
        throw new Error('Failed to fetch conversations')
      }

      const data = await response.json()
      setConversations(data.data.conversations)
      setTotalUnread(data.data.totalUnread)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }, [user])

  // Set up real-time subscriptions
  useEffect(() => {
    if (!user) return

    // Get couple ID
    const getCoupleIdAndSubscribe = async () => {
      const { data: couple } = await supabase
        .from('couples')
        .select('id')
        .or(`partner1_user_id.eq.${user.id},partner2_user_id.eq.${user.id}`)
        .single()

      if (couple) {
        realtimeManager.current = new MessagingRealtimeManager()
        
        const unsubscribe = realtimeManager.current.subscribeToConversations(
          couple.id,
          (updatedConversations) => {
            setConversations(updatedConversations)
            const unread = updatedConversations.reduce(
              (sum, conv) => sum + conv.unreadCount, 
              0
            )
            setTotalUnread(unread)
          }
        )

        return unsubscribe
      }
    }

    let unsubscribe: (() => void) | undefined

    getCoupleIdAndSubscribe().then(unsub => {
      unsubscribe = unsub
    })

    return () => {
      unsubscribe?.()
      realtimeManager.current?.unsubscribeAll()
    }
  }, [user, supabase])

  // Initial fetch
  useEffect(() => {
    fetchConversations()
  }, [fetchConversations])

  return {
    conversations,
    totalUnread,
    loading,
    error,
    refetch: fetchConversations
  }
}

// Hook for managing a single conversation
export function useVendorMessages(vendorId: string) {
  const [messages, setMessages] = useState<Message[]>([])
  const [vendor, setVendor] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(false)
  
  const { user } = useAuth()
  const supabase = createBrowserClient()
  const realtimeManager = useRef<MessagingRealtimeManager | null>(null)
  const typingManager = useRef<TypingIndicatorManager | null>(null)

  // Fetch messages
  const fetchMessages = useCallback(async (beforeMessageId?: string) => {
    if (!user || !vendorId) return

    try {
      setLoading(true)
      const url = `/api/messages/${vendorId}${
        beforeMessageId ? `?before=${beforeMessageId}` : ''
      }`
      
      const response = await fetch(url)
      
      if (!response.ok) {
        throw new Error('Failed to fetch messages')
      }

      const data = await response.json()
      
      if (beforeMessageId) {
        setMessages(prev => [...data.data.messages, ...prev])
      } else {
        setMessages(data.data.messages)
      }
      
      setVendor(data.data.vendor)
      setHasMore(data.data.hasMore)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }, [user, vendorId])

  // Send message
  const sendMessage = useCallback(async (
    content: string,
    attachments: any[] = [],
    messageType: 'text' | 'image' | 'document' = 'text'
  ) => {
    if (!user || !vendorId) return

    try {
      setSending(true)
      
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          vendorId,
          content,
          messageType,
          attachments
        })
      })

      if (!response.ok) {
        throw new Error('Failed to send message')
      }

      const data = await response.json()
      
      // Add the new message to the list
      setMessages(prev => [...prev, data.data.message])
      
      // Stop typing indicator
      typingManager.current?.stopTyping()
      
      return data.data.message
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message')
      throw err
    } finally {
      setSending(false)
    }
  }, [user, vendorId])

  // Update message
  const updateMessage = useCallback(async (messageId: string, content: string) => {
    if (!user) return

    try {
      const response = await fetch(`/api/messages/${messageId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content })
      })

      if (!response.ok) {
        throw new Error('Failed to update message')
      }

      const data = await response.json()
      
      // Update the message in the list
      setMessages(prev => prev.map(msg => 
        msg.id === messageId 
          ? { ...msg, ...data.data.message }
          : msg
      ))
      
      return data.data.message
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update message')
      throw err
    }
  }, [user])

  // Delete message
  const deleteMessage = useCallback(async (messageId: string) => {
    if (!user) return

    try {
      const response = await fetch(`/api/messages/${messageId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to delete message')
      }

      // Remove the message from the list
      setMessages(prev => prev.filter(msg => msg.id !== messageId))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete message')
      throw err
    }
  }, [user])

  // Mark as read
  const markAsRead = useCallback(async (messageId: string) => {
    if (!user) return

    try {
      await fetch(`/api/messages/${messageId}/read`, {
        method: 'POST'
      })

      // Update local state
      setMessages(prev => prev.map(msg => 
        msg.id === messageId 
          ? { ...msg, isRead: true, readAt: new Date().toISOString() }
          : msg
      ))
    } catch (err) {
      console.error('Failed to mark as read:', err)
    }
  }, [user])

  // Handle typing
  const handleTyping = useCallback(async (isTyping: boolean) => {
    if (!user || !vendorId) return

    try {
      await fetch('/api/messages/typing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          vendorId,
          isTyping
        })
      })
    } catch (err) {
      console.error('Failed to update typing status:', err)
    }
  }, [user, vendorId])

  // Set up real-time subscriptions
  useEffect(() => {
    if (!user || !vendorId) return

    // Get couple ID and subscribe
    const getCoupleIdAndSubscribe = async () => {
      const { data: couple } = await supabase
        .from('couples')
        .select('id')
        .or(`partner1_user_id.eq.${user.id},partner2_user_id.eq.${user.id}`)
        .single()

      if (couple) {
        realtimeManager.current = new MessagingRealtimeManager()
        
        const unsubscribe = realtimeManager.current.subscribeToVendorMessages(
          vendorId,
          couple.id,
          {
            onNewMessage: (message) => {
              setMessages(prev => [...prev, message])
              // Auto-mark as read if window is focused
              if (document.hasFocus()) {
                markAsRead(message.id)
              }
            },
            onMessageUpdate: (message) => {
              setMessages(prev => prev.map(msg => 
                msg.id === message.id ? message : msg
              ))
            },
            onMessageDelete: (messageId) => {
              setMessages(prev => prev.filter(msg => msg.id !== messageId))
            }
          }
        )

        // Set up typing manager
        typingManager.current = new TypingIndicatorManager(
          vendorId,
          handleTyping
        )

        return unsubscribe
      }
    }

    let unsubscribe: (() => void) | undefined

    getCoupleIdAndSubscribe().then(unsub => {
      unsubscribe = unsub
    })

    return () => {
      unsubscribe?.()
      realtimeManager.current?.unsubscribeAll()
      typingManager.current?.destroy()
    }
  }, [user, vendorId, supabase, handleTyping, markAsRead])

  // Initial fetch
  useEffect(() => {
    fetchMessages()
  }, [fetchMessages])

  return {
    messages,
    vendor,
    loading,
    sending,
    error,
    hasMore,
    sendMessage,
    updateMessage,
    deleteMessage,
    markAsRead,
    loadMore: () => {
      const oldestMessage = messages[0]
      if (oldestMessage) {
        fetchMessages(oldestMessage.id)
      }
    },
    onTyping: () => typingManager.current?.handleTyping()
  }
}

// Hook for uploading files
export function useMessageUpload() {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const uploadFile = useCallback(async (
    file: File,
    vendorId: string,
    messageId?: string
  ) => {
    try {
      setUploading(true)
      setProgress(0)
      setError(null)

      const formData = new FormData()
      formData.append('file', file)
      formData.append('vendorId', vendorId)
      if (messageId) {
        formData.append('messageId', messageId)
      }

      // Use XMLHttpRequest to track upload progress
      return new Promise<any>((resolve, reject) => {
        const xhr = new XMLHttpRequest()

        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const percentComplete = (e.loaded / e.total) * 100
            setProgress(Math.round(percentComplete))
          }
        })

        xhr.addEventListener('load', () => {
          if (xhr.status === 200) {
            const response = JSON.parse(xhr.responseText)
            resolve(response.data)
          } else {
            reject(new Error('Upload failed'))
          }
        })

        xhr.addEventListener('error', () => {
          reject(new Error('Upload failed'))
        })

        xhr.open('POST', '/api/messages/upload')
        xhr.send(formData)
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Upload failed'
      setError(message)
      throw new Error(message)
    } finally {
      setUploading(false)
      setProgress(0)
    }
  }, [])

  return {
    uploadFile,
    uploading,
    progress,
    error
  }
}