import { createBrowserClient } from '@/lib/supabase-client'
import { RealtimeChannel } from '@supabase/supabase-js'

// Types for messaging
export interface Message {
  id: string
  vendorId: string
  threadId?: string
  senderType: 'couple' | 'vendor' | 'system'
  senderId?: string
  senderName?: string
  type: 'text' | 'image' | 'document' | 'system' | 'milestone' | 'payment'
  content?: string
  attachments: any[]
  metadata: Record<string, any>
  isRead: boolean
  readAt?: string
  isEdited: boolean
  editedAt?: string
  createdAt: string
  mediaCount?: number
  reactions?: any[]
}

export interface Conversation {
  vendorId: string
  vendorName: string
  vendorCategory?: string
  lastMessage: {
    id: string
    content?: string
    type: string
    timestamp: string
  }
  unreadCount: number
  hasAttachments: boolean
}

export interface TypingIndicator {
  vendorId: string
  userId: string
  userType: 'couple' | 'vendor'
  isTyping: boolean
  lastTypedAt: string
}

// Real-time subscription manager
export class MessagingRealtimeManager {
  private supabase = createBrowserClient()
  private channels: Map<string, RealtimeChannel> = new Map()

  // Subscribe to messages for a vendor conversation
  subscribeToVendorMessages(
    vendorId: string,
    coupleId: string,
    callbacks: {
      onNewMessage?: (message: Message) => void
      onMessageUpdate?: (message: Message) => void
      onMessageDelete?: (messageId: string) => void
      onTyping?: (indicator: TypingIndicator) => void
    }
  ) {
    const channelName = `messages:${vendorId}:${coupleId}`
    
    // Clean up existing subscription
    this.unsubscribe(channelName)

    const channel = this.supabase.channel(channelName)

    // Subscribe to new messages
    if (callbacks.onNewMessage) {
      channel.on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'vendor_messages',
          filter: `vendor_id=eq.${vendorId}`,
        },
        (payload) => {
          callbacks.onNewMessage!(payload.new as Message)
        }
      )
    }

    // Subscribe to message updates
    if (callbacks.onMessageUpdate) {
      channel.on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'vendor_messages',
          filter: `vendor_id=eq.${vendorId}`,
        },
        (payload) => {
          callbacks.onMessageUpdate!(payload.new as Message)
        }
      )
    }

    // Subscribe to message deletions
    if (callbacks.onMessageDelete) {
      channel.on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'vendor_messages',
          filter: `vendor_id=eq.${vendorId}`,
        },
        (payload) => {
          callbacks.onMessageDelete!(payload.old.id)
        }
      )
    }

    // Subscribe to typing indicators
    if (callbacks.onTyping) {
      channel.on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'typing_indicators',
          filter: `vendor_id=eq.${vendorId}`,
        },
        (payload) => {
          callbacks.onTyping!(payload.new as TypingIndicator)
        }
      )
    }

    channel.subscribe()
    this.channels.set(channelName, channel)

    return () => this.unsubscribe(channelName)
  }

  // Subscribe to all conversations for unread count updates
  subscribeToConversations(
    coupleId: string,
    onUpdate: (conversations: Conversation[]) => void
  ) {
    const channelName = `conversations:${coupleId}`
    
    // Clean up existing subscription
    this.unsubscribe(channelName)

    const channel = this.supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'vendor_messages',
          filter: `couple_id=eq.${coupleId}`,
        },
        async () => {
          // Fetch updated conversations list
          const { data, error } = await this.supabase
            .rpc('get_latest_vendor_messages', {
              p_couple_id: coupleId
            })

          if (!error && data) {
            const formattedConversations = data.map(conv => ({
              vendorId: conv.vendor_id,
              vendorName: conv.vendor_name,
              lastMessage: {
                id: conv.latest_message_id,
                content: conv.latest_message_content,
                type: conv.latest_message_type,
                timestamp: conv.latest_message_time
              },
              unreadCount: conv.unread_count,
              hasAttachments: conv.latest_message_type !== 'text'
            }))
            onUpdate(formattedConversations)
          }
        }
      )
      .subscribe()

    this.channels.set(channelName, channel)

    return () => this.unsubscribe(channelName)
  }

  // Unsubscribe from a channel
  unsubscribe(channelName: string) {
    const channel = this.channels.get(channelName)
    if (channel) {
      channel.unsubscribe()
      this.channels.delete(channelName)
    }
  }

  // Unsubscribe from all channels
  unsubscribeAll() {
    this.channels.forEach((channel) => {
      channel.unsubscribe()
    })
    this.channels.clear()
  }
}

// Typing indicator manager
export class TypingIndicatorManager {
  private typingTimer: NodeJS.Timeout | null = null
  private isTyping = false

  constructor(
    private vendorId: string,
    private onTypingChange: (isTyping: boolean) => void
  ) {}

  // Call this when user types
  handleTyping() {
    if (!this.isTyping) {
      this.isTyping = true
      this.onTypingChange(true)
    }

    // Clear existing timer
    if (this.typingTimer) {
      clearTimeout(this.typingTimer)
    }

    // Set new timer to stop typing after 3 seconds of inactivity
    this.typingTimer = setTimeout(() => {
      this.isTyping = false
      this.onTypingChange(false)
    }, 3000)
  }

  // Call this when message is sent
  stopTyping() {
    if (this.typingTimer) {
      clearTimeout(this.typingTimer)
    }
    this.isTyping = false
    this.onTypingChange(false)
  }

  // Cleanup
  destroy() {
    if (this.typingTimer) {
      clearTimeout(this.typingTimer)
    }
  }
}

// Message formatting helpers
export function formatMessageTime(timestamp: string): string {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (days === 0) {
    // Today - show time
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    })
  } else if (days === 1) {
    // Yesterday
    return 'Yesterday'
  } else if (days < 7) {
    // This week - show day name
    return date.toLocaleDateString('en-US', { weekday: 'long' })
  } else {
    // Older - show date
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: days > 365 ? 'numeric' : undefined
    })
  }
}

// File size formatter
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// Message search helper
export async function searchMessages(
  coupleId: string,
  query: string,
  filters?: {
    vendorId?: string
    messageType?: string
    dateFrom?: Date
    dateTo?: Date
  }
) {
  const supabase = createBrowserClient()
  
  const { data, error } = await supabase.rpc('search_vendor_messages', {
    p_couple_id: coupleId,
    p_search_query: query,
    p_vendor_id: filters?.vendorId,
    p_message_type: filters?.messageType,
    p_date_from: filters?.dateFrom?.toISOString(),
    p_date_to: filters?.dateTo?.toISOString(),
    p_limit: 50,
    p_offset: 0
  })

  if (error) {
    console.error('Search error:', error)
    return []
  }

  return data || []
}