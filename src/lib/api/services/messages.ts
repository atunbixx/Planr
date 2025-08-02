import { apiClient } from '../base/client'
import { ApiResponse, PaginatedResponse, QueryParams } from '../types'

export interface Message {
  id: string
  conversation_id: string
  sender_id: string
  content: string
  type: 'text' | 'image' | 'file' | 'system'
  metadata?: {
    file_name?: string
    file_size?: number
    file_url?: string
    image_url?: string
    thumbnail_url?: string
    system_event?: string
  }
  is_read: boolean
  read_at?: string
  created_at: string
  updated_at: string
}

export interface Conversation {
  id: string
  couple_id: string
  type: 'vendor' | 'guest' | 'internal' | 'group'
  title: string
  participants: Participant[]
  last_message?: Message
  unread_count: number
  is_archived: boolean
  is_muted: boolean
  created_at: string
  updated_at: string
}

export interface Participant {
  id: string
  user_id?: string
  vendor_id?: string
  guest_id?: string
  name: string
  email?: string
  phone?: string
  avatar_url?: string
  role: 'couple' | 'vendor' | 'guest' | 'admin'
  joined_at: string
  last_seen?: string
  is_typing?: boolean
}

export interface MessageFilters extends QueryParams {
  conversation_id?: string
  sender_id?: string
  type?: Message['type']
  is_read?: boolean
  date_from?: string
  date_to?: string
}

export interface ConversationFilters extends QueryParams {
  type?: Conversation['type']
  participant_id?: string
  is_archived?: boolean
  has_unread?: boolean
}

export interface SendMessageData {
  conversation_id?: string
  content: string
  type?: Message['type']
  recipient_id?: string
  recipient_type?: 'vendor' | 'guest'
  metadata?: Message['metadata']
}

export interface TypingIndicator {
  conversation_id: string
  user_id: string
  is_typing: boolean
}

class MessagesApiService {
  private basePath = '/messages'

  // Get conversations
  async getConversations(
    filters?: ConversationFilters
  ): Promise<ApiResponse<PaginatedResponse<Conversation>>> {
    const params = new URLSearchParams()
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, String(value))
        }
      })
    }
    
    return apiClient.get<PaginatedResponse<Conversation>>(
      `${this.basePath}/conversations?${params}`
    )
  }

  // Get single conversation
  async getConversation(id: string): Promise<ApiResponse<Conversation>> {
    return apiClient.get<Conversation>(`${this.basePath}/conversations/${id}`)
  }

  // Create conversation
  async createConversation(data: {
    type: Conversation['type']
    title?: string
    participant_ids: string[]
    participant_types: ('vendor' | 'guest' | 'user')[]
  }): Promise<ApiResponse<Conversation>> {
    return apiClient.post<Conversation>(`${this.basePath}/conversations`, data)
  }

  // Update conversation
  async updateConversation(
    id: string,
    data: {
      title?: string
      is_archived?: boolean
      is_muted?: boolean
    }
  ): Promise<ApiResponse<Conversation>> {
    return apiClient.patch<Conversation>(
      `${this.basePath}/conversations/${id}`,
      data
    )
  }

  // Delete conversation
  async deleteConversation(
    id: string
  ): Promise<ApiResponse<{ success: boolean }>> {
    return apiClient.delete<{ success: boolean }>(
      `${this.basePath}/conversations/${id}`
    )
  }

  // Get messages
  async getMessages(
    filters?: MessageFilters
  ): Promise<ApiResponse<PaginatedResponse<Message>>> {
    const params = new URLSearchParams()
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, String(value))
        }
      })
    }
    
    return apiClient.get<PaginatedResponse<Message>>(
      `${this.basePath}?${params}`
    )
  }

  // Send message
  async sendMessage(data: SendMessageData): Promise<ApiResponse<Message>> {
    return apiClient.post<Message>(`${this.basePath}/send`, data)
  }

  // Mark as read
  async markAsRead(
    messageIds: string[]
  ): Promise<ApiResponse<{ updated: number }>> {
    return apiClient.post<{ updated: number }>(`${this.basePath}/read`, {
      message_ids: messageIds
    })
  }

  // Mark conversation as read
  async markConversationAsRead(
    conversationId: string
  ): Promise<ApiResponse<{ updated: number }>> {
    return apiClient.post<{ updated: number }>(
      `${this.basePath}/conversations/${conversationId}/read`
    )
  }

  // Delete message
  async deleteMessage(id: string): Promise<ApiResponse<{ success: boolean }>> {
    return apiClient.delete<{ success: boolean }>(`${this.basePath}/${id}`)
  }

  // Upload attachment
  async uploadAttachment(
    file: File,
    conversationId: string
  ): Promise<ApiResponse<{
    url: string
    thumbnail_url?: string
    metadata: {
      file_name: string
      file_size: number
      file_type: string
    }
  }>> {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('conversation_id', conversationId)
    
    return apiClient.upload(
      `${this.basePath}/upload`,
      formData
    )
  }

  // Typing indicators
  async sendTypingIndicator(
    conversationId: string,
    isTyping: boolean
  ): Promise<ApiResponse<{ success: boolean }>> {
    return apiClient.post<{ success: boolean }>(`${this.basePath}/typing`, {
      conversation_id: conversationId,
      is_typing: isTyping
    })
  }

  // Add participants
  async addParticipants(
    conversationId: string,
    participants: {
      id: string
      type: 'vendor' | 'guest' | 'user'
    }[]
  ): Promise<ApiResponse<{ added: number }>> {
    return apiClient.post<{ added: number }>(
      `${this.basePath}/conversations/${conversationId}/participants`,
      { participants }
    )
  }

  // Remove participant
  async removeParticipant(
    conversationId: string,
    participantId: string
  ): Promise<ApiResponse<{ success: boolean }>> {
    return apiClient.delete<{ success: boolean }>(
      `${this.basePath}/conversations/${conversationId}/participants/${participantId}`
    )
  }

  // Search messages
  async searchMessages(
    query: string,
    options?: {
      conversation_ids?: string[]
      date_from?: string
      date_to?: string
      sender_ids?: string[]
    }
  ): Promise<ApiResponse<Message[]>> {
    return apiClient.post<Message[]>(`${this.basePath}/search`, {
      query,
      ...options
    })
  }

  // Get message statistics
  async getStatistics(): Promise<ApiResponse<{
    total_conversations: number
    total_messages: number
    unread_messages: number
    by_type: Record<Conversation['type'], number>
    active_conversations: number
    response_time_avg: number
  }>> {
    return apiClient.get(`${this.basePath}/statistics`)
  }

  // Templates
  async getTemplates(
    type?: 'vendor' | 'guest' | 'general'
  ): Promise<ApiResponse<{
    templates: {
      id: string
      name: string
      type: string
      content: string
      variables: string[]
    }[]
  }>> {
    const params = type ? `?type=${type}` : ''
    return apiClient.get(`${this.basePath}/templates${params}`)
  }

  async createTemplate(data: {
    name: string
    type: 'vendor' | 'guest' | 'general'
    content: string
  }): Promise<ApiResponse<{ id: string }>> {
    return apiClient.post<{ id: string }>(`${this.basePath}/templates`, data)
  }
}

export const messagesApi = new MessagesApiService()