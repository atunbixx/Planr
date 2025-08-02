import { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import { useApiQuery, useApiMutation } from './base'
import { messagesApi, Message, Conversation, ConversationFilters, MessageFilters, SendMessageData } from '../services/messages'
import { QueryOptions, MutationOptions } from '../types'

// Conversations hooks
export function useConversations(filters?: ConversationFilters, options?: QueryOptions) {
  return useApiQuery(
    () => messagesApi.getConversations(filters),
    {
      refetchInterval: 30000, // Refetch every 30 seconds
      ...options
    }
  )
}

export function useConversation(id: string, options?: QueryOptions) {
  return useApiQuery(
    () => messagesApi.getConversation(id),
    {
      enabled: !!id,
      ...options
    }
  )
}

export function useCreateConversation(
  options?: MutationOptions<Conversation, Parameters<typeof messagesApi.createConversation>[0]>
) {
  return useApiMutation(
    (data) => messagesApi.createConversation(data),
    options
  )
}

export function useUpdateConversation(
  options?: MutationOptions<Conversation, { 
    id: string; 
    data: Parameters<typeof messagesApi.updateConversation>[1] 
  }>
) {
  return useApiMutation(
    ({ id, data }) => messagesApi.updateConversation(id, data),
    options
  )
}

// Messages hooks
export function useMessages(filters?: MessageFilters, options?: QueryOptions) {
  return useApiQuery(
    () => messagesApi.getMessages(filters),
    {
      refetchInterval: 10000, // Refetch every 10 seconds
      ...options
    }
  )
}

export function useSendMessage(
  options?: MutationOptions<Message, SendMessageData>
) {
  return useApiMutation(
    (data) => messagesApi.sendMessage(data),
    options
  )
}

export function useMarkAsRead(
  options?: MutationOptions<{ updated: number }, string[]>
) {
  return useApiMutation(
    (messageIds) => messagesApi.markAsRead(messageIds),
    options
  )
}

export function useMarkConversationAsRead(
  options?: MutationOptions<{ updated: number }, string>
) {
  return useApiMutation(
    (conversationId) => messagesApi.markConversationAsRead(conversationId),
    options
  )
}

export function useDeleteMessage(
  options?: MutationOptions<{ success: boolean }, string>
) {
  return useApiMutation(
    (id) => messagesApi.deleteMessage(id),
    options
  )
}

// Typing indicators
export function useTypingIndicator() {
  const [typingUsers, setTypingUsers] = useState<Record<string, string[]>>({})
  const typingTimeouts = useRef<Record<string, NodeJS.Timeout>>({})
  
  const sendTyping = useApiMutation(
    ({ conversationId, isTyping }: { conversationId: string; isTyping: boolean }) =>
      messagesApi.sendTypingIndicator(conversationId, isTyping)
  )
  
  const startTyping = useCallback((conversationId: string) => {
    sendTyping.mutate({ conversationId, isTyping: true })
    
    // Clear existing timeout
    if (typingTimeouts.current[conversationId]) {
      clearTimeout(typingTimeouts.current[conversationId])
    }
    
    // Auto stop typing after 5 seconds
    typingTimeouts.current[conversationId] = setTimeout(() => {
      sendTyping.mutate({ conversationId, isTyping: false })
    }, 5000)
  }, [sendTyping])
  
  const stopTyping = useCallback((conversationId: string) => {
    sendTyping.mutate({ conversationId, isTyping: false })
    
    if (typingTimeouts.current[conversationId]) {
      clearTimeout(typingTimeouts.current[conversationId])
      delete typingTimeouts.current[conversationId]
    }
  }, [sendTyping])
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      Object.values(typingTimeouts.current).forEach(timeout => clearTimeout(timeout))
    }
  }, [])
  
  return {
    typingUsers,
    startTyping,
    stopTyping,
    setTypingUsers
  }
}

// File upload
export function useUploadAttachment(
  options?: MutationOptions<
    { url: string; thumbnail_url?: string; metadata: any },
    { file: File; conversationId: string }
  >
) {
  return useApiMutation(
    ({ file, conversationId }) => messagesApi.uploadAttachment(file, conversationId),
    options
  )
}

// Search
export function useSearchMessages(
  query: string,
  searchOptions?: Parameters<typeof messagesApi.searchMessages>[1],
  options?: QueryOptions
) {
  return useApiQuery(
    () => messagesApi.searchMessages(query, searchOptions),
    {
      enabled: query.length >= 2,
      ...options
    }
  )
}

// Statistics
export function useMessageStatistics(options?: QueryOptions) {
  return useApiQuery(
    () => messagesApi.getStatistics(),
    {
      refetchInterval: 300000, // Refetch every 5 minutes
      ...options
    }
  )
}

// Composite hook for messaging
export function useMessaging() {
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null)
  const [conversationFilters, setConversationFilters] = useState<ConversationFilters>({})
  const [messageFilters, setMessageFilters] = useState<MessageFilters>({})
  const [searchQuery, setSearchQuery] = useState('')
  
  const conversations = useConversations(conversationFilters)
  const activeConversation = useConversation(activeConversationId || '')
  const messages = useMessages({
    ...messageFilters,
    conversation_id: activeConversationId || undefined
  })
  const statistics = useMessageStatistics()
  const { typingUsers, startTyping, stopTyping } = useTypingIndicator()
  
  const sendMessage = useSendMessage({
    onSuccess: () => {
      messages.refetch()
      conversations.refetch()
      stopTyping(activeConversationId!)
    }
  })
  
  const markAsRead = useMarkAsRead({
    onSuccess: () => {
      conversations.refetch()
      statistics.refetch()
    }
  })
  
  const markConversationAsRead = useMarkConversationAsRead({
    onSuccess: () => {
      conversations.refetch()
      statistics.refetch()
    }
  })
  
  const createConversation = useCreateConversation({
    onSuccess: (data) => {
      conversations.refetch()
      if (data.data) {
        setActiveConversationId(data.data.id)
      }
    }
  })
  
  const updateConversation = useUpdateConversation({
    onSuccess: () => {
      conversations.refetch()
      activeConversation.refetch()
    }
  })
  
  const uploadAttachment = useUploadAttachment()

  // Auto mark as read when viewing conversation
  useEffect(() => {
    if (activeConversationId && messages.data?.data.some(m => !m.is_read)) {
      const unreadMessageIds = messages.data.data
        .filter(m => !m.is_read)
        .map(m => m.id)
      
      if (unreadMessageIds.length > 0) {
        markAsRead.mutate(unreadMessageIds)
      }
    }
  }, [activeConversationId, messages.data, markAsRead])

  // Computed values
  const conversationsList = useMemo(() => 
    conversations.data?.data || [], 
    [conversations.data]
  )
  
  const messagesList = useMemo(() => 
    messages.data?.data || [], 
    [messages.data]
  )
  
  const unreadCount = useMemo(() => 
    statistics.data?.unread_messages || 0,
    [statistics.data]
  )
  
  const activeTypingUsers = useMemo(() => 
    typingUsers[activeConversationId || ''] || [],
    [typingUsers, activeConversationId]
  )

  // Filter helpers
  const updateConversationFilters = useCallback((newFilters: Partial<ConversationFilters>) => {
    setConversationFilters(prev => ({ ...prev, ...newFilters }))
  }, [])
  
  const clearConversationFilters = useCallback(() => {
    setConversationFilters({})
  }, [])

  // Message sending helper
  const sendTextMessage = useCallback((content: string) => {
    if (!activeConversationId) return
    
    sendMessage.mutate({
      conversation_id: activeConversationId,
      content,
      type: 'text'
    })
  }, [activeConversationId, sendMessage])
  
  const sendFileMessage = useCallback(async (file: File) => {
    if (!activeConversationId) return
    
    const uploadResult = await uploadAttachment.mutateAsync({
      file,
      conversationId: activeConversationId
    })
    
    if (uploadResult.success && uploadResult.data) {
      sendMessage.mutate({
        conversation_id: activeConversationId,
        content: uploadResult.data.metadata.file_name,
        type: 'file',
        metadata: {
          file_url: uploadResult.data.url,
          file_name: uploadResult.data.metadata.file_name,
          file_size: uploadResult.data.metadata.file_size
        }
      })
    }
  }, [activeConversationId, uploadAttachment, sendMessage])

  return {
    // Conversations
    conversations: conversationsList,
    activeConversationId,
    activeConversation: activeConversation.data,
    setActiveConversation: setActiveConversationId,
    
    // Messages
    messages: messagesList,
    
    // Filters
    conversationFilters,
    updateConversationFilters,
    clearConversationFilters,
    
    // Search
    searchQuery,
    setSearchQuery,
    
    // Statistics
    statistics: statistics.data,
    unreadCount,
    
    // Typing
    activeTypingUsers,
    startTyping: () => activeConversationId && startTyping(activeConversationId),
    stopTyping: () => activeConversationId && stopTyping(activeConversationId),
    
    // Actions
    sendTextMessage,
    sendFileMessage,
    createConversation: createConversation.mutate,
    updateConversation: updateConversation.mutate,
    markConversationAsRead: markConversationAsRead.mutate,
    
    // Refetch
    refetchConversations: conversations.refetch,
    refetchMessages: messages.refetch,
    
    // Loading states
    isLoadingConversations: conversations.isLoading,
    isLoadingMessages: messages.isLoading,
    isSending: sendMessage.isLoading,
    isUploading: uploadAttachment.isLoading,
    
    // Error states
    error: conversations.error || messages.error || sendMessage.error
  }
}