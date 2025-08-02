'use client';

import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { MessageBubble } from './MessageBubble';
import { MessageInput } from './MessageInput';
import { MessageStatus } from './MessageStatus';
import { ConnectionStatus } from './ConnectionStatus';
import { QuickReplies } from './QuickReplies';
import { Loader2, AlertCircle, RefreshCw, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import { format, isToday, isYesterday } from 'date-fns';
import { MessagingService, Message, MessageThread as Thread } from '@/lib/services/messaging.service';
import { getNotificationService } from '@/lib/services/notification.service';
import { useDebounce } from '@/hooks/useDebounce';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

interface MessageThreadEnhancedProps {
  thread: Thread;
  currentUserId: string;
  isVendor?: boolean;
  onClose?: () => void;
}

export function MessageThreadEnhanced({
  thread,
  currentUserId,
  isVendor = false,
  onClose
}: MessageThreadEnhancedProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sendingMessages, setSendingMessages] = useState<Set<string>>(new Set());
  const [failedMessages, setFailedMessages] = useState<Set<string>>(new Set());
  const [isTyping, setIsTyping] = useState(false);
  const [typingUser, setTypingUser] = useState<string | null>(null);
  const [showQuickReplies, setShowQuickReplies] = useState(false);
  const [retryingMessages, setRetryingMessages] = useState<Set<string>>(new Set());
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagingService = useRef<MessagingService>(new MessagingService());
  const notificationService = useRef(getNotificationService());
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const debouncedTyping = useDebounce(() => {
    messagingService.current.sendTypingIndicator(thread.id, false);
  }, 3000);

  // Load messages
  useEffect(() => {
    loadMessages();
    
    // Mark messages as read
    messagingService.current.markMessagesAsRead(thread.id);
    
    // Subscribe to realtime updates
    const subscription = messagingService.current.subscribeToThread(thread.id, {
      onMessage: handleNewMessage,
      onTyping: handleTypingUpdate,
      onStatusUpdate: handleStatusUpdate
    });

    // Connection monitoring
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      subscription.then(channel => channel?.unsubscribe());
      messagingService.current.cleanup();
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [thread.id]);

  // Scroll to bottom on new messages
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadMessages = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const { data, error } = await messagingService.current.supabase
        .from('vendor_messages')
        .select(`
          *,
          attachments:message_attachments(*),
          reactions:message_reactions(reaction, user_id)
        `)
        .eq('thread_id', thread.id)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Process reactions
      const processedMessages = data.map(msg => ({
        ...msg,
        reactions: processReactions(msg.reactions)
      }));

      setMessages(processedMessages);
    } catch (err) {
      console.error('Error loading messages:', err);
      setError('Failed to load messages. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const processReactions = (reactions: any[]) => {
    const grouped = reactions.reduce((acc, r) => {
      if (!acc[r.reaction]) {
        acc[r.reaction] = { reaction: r.reaction, count: 0, has_reacted: false };
      }
      acc[r.reaction].count++;
      if (r.user_id === currentUserId) {
        acc[r.reaction].has_reacted = true;
      }
      return acc;
    }, {});
    
    return Object.values(grouped);
  };

  const handleNewMessage = (message: Message) => {
    // Don't add if it's our own message (already added optimistically)
    if (message.sender_user_id === currentUserId) return;
    
    setMessages(prev => [...prev, message]);
    
    // Show notification if page is not visible
    if (document.visibilityState === 'hidden') {
      notificationService.current.showMessageNotification({
        senderName: message.sender_name || 'Someone',
        content: message.content,
        threadId: thread.id,
        vendorName: isVendor ? undefined : thread.vendor?.name
      });
    }
    
    // Play sound
    notificationService.current.playSound();
    
    // Mark as read if visible
    if (document.visibilityState === 'visible') {
      messagingService.current.markMessagesAsRead(thread.id);
    }
  };

  const handleTypingUpdate = ({ user_id, is_typing }: { user_id: string; is_typing: boolean }) => {
    if (user_id !== currentUserId) {
      setIsTyping(is_typing);
      setTypingUser(is_typing ? user_id : null);
    }
  };

  const handleStatusUpdate = ({ message_id, status }: { message_id: string; status: string }) => {
    setMessages(prev => prev.map(msg => 
      msg.id === message_id ? { ...msg, status } : msg
    ));
    
    // Remove from sending/failed sets based on status
    if (status === 'sent' || status === 'delivered' || status === 'read') {
      setSendingMessages(prev => {
        const next = new Set(prev);
        next.delete(message_id);
        return next;
      });
      setFailedMessages(prev => {
        const next = new Set(prev);
        next.delete(message_id);
        return next;
      });
    } else if (status === 'failed') {
      setSendingMessages(prev => {
        const next = new Set(prev);
        next.delete(message_id);
        return next;
      });
      setFailedMessages(prev => new Set(prev).add(message_id));
    }
  };

  const handleSendMessage = async (content: string, attachments?: File[]) => {
    const tempId = `temp_${Date.now()}`;
    const optimisticMessage: Message = {
      id: tempId,
      thread_id: thread.id,
      couple_id: thread.couple_id,
      vendor_id: thread.vendor_id,
      content,
      message_type: attachments && attachments.length > 0 ? 'file' : 'text',
      sender_type: isVendor ? 'vendor' : 'couple',
      sender_user_id: currentUserId,
      sender_name: 'You',
      status: 'sending',
      error_count: 0,
      is_edited: false,
      metadata: {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      attachments: attachments?.map(f => ({
        id: `temp_${Date.now()}`,
        filename: f.name,
        file_size: f.size,
        mime_type: f.type,
        storage_path: ''
      }))
    };

    // Add optimistic message
    setMessages(prev => [...prev, optimisticMessage]);
    setSendingMessages(prev => new Set(prev).add(tempId));
    
    try {
      const result = await messagingService.current.sendMessage(
        thread.id,
        content,
        { attachments }
      );

      if (result) {
        // Replace optimistic message with real one
        setMessages(prev => prev.map(msg => 
          msg.id === tempId ? result : msg
        ));
        setSendingMessages(prev => {
          const next = new Set(prev);
          next.delete(tempId);
          return next;
        });
      } else {
        throw new Error('Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setFailedMessages(prev => new Set(prev).add(tempId));
      setSendingMessages(prev => {
        const next = new Set(prev);
        next.delete(tempId);
        return next;
      });
    }
  };

  const handleRetryMessage = async (messageId: string) => {
    const message = messages.find(m => m.id === messageId);
    if (!message) return;

    setRetryingMessages(prev => new Set(prev).add(messageId));
    setFailedMessages(prev => {
      const next = new Set(prev);
      next.delete(messageId);
      return next;
    });

    try {
      const result = await messagingService.current.sendMessage(
        thread.id,
        message.content,
        { messageType: message.message_type }
      );

      if (result) {
        // Replace failed message with new one
        setMessages(prev => prev.map(msg => 
          msg.id === messageId ? result : msg
        ));
      }
    } catch (error) {
      console.error('Error retrying message:', error);
      setFailedMessages(prev => new Set(prev).add(messageId));
    } finally {
      setRetryingMessages(prev => {
        const next = new Set(prev);
        next.delete(messageId);
        return next;
      });
    }
  };

  const handleTyping = () => {
    messagingService.current.sendTypingIndicator(thread.id, true);
    debouncedTyping();
  };

  const handleReactToMessage = async (messageId: string, reaction: string) => {
    await messagingService.current.reactToMessage(messageId, reaction);
    
    // Optimistic update
    setMessages(prev => prev.map(msg => {
      if (msg.id === messageId) {
        const existingReaction = msg.reactions?.find(r => r.reaction === reaction);
        if (existingReaction) {
          if (existingReaction.has_reacted) {
            // Remove reaction
            return {
              ...msg,
              reactions: msg.reactions?.filter(r => r.reaction !== reaction) || []
            };
          } else {
            // Add reaction
            return {
              ...msg,
              reactions: msg.reactions?.map(r =>
                r.reaction === reaction
                  ? { ...r, has_reacted: true, count: r.count + 1 }
                  : r
              )
            };
          }
        } else {
          // New reaction
          return {
            ...msg,
            reactions: [...(msg.reactions || []), { reaction, count: 1, has_reacted: true }]
          };
        }
      }
      return msg;
    }));
  };

  const handleQuickReply = (template: string) => {
    handleSendMessage(template);
    setShowQuickReplies(false);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatDateSeparator = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isToday(d)) return 'Today';
    if (isYesterday(d)) return 'Yesterday';
    return format(d, 'EEEE, MMMM d, yyyy');
  };

  const shouldShowDateSeparator = (currentMsg: Message, prevMsg?: Message) => {
    if (!prevMsg) return true;
    const current = new Date(currentMsg.created_at);
    const prev = new Date(prevMsg.created_at);
    return format(current, 'yyyy-MM-dd') !== format(prev, 'yyyy-MM-dd');
  };

  const groupedMessages = useMemo(() => {
    const groups: { date: string; messages: Message[] }[] = [];
    let currentGroup: { date: string; messages: Message[] } | null = null;

    messages.forEach((message, index) => {
      const prevMessage = index > 0 ? messages[index - 1] : undefined;
      
      if (shouldShowDateSeparator(message, prevMessage)) {
        currentGroup = {
          date: formatDateSeparator(message.created_at),
          messages: [message]
        };
        groups.push(currentGroup);
      } else if (currentGroup) {
        currentGroup.messages.push(message);
      }
    });

    return groups;
  }, [messages]);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-pink-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
          <Button
            variant="outline"
            size="sm"
            onClick={loadMessages}
            className="ml-auto"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </Alert>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full relative">
      {/* Connection status */}
      <ConnectionStatus isOnline={isOnline} />

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 dark:text-gray-400 py-12">
            <p className="text-lg font-medium mb-2">No messages yet</p>
            <p className="text-sm">Start the conversation by sending a message!</p>
          </div>
        ) : (
          <>
            {groupedMessages.map((group, groupIndex) => (
              <div key={groupIndex}>
                {/* Date separator */}
                <div className="flex items-center gap-4 my-6">
                  <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
                  <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                    {group.date}
                  </span>
                  <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
                </div>

                {/* Messages in group */}
                {group.messages.map((message) => (
                  <div key={message.id} className="relative">
                    <MessageBubble
                      {...message}
                      onReact={handleReactToMessage}
                      className={cn(
                        failedMessages.has(message.id) && 'opacity-70',
                        retryingMessages.has(message.id) && 'animate-pulse'
                      )}
                    />
                    
                    {/* Message status */}
                    {message.sender_user_id === currentUserId && (
                      <MessageStatus
                        status={
                          sendingMessages.has(message.id) ? 'sending' :
                          failedMessages.has(message.id) ? 'failed' :
                          retryingMessages.has(message.id) ? 'retrying' :
                          message.status
                        }
                        onRetry={() => handleRetryMessage(message.id)}
                      />
                    )}
                  </div>
                ))}
              </div>
            ))}

            {/* Typing indicator */}
            {isTyping && (
              <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-sm mb-4">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span>{typingUser || 'Someone'} is typing...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Quick replies */}
      {showQuickReplies && (
        <QuickReplies
          vendorId={thread.vendor_id}
          onSelect={handleQuickReply}
          onClose={() => setShowQuickReplies(false)}
        />
      )}

      {/* Input area */}
      <div className="border-t px-4 py-4">
        <MessageInput
          onSendMessage={handleSendMessage}
          onTyping={handleTyping}
          onShowQuickReplies={() => setShowQuickReplies(true)}
          disabled={!isOnline}
          placeholder={isOnline ? 'Type your message...' : 'No connection...'}
        />
      </div>
    </div>
  );
}