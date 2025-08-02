'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { MessageBubble } from './MessageBubble';
import { MessageInput } from './MessageInput';
import { 
  Loader2, Phone, Mail, MessageSquare, AlertCircle, CheckCircle2, 
  Clock, WifiOff, Send, ExternalLink 
} from 'lucide-react';
import { format, isToday, isYesterday } from 'date-fns';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { RealtimeChannel } from '@supabase/realtime-js';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  content: string;
  sender_type: 'couple' | 'vendor' | 'system';
  sender_name?: string;
  sender_avatar?: string;
  created_at: string;
  is_read?: boolean;
  read_at?: string;
  is_edited?: boolean;
  edited_at?: string;
  attachments?: any[];
  reactions?: { reaction: string; count: number; hasReacted: boolean }[];
  parent_message_id?: string;
  metadata?: {
    source?: 'sms' | 'whatsapp' | 'email' | 'web_app';
    external_send_results?: {
      sms: boolean;
      whatsapp: boolean;
      email: boolean;
      errors: string[];
    };
  };
}

interface Vendor {
  id: string;
  name: string;
  business_name?: string;
  email?: string;
  phone?: string;
  sms_enabled?: boolean;
  whatsapp_enabled?: boolean;
  email_notifications_enabled?: boolean;
}

interface MessageThreadExternalProps {
  vendorId: string;
  vendor: Vendor;
  threadId?: string;
  coupleId: string;
  className?: string;
}

export function MessageThreadExternal({
  vendorId,
  vendor,
  threadId,
  coupleId,
  className
}: MessageThreadExternalProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUser, setTypingUser] = useState<string>('');
  const [currentThreadId, setCurrentThreadId] = useState(threadId);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected'>('connected');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const realtimeChannelRef = useRef<RealtimeChannel | null>(null);
  const supabase = createClientComponentClient();

  // Load messages
  const loadMessages = useCallback(async () => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('vendor_messages')
        .select(`
          *,
          message_media (*)
        `)
        .eq('vendor_id', vendorId)
        .eq('couple_id', coupleId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      setMessages(data || []);
      
      // Get thread ID from the first message if not provided
      if (!currentThreadId && data && data.length > 0) {
        setCurrentThreadId(data[0].thread_id);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setIsLoading(false);
    }
  }, [vendorId, coupleId, currentThreadId, supabase]);

  // Setup realtime subscription
  useEffect(() => {
    loadMessages();

    // Subscribe to new messages
    const channel = supabase
      .channel(`messages:${vendorId}:${coupleId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'vendor_messages',
          filter: `vendor_id=eq.${vendorId}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
          scrollToBottom();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'vendor_messages',
          filter: `vendor_id=eq.${vendorId}`,
        },
        (payload) => {
          setMessages((prev) =>
            prev.map((msg) => (msg.id === payload.new.id ? payload.new as Message : msg))
          );
        }
      )
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const typing = Object.values(state).some((presence: any) =>
          presence.some((p: any) => p.is_typing && p.user_id !== coupleId)
        );
        setIsTyping(typing);
        if (typing) {
          setTypingUser(vendor.name);
        }
      })
      .subscribe((status) => {
        setConnectionStatus(status === 'SUBSCRIBED' ? 'connected' : 'disconnected');
      });

    realtimeChannelRef.current = channel;

    return () => {
      channel.unsubscribe();
    };
  }, [vendorId, coupleId, vendor.name, supabase]);

  // Send message
  const handleSendMessage = async (content: string, attachments?: File[]) => {
    if (!content.trim() && (!attachments || attachments.length === 0)) return;

    setIsSending(true);

    try {
      // Upload attachments first if any
      const uploadedAttachments = [];
      if (attachments && attachments.length > 0) {
        for (const file of attachments) {
          const filename = `${Date.now()}_${file.name}`;
          const path = `messages/${vendorId}/${filename}`;
          
          const { data, error } = await supabase.storage
            .from('attachments')
            .upload(path, file);

          if (!error && data) {
            const { data: { publicUrl } } = supabase.storage
              .from('attachments')
              .getPublicUrl(path);

            uploadedAttachments.push({
              url: publicUrl,
              filename: file.name,
              type: file.type,
              size: file.size
            });
          }
        }
      }

      // Send message via API
      const response = await fetch('/api/messages/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          vendor_id: vendorId,
          content,
          thread_id: currentThreadId,
          attachments: uploadedAttachments,
          send_external: true // Enable external messaging
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const result = await response.json();
      
      // Update thread ID if new
      if (result.thread_id && !currentThreadId) {
        setCurrentThreadId(result.thread_id);
      }

    } catch (error) {
      console.error('Error sending message:', error);
      // Show error notification
    } finally {
      setIsSending(false);
    }
  };

  // Handle typing indicator
  const handleTyping = useCallback(() => {
    if (realtimeChannelRef.current) {
      realtimeChannelRef.current.track({
        is_typing: true,
        user_id: coupleId,
        timestamp: new Date().toISOString(),
      });

      // Clear typing after 3 seconds
      setTimeout(() => {
        realtimeChannelRef.current?.track({
          is_typing: false,
          user_id: coupleId,
          timestamp: new Date().toISOString(),
        });
      }, 3000);
    }
  }, [coupleId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatDateSeparator = (date: Date) => {
    if (isToday(date)) return 'Today';
    if (isYesterday(date)) return 'Yesterday';
    return format(date, 'EEEE, MMMM d, yyyy');
  };

  const shouldShowDateSeparator = (currentMsg: Message, prevMsg?: Message) => {
    if (!prevMsg) return true;
    const currentDate = new Date(currentMsg.created_at);
    const prevDate = new Date(prevMsg.created_at);
    return format(currentDate, 'yyyy-MM-dd') !== format(prevDate, 'yyyy-MM-dd');
  };

  const getSourceIcon = (source?: string) => {
    switch (source) {
      case 'sms':
        return <Phone className="h-3 w-3" />;
      case 'whatsapp':
        return <MessageSquare className="h-3 w-3" />;
      case 'email':
        return <Mail className="h-3 w-3" />;
      default:
        return null;
    }
  };

  const getDeliveryStatus = (metadata?: Message['metadata']) => {
    if (!metadata?.external_send_results) return null;
    
    const { sms, whatsapp, email, errors } = metadata.external_send_results;
    const hasErrors = errors && errors.length > 0;
    const allSuccess = sms || whatsapp || email;

    if (hasErrors && !allSuccess) {
      return (
        <div className="flex items-center gap-1 text-xs text-red-500">
          <AlertCircle className="h-3 w-3" />
          <span>Failed to send</span>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-2 text-xs text-gray-500">
        {sms && <Phone className="h-3 w-3" title="Sent via SMS" />}
        {whatsapp && <MessageSquare className="h-3 w-3" title="Sent via WhatsApp" />}
        {email && <Mail className="h-3 w-3" title="Sent via Email" />}
        <CheckCircle2 className="h-3 w-3 text-green-500" />
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-pink-500" />
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Connection status */}
      {connectionStatus === 'disconnected' && (
        <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-2">
          <div className="flex items-center gap-2 text-sm text-yellow-800">
            <WifiOff className="h-4 w-4" />
            <span>Connection lost. Messages will sync when reconnected.</span>
          </div>
        </div>
      )}

      {/* Vendor contact info bar */}
      <div className="bg-gray-50 border-b px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium">{vendor.business_name || vendor.name}</h3>
            <div className="flex items-center gap-3 text-sm text-gray-600 mt-1">
              {vendor.phone && (
                <span className="flex items-center gap-1">
                  <Phone className="h-3 w-3" />
                  {vendor.phone}
                </span>
              )}
              {vendor.email && (
                <span className="flex items-center gap-1">
                  <Mail className="h-3 w-3" />
                  {vendor.email}
                </span>
              )}
            </div>
          </div>
          <div className="text-sm text-gray-500">
            External messaging enabled
          </div>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-12">
            <Send className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium mb-2">No messages yet</p>
            <p className="text-sm">
              Send a message and {vendor.name} will receive it via{' '}
              {[
                vendor.sms_enabled && 'SMS',
                vendor.whatsapp_enabled && 'WhatsApp',
                vendor.email_notifications_enabled && 'Email'
              ].filter(Boolean).join(', ') || 'their preferred method'}
            </p>
          </div>
        ) : (
          <>
            {messages.map((message, index) => {
              const prevMessage = index > 0 ? messages[index - 1] : undefined;
              const showDateSeparator = shouldShowDateSeparator(message, prevMessage);
              const messageDate = new Date(message.created_at);

              return (
                <React.Fragment key={message.id}>
                  {showDateSeparator && (
                    <div className="relative my-6">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-200" />
                      </div>
                      <div className="relative flex justify-center text-sm">
                        <span className="px-3 bg-white text-gray-500">
                          {formatDateSeparator(messageDate)}
                        </span>
                      </div>
                    </div>
                  )}
                  
                  <div className="mb-4">
                    <MessageBubble
                      id={message.id}
                      content={message.content}
                      senderType={message.sender_type}
                      senderName={message.sender_name}
                      timestamp={messageDate}
                      isRead={message.is_read}
                      attachments={message.attachments}
                      reactions={message.reactions}
                    />
                    
                    {/* Show source and delivery status for messages */}
                    <div className="flex items-center gap-2 mt-1 px-2">
                      {message.metadata?.source && (
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          {getSourceIcon(message.metadata.source)}
                          <span>via {message.metadata.source}</span>
                        </div>
                      )}
                      {message.sender_type === 'couple' && getDeliveryStatus(message.metadata)}
                    </div>
                  </div>
                </React.Fragment>
              );
            })}
            
            {/* Typing indicator */}
            {isTyping && (
              <div className="mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>{typingUser} is typing...</span>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Message input */}
      <div className="border-t px-4 py-4">
        <MessageInput
          onSendMessage={handleSendMessage}
          onTyping={handleTyping}
          disabled={isSending}
          placeholder={`Message ${vendor.name}...`}
        />
        {isSending && (
          <div className="flex items-center gap-2 text-sm text-gray-500 mt-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Sending message...</span>
          </div>
        )}
      </div>
    </div>
  );
}