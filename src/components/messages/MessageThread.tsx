'use client';

import React, { useEffect, useRef, useState } from 'react';
import { MessageBubble } from './MessageBubble';
import { MessageInput } from './MessageInput';
import { Loader2 } from 'lucide-react';
import { format, isToday, isYesterday, formatDistanceToNow } from 'date-fns';

interface Message {
  id: string;
  content: string;
  senderType: 'couple' | 'vendor' | 'system';
  senderName?: string;
  senderAvatar?: string;
  timestamp: Date;
  isRead?: boolean;
  readAt?: Date;
  isEdited?: boolean;
  editedAt?: Date;
  attachments?: any[];
  reactions?: { reaction: string; count: number; hasReacted: boolean }[];
  parentMessageId?: string;
}

interface MessageThreadProps {
  messages: Message[];
  onSendMessage: (content: string, attachments?: File[]) => void;
  onEditMessage?: (id: string, content: string) => void;
  onDeleteMessage?: (id: string) => void;
  onReactToMessage?: (id: string, reaction: string) => void;
  onReplyToMessage?: (id: string) => void;
  onTyping?: () => void;
  isLoading?: boolean;
  isTyping?: boolean;
  typingUser?: string;
}

export function MessageThread({
  messages,
  onSendMessage,
  onEditMessage,
  onDeleteMessage,
  onReactToMessage,
  onReplyToMessage,
  onTyping,
  isLoading = false,
  isTyping = false,
  typingUser,
}: MessageThreadProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const formatDateSeparator = (date: Date) => {
    if (isToday(date)) return 'Today';
    if (isYesterday(date)) return 'Yesterday';
    return format(date, 'EEEE, MMMM d, yyyy');
  };

  const shouldShowDateSeparator = (currentMsg: Message, prevMsg?: Message) => {
    if (!prevMsg) return true;
    return !isToday(currentMsg.timestamp) || 
           format(currentMsg.timestamp, 'yyyy-MM-dd') !== format(prevMsg.timestamp, 'yyyy-MM-dd');
  };

  const handleEdit = (id: string) => {
    setEditingMessageId(id);
    // TODO: Implement edit mode in MessageInput
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this message?')) {
      onDeleteMessage?.(id);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-pink-500" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 dark:text-gray-400 py-12">
            <p className="text-lg font-medium mb-2">No messages yet</p>
            <p className="text-sm">Start the conversation by sending a message!</p>
          </div>
        ) : (
          <>
            {messages.map((message, index) => {
              const prevMessage = index > 0 ? messages[index - 1] : undefined;
              const showDateSeparator = shouldShowDateSeparator(message, prevMessage);

              return (
                <React.Fragment key={message.id}>
                  {showDateSeparator && (
                    <div className="flex items-center gap-4 my-6">
                      <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
                      <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                        {formatDateSeparator(message.timestamp)}
                      </span>
                      <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
                    </div>
                  )}
                  <MessageBubble
                    {...message}
                    onEdit={onEditMessage ? handleEdit : undefined}
                    onDelete={onDeleteMessage ? handleDelete : undefined}
                    onReact={onReactToMessage}
                    onReply={onReplyToMessage}
                  />
                </React.Fragment>
              );
            })}

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

      {/* Input area */}
      <div className="border-t px-4 py-4">
        <MessageInput
          onSendMessage={onSendMessage}
          onTyping={onTyping}
          disabled={isLoading}
        />
      </div>
    </div>
  );
}