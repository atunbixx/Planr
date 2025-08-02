'use client';

import React, { useState, useMemo } from 'react';
import { format, formatDistanceToNow } from 'date-fns';
import { MessageCircle, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { MessageSearch } from './MessageSearch';

interface Conversation {
  vendorId: string;
  vendorName: string;
  vendorCategory?: string;
  vendorAvatar?: string;
  lastMessage?: {
    content: string;
    timestamp: Date;
    senderType: 'couple' | 'vendor' | 'system';
  };
  unreadCount: number;
  isOnline?: boolean;
}

interface ConversationListProps {
  conversations: Conversation[];
  selectedVendorId?: string;
  onSelectConversation: (vendorId: string) => void;
  className?: string;
}

export function ConversationList({
  conversations,
  selectedVendorId,
  onSelectConversation,
  className,
}: ConversationListProps) {
  const [searchQuery, setSearchQuery] = useState('');

  // Filter conversations based on search
  const filteredConversations = useMemo(() => {
    if (!searchQuery) return conversations;
    
    const query = searchQuery.toLowerCase();
    return conversations.filter(
      (conv) =>
        conv.vendorName.toLowerCase().includes(query) ||
        conv.vendorCategory?.toLowerCase().includes(query) ||
        conv.lastMessage?.content.toLowerCase().includes(query)
    );
  }, [conversations, searchQuery]);

  const getAvatarFallback = (name: string) => {
    return name
      .split(' ')
      .map((word) => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatLastMessage = (message: Conversation['lastMessage']) => {
    if (!message) return 'No messages yet';
    
    const prefix = message.senderType === 'couple' ? 'You: ' : '';
    const content = message.content.length > 50 
      ? `${message.content.substring(0, 50)}...` 
      : message.content;
    
    return `${prefix}${content}`;
  };

  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-6">
        <MessageCircle className="h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
          No conversations yet
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 max-w-sm">
          Start messaging your vendors to coordinate your perfect wedding day
        </p>
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col', className)}>
      <div className="p-4 border-b space-y-3">
        <div>
          <h2 className="text-lg font-semibold">Messages</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {filteredConversations.length} of {conversations.length} conversations
          </p>
        </div>
        <MessageSearch onSearch={setSearchQuery} />
      </div>

      <div className="flex-1 overflow-y-auto">
        {filteredConversations.length === 0 ? (
          <div className="text-center p-6">
            <p className="text-gray-500 dark:text-gray-400">
              No conversations found matching "{searchQuery}"
            </p>
          </div>
        ) : (
          filteredConversations.map((conversation) => (
          <button
            key={conversation.vendorId}
            onClick={() => onSelectConversation(conversation.vendorId)}
            className={cn(
              'w-full flex items-start gap-3 p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left',
              selectedVendorId === conversation.vendorId && 'bg-gray-50 dark:bg-gray-800'
            )}
          >
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              {conversation.vendorAvatar ? (
                <img
                  src={conversation.vendorAvatar}
                  alt={conversation.vendorName}
                  className="w-12 h-12 rounded-full object-cover"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-pink-100 dark:bg-pink-900/20 flex items-center justify-center">
                  <span className="text-sm font-medium text-pink-600 dark:text-pink-400">
                    {getAvatarFallback(conversation.vendorName)}
                  </span>
                </div>
              )}
              {conversation.isOnline && (
                <Circle className="absolute bottom-0 right-0 w-3 h-3 fill-green-500 text-green-500" />
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-1">
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900 dark:text-gray-100 truncate">
                    {conversation.vendorName}
                  </h3>
                  {conversation.vendorCategory && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {conversation.vendorCategory}
                    </p>
                  )}
                </div>
                {conversation.lastMessage && (
                  <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
                    {formatDistanceToNow(conversation.lastMessage.timestamp, { addSuffix: true })}
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between gap-2">
                <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                  {formatLastMessage(conversation.lastMessage)}
                </p>
                {conversation.unreadCount > 0 && (
                  <Badge variant="default" className="bg-pink-500 hover:bg-pink-600 flex-shrink-0">
                    {conversation.unreadCount}
                  </Badge>
                )}
              </div>
            </div>
          </button>
          ))
        )}
      </div>
    </div>
  );
}