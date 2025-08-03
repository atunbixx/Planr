'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ConversationList } from '@/components/messages/ConversationList';
import { MessageThread } from '@/components/messages/MessageThread';
import { MessageThreadEnhanced } from '@/components/messages/MessageThreadEnhanced';
import { VendorChatHeader } from '@/components/messages/VendorChatHeader';
import { Card } from '@/components/ui/card';
import { MessageCircle } from 'lucide-react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { PullToRefresh } from '@/components/ui/pull-to-refresh';

// Mock conversations for now
const mockConversations = [
  {
    vendorId: '1',
    vendorName: 'Bloom & Wild Florists',
    vendorCategory: 'Florist',
    lastMessage: {
      content: 'Yes, let\'s schedule a consultation! What times work best for you next week?',
      timestamp: new Date(Date.now() - 3600000), // 1 hour ago
      senderType: 'couple' as const,
    },
    unreadCount: 0,
    isOnline: true,
  },
  {
    vendorId: '2',
    vendorName: 'Harmony String Quartet',
    vendorCategory: 'Musicians',
    lastMessage: {
      content: 'We have availability for your date! Here\'s our repertoire list...',
      timestamp: new Date(Date.now() - 2 * 3600000), // 2 hours ago
      senderType: 'vendor' as const,
    },
    unreadCount: 2,
    isOnline: false,
  },
  {
    vendorId: '3',
    vendorName: 'Captured Moments Photography',
    vendorCategory: 'Photographer',
    lastMessage: {
      content: 'The engagement shoot locations look perfect!',
      timestamp: new Date(Date.now() - 24 * 3600000), // 1 day ago
      senderType: 'vendor' as const,
    },
    unreadCount: 0,
    isOnline: true,
  },
  {
    vendorId: '4',
    vendorName: 'Le Grand Catering',
    vendorCategory: 'Caterer',
    lastMessage: {
      content: 'Menu tasting is confirmed for next Thursday at 3pm',
      timestamp: new Date(Date.now() - 3 * 24 * 3600000), // 3 days ago
      senderType: 'vendor' as const,
    },
    unreadCount: 1,
    isOnline: false,
  },
];

// Mock messages for selected vendor
const getMockMessages = (vendorId: string) => {
  // This would be fetched from Supabase based on vendorId
  return [
    {
      id: '1',
      content: 'Hi! I\'m excited to discuss your wedding plans. How can I help make your special day perfect?',
      senderType: 'vendor' as const,
      senderName: mockConversations.find(c => c.vendorId === vendorId)?.vendorName,
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      isRead: true,
    },
    {
      id: '2',
      content: 'Thank you for reaching out! We\'re looking forward to working with you.',
      senderType: 'couple' as const,
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 3600000),
      isRead: true,
    },
  ];
};

export default function MessagesPage() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [conversations, setConversations] = useState(mockConversations);
  const [selectedVendorId, setSelectedVendorId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const handleRefreshMessages = async () => {
    // Simulate refreshing messages
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // In a real app, this would fetch new messages from the server
    // For now, we'll just update the last message timestamp
    setConversations(prevConversations => 
      prevConversations.map(conv => ({
        ...conv,
        lastMessage: {
          ...conv.lastMessage,
          timestamp: new Date()
        }
      }))
    );
    
    // Refresh current messages if a vendor is selected
    if (selectedVendorId) {
      setMessages(getMockMessages(selectedVendorId));
    }
  };

  useEffect(() => {
    // Check if mobile
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    // Load messages when vendor is selected
    if (selectedVendorId) {
      setMessages(getMockMessages(selectedVendorId));
      
      // Mark messages as read
      setConversations(conversations.map(conv => 
        conv.vendorId === selectedVendorId 
          ? { ...conv, unreadCount: 0 }
          : conv
      ));
    }
  }, [selectedVendorId]);

  const selectedVendor = conversations.find(c => c.vendorId === selectedVendorId);

  const handleSendMessage = async (content: string, attachments?: File[]) => {
    if (!selectedVendorId) return;

    const newMessage = {
      id: Date.now().toString(),
      content,
      senderType: 'couple' as const,
      timestamp: new Date(),
      attachments: attachments?.map(file => ({ name: file.name, size: file.size })),
    };

    setMessages([...messages, newMessage]);

    // Update conversation last message
    setConversations(conversations.map(conv => 
      conv.vendorId === selectedVendorId 
        ? { 
            ...conv, 
            lastMessage: {
              content,
              timestamp: new Date(),
              senderType: 'couple' as const,
            }
          }
        : conv
    ));

    // TODO: Send to Supabase
  };

  const handleReactToMessage = (messageId: string, reaction: string) => {
    setMessages(messages.map(msg => {
      if (msg.id === messageId) {
        const existingReaction = msg.reactions?.find((r: any) => r.reaction === reaction);
        if (existingReaction) {
          if (existingReaction.hasReacted) {
            return {
              ...msg,
              reactions: msg.reactions?.filter((r: any) => r.reaction !== reaction) || [],
            };
          } else {
            return {
              ...msg,
              reactions: msg.reactions?.map((r: any) =>
                r.reaction === reaction
                  ? { ...r, hasReacted: true, count: r.count + 1 }
                  : r
              ),
            };
          }
        } else {
          return {
            ...msg,
            reactions: [...(msg.reactions || []), { reaction, count: 1, hasReacted: true }],
          };
        }
      }
      return msg;
    }));
  };

  const handleSelectConversation = (vendorId: string) => {
    if (isMobile) {
      router.push(`/dashboard/vendors/${vendorId}/messages`);
    } else {
      setSelectedVendorId(vendorId);
    }
  };

  const handleBack = () => {
    setSelectedVendorId(null);
  };

  const handleViewDetails = () => {
    if (selectedVendorId) {
      router.push(`/dashboard/vendors/${selectedVendorId}`);
    }
  };

  const handleViewContract = () => {
    if (selectedVendorId) {
      router.push(`/dashboard/vendors/${selectedVendorId}/contract`);
    }
  };

  const handleScheduleMeeting = () => {
    if (selectedVendorId) {
      router.push(`/dashboard/vendors/${selectedVendorId}/schedule`);
    }
  };

  return (
    <PullToRefresh
      onRefresh={handleRefreshMessages}
      className="h-screen"
      pullText="Pull to refresh messages"
      releaseText="Release to refresh"
      loadingText="Checking for new messages..."
      successText="Messages updated!"
    >
      <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="p-6 bg-white dark:bg-gray-800 border-b">
        <h1 className="text-2xl font-bold">Messages</h1>
        <p className="text-gray-600 dark:text-gray-400">Communicate with your wedding vendors</p>
      </div>

      {/* Content */}
      <div className="flex-1 flex overflow-hidden p-6 gap-6">
        {/* Conversation List */}
        <Card className={`w-full md:w-96 flex flex-col overflow-hidden ${
          isMobile && selectedVendorId ? 'hidden' : ''
        }`}>
          <ConversationList
            conversations={conversations}
            selectedVendorId={selectedVendorId || undefined}
            onSelectConversation={handleSelectConversation}
          />
        </Card>

        {/* Message Thread */}
        {!isMobile && (
          <Card className="flex-1 flex flex-col overflow-hidden">
            {selectedVendor ? (
              <>
                <VendorChatHeader
                  vendorName={selectedVendor.vendorName}
                  vendorCategory={selectedVendor.vendorCategory}
                  isOnline={selectedVendor.isOnline}
                  onBack={isMobile ? handleBack : undefined}
                  onViewDetails={handleViewDetails}
                  onViewContract={handleViewContract}
                  onScheduleMeeting={handleScheduleMeeting}
                />
                <MessageThread
                  messages={messages}
                  onSendMessage={handleSendMessage}
                  onReactToMessage={handleReactToMessage}
                  isLoading={isLoading}
                />
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
                <MessageCircle className="h-16 w-16 text-gray-300 dark:text-gray-600 mb-4" />
                <h3 className="text-xl font-medium text-gray-900 dark:text-gray-100 mb-2">
                  Select a conversation
                </h3>
                <p className="text-gray-600 dark:text-gray-400 max-w-sm">
                  Choose a vendor from the list to start messaging
                </p>
              </div>
            )}
          </Card>
        )}
      </div>
    </div>
    </PullToRefresh>
  );
}