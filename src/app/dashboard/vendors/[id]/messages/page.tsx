'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { MessageThread } from '@/components/messages/MessageThread';
import { VendorChatHeader } from '@/components/messages/VendorChatHeader';
import { Card } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

// Mock data for now - will be replaced with real data
const mockMessages = [
  {
    id: '1',
    content: 'Hi! I\'m excited to discuss the floral arrangements for your wedding. I\'ve reviewed your vision board and have some amazing ideas!',
    senderType: 'vendor' as const,
    senderName: 'Sarah from Bloom & Wild',
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    isRead: true,
  },
  {
    id: '2',
    content: 'That sounds wonderful! We\'re particularly interested in the romantic garden theme with lots of peonies and roses.',
    senderType: 'couple' as const,
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 3600000), // 2 days ago + 1 hour
    isRead: true,
  },
  {
    id: '3',
    content: 'Perfect choice! Peonies and roses are absolutely stunning together. I can create beautiful cascading bouquets with those. Would you like to schedule a consultation to discuss the details?',
    senderType: 'vendor' as const,
    senderName: 'Sarah from Bloom & Wild',
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
    isRead: true,
    reactions: [{ reaction: '❤️', count: 1, hasReacted: true }],
  },
  {
    id: '4',
    content: 'Yes, let\'s schedule a consultation! What times work best for you next week?',
    senderType: 'couple' as const,
    timestamp: new Date(Date.now() - 3600000), // 1 hour ago
    isRead: true,
  },
];

export default function VendorMessagesPage() {
  const params = useParams();
  const router = useRouter();
  const vendorId = params.id as string;
  const supabase = createClientComponentClient();

  const [messages, setMessages] = useState(mockMessages);
  const [isLoading, setIsLoading] = useState(false);
  const [vendorInfo, setVendorInfo] = useState({
    name: 'Bloom & Wild Florists',
    category: 'Florist',
    isOnline: true,
    lastSeen: new Date(),
  });

  const handleSendMessage = async (content: string, attachments?: File[]) => {
    const newMessage = {
      id: Date.now().toString(),
      content,
      senderType: 'couple' as const,
      timestamp: new Date(),
      attachments: attachments?.map(file => ({ name: file.name, size: file.size })),
    };

    setMessages([...messages, newMessage]);

    // TODO: Send to Supabase
  };

  const handleReactToMessage = (messageId: string, reaction: string) => {
    setMessages(messages.map(msg => {
      if (msg.id === messageId) {
        const existingReaction = msg.reactions?.find(r => r.reaction === reaction);
        if (existingReaction) {
          // Toggle reaction
          if (existingReaction.hasReacted) {
            return {
              ...msg,
              reactions: msg.reactions?.filter(r => r.reaction !== reaction) || [],
            };
          } else {
            return {
              ...msg,
              reactions: msg.reactions?.map(r =>
                r.reaction === reaction
                  ? { ...r, hasReacted: true, count: r.count + 1 }
                  : r
              ),
            };
          }
        } else {
          // Add new reaction
          return {
            ...msg,
            reactions: [...(msg.reactions || []), { reaction, count: 1, hasReacted: true }],
          };
        }
      }
      return msg;
    }));
  };

  const handleBack = () => {
    router.push('/dashboard/messages');
  };

  const handleViewDetails = () => {
    router.push(`/dashboard/vendors/${vendorId}`);
  };

  const handleViewContract = () => {
    router.push(`/dashboard/vendors/${vendorId}/contract`);
  };

  const handleScheduleMeeting = () => {
    router.push(`/dashboard/vendors/${vendorId}/schedule`);
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Mobile back button */}
      <div className="md:hidden flex items-center gap-2 p-4 bg-white dark:bg-gray-800 border-b">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleBack}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-semibold">Messages</h1>
      </div>

      {/* Desktop header */}
      <div className="hidden md:block p-6 bg-white dark:bg-gray-800 border-b">
        <h1 className="text-2xl font-bold">Vendor Messages</h1>
        <p className="text-gray-600 dark:text-gray-400">Communicate with your wedding vendors</p>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <Card className="flex-1 flex flex-col m-0 md:m-6 rounded-none md:rounded-lg overflow-hidden">
          <VendorChatHeader
            vendorName={vendorInfo.name}
            vendorCategory={vendorInfo.category}
            isOnline={vendorInfo.isOnline}
            lastSeen={vendorInfo.lastSeen}
            onBack={handleBack}
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
        </Card>
      </div>
    </div>
  );
}