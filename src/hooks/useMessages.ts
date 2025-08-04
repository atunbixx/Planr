import { useState, useEffect, useCallback } from 'react';
import { toast } from '@/hooks/use-toast';

export interface MessageLog {
  id: string;
  recipient_email?: string;
  recipient_phone?: string;
  message_type: 'email' | 'sms' | 'whatsapp';
  subject?: string;
  body: string;
  status: 'pending' | 'sent' | 'delivered' | 'failed' | 'bounced' | 'complained';
  error_message?: string;
  sent_at?: string;
  delivered_at?: string;
  opened_at?: string;
  clicked_at?: string;
  created_at: string;
}

export interface MessageStats {
  total: number;
  sent: number;
  delivered: number;
  failed: number;
  opened: number;
  clicked: number;
}

export function useMessages() {
  const [messageLogs, setMessageLogs] = useState<MessageLog[]>([]);
  const [stats, setStats] = useState<MessageStats>({
    total: 0,
    sent: 0,
    delivered: 0,
    failed: 0,
    opened: 0,
    clicked: 0,
  });
  const [isLoading, setIsLoading] = useState(false);

  const fetchMessageLogs = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/messages/logs');
      if (response.ok) {
        const data = await response.json();
        setMessageLogs(data);
        
        // Calculate stats
        const newStats: MessageStats = {
          total: data.length,
          sent: data.filter((m: MessageLog) => m.status === 'sent' || m.status === 'delivered').length,
          delivered: data.filter((m: MessageLog) => m.status === 'delivered').length,
          failed: data.filter((m: MessageLog) => m.status === 'failed' || m.status === 'bounced').length,
          opened: data.filter((m: MessageLog) => m.opened_at).length,
          clicked: data.filter((m: MessageLog) => m.clicked_at).length,
        };
        setStats(newStats);
      }
    } catch (error) {
      console.error('Error fetching message logs:', error);
      toast({
        title: 'Error',
        description: 'Failed to load message history',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  const sendBulkMessages = async (
    recipientIds: string[],
    recipientType: 'guest' | 'vendor',
    messageType: 'email' | 'sms' | 'whatsapp',
    templateId?: string,
    customSubject?: string,
    customBody?: string,
    variables?: Record<string, any>,
    scheduledFor?: string
  ) => {
    try {
      const response = await fetch('/api/messages/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipientIds,
          recipientType,
          messageType,
          templateId,
          customSubject,
          customBody,
          variables,
          scheduledFor,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send messages');
      }

      return data;
    } catch (error) {
      console.error('Error sending messages:', error);
      throw error;
    }
  };

  const sendTestMessage = async (
    messageType: 'email' | 'sms' | 'whatsapp',
    testRecipient: string,
    subject?: string,
    body?: string
  ) => {
    try {
      const response = await fetch('/api/messages/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messageType,
          testRecipient,
          subject,
          body,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send test message');
      }

      toast({
        title: 'Test Message Sent',
        description: `Test ${messageType} sent successfully to ${testRecipient}`,
      });

      return data;
    } catch (error) {
      console.error('Error sending test message:', error);
      toast({
        title: 'Error',
        description: `Failed to send test ${messageType}`,
        variant: 'destructive',
      });
      throw error;
    }
  };

  const getDeliveryRate = () => {
    if (stats.total === 0) return 0;
    return Math.round((stats.delivered / stats.total) * 100);
  };

  const getOpenRate = () => {
    if (stats.sent === 0) return 0;
    return Math.round((stats.opened / stats.sent) * 100);
  };

  const getClickRate = () => {
    if (stats.opened === 0) return 0;
    return Math.round((stats.clicked / stats.opened) * 100);
  };

  useEffect(() => {
    fetchMessageLogs();
  }, [fetchMessageLogs]);

  return {
    messageLogs,
    stats,
    isLoading,
    fetchMessageLogs,
    sendBulkMessages,
    sendTestMessage,
    getDeliveryRate,
    getOpenRate,
    getClickRate,
  };
}