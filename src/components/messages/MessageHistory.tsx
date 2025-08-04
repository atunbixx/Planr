'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Mail, 
  MessageSquare, 
  Phone, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertCircle,
  Eye,
  MousePointer,
  RefreshCw
} from 'lucide-react';
import { format } from 'date-fns';

interface MessageLog {
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

interface MessageHistoryProps {
  limit?: number;
  showStats?: boolean;
}

export function MessageHistory({ limit = 50, showStats = true }: MessageHistoryProps) {
  const [messages, setMessages] = useState<MessageLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    sent: 0,
    delivered: 0,
    failed: 0,
    opened: 0,
    clicked: 0,
  });

  const fetchMessages = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/messages/logs?limit=${limit}`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data);
        
        // Calculate stats
        const newStats = {
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
      console.error('Error fetching messages:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [limit]);

  const getMessageIcon = (type: string) => {
    switch (type) {
      case 'email':
        return <Mail className="h-4 w-4" />;
      case 'sms':
        return <Phone className="h-4 w-4" />;
      case 'whatsapp':
        return <MessageSquare className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'delivered':
        return (
          <Badge variant="default" className="bg-green-500">
            <CheckCircle className="h-3 w-3 mr-1" />
            Delivered
          </Badge>
        );
      case 'sent':
        return (
          <Badge variant="secondary">
            <Clock className="h-3 w-3 mr-1" />
            Sent
          </Badge>
        );
      case 'failed':
      case 'bounced':
        return (
          <Badge variant="destructive">
            <XCircle className="h-3 w-3 mr-1" />
            Failed
          </Badge>
        );
      case 'complained':
        return (
          <Badge variant="destructive">
            <AlertCircle className="h-3 w-3 mr-1" />
            Spam
          </Badge>
        );
      case 'pending':
        return (
          <Badge variant="outline">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
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

  if (isLoading) {
    return <div className="text-center py-4">Loading message history...</div>;
  }

  return (
    <div className="space-y-4">
      {showStats && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Sent</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Delivery Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{getDeliveryRate()}%</div>
              <p className="text-xs text-muted-foreground">
                {stats.delivered} delivered
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Open Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{getOpenRate()}%</div>
              <p className="text-xs text-muted-foreground">
                {stats.opened} opened
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Failed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{stats.failed}</div>
              <p className="text-xs text-muted-foreground">
                Delivery failures
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Message History</CardTitle>
              <CardDescription>Recent messages sent to guests and vendors</CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchMessages}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Recipient</TableHead>
                  <TableHead>Subject/Message</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Engagement</TableHead>
                  <TableHead>Sent</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {messages.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No messages sent yet
                    </TableCell>
                  </TableRow>
                ) : (
                  messages.map((message) => (
                    <TableRow key={message.id}>
                      <TableCell>
                        <div className="flex items-center">
                          {getMessageIcon(message.message_type)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {message.recipient_email || message.recipient_phone}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-[300px]">
                          {message.subject && (
                            <div className="font-medium text-sm truncate">
                              {message.subject}
                            </div>
                          )}
                          <div className="text-sm text-muted-foreground truncate">
                            {message.body}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(message.status)}
                        {message.error_message && (
                          <div className="text-xs text-destructive mt-1">
                            {message.error_message}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {message.opened_at && (
                            <div className="flex items-center text-xs text-muted-foreground">
                              <Eye className="h-3 w-3 mr-1" />
                              Opened
                            </div>
                          )}
                          {message.clicked_at && (
                            <div className="flex items-center text-xs text-muted-foreground">
                              <MousePointer className="h-3 w-3 mr-1" />
                              Clicked
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-muted-foreground">
                          {format(new Date(message.created_at), 'MMM d, h:mm a')}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}