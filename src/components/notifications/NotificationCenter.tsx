'use client';

import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  X, 
  Calendar, 
  DollarSign, 
  Users, 
  Heart, 
  MapPin,
  Check,
  Clock,
  AlertCircle
} from 'lucide-react';
import { 
  Sheet, 
  SheetContent, 
  SheetDescription, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger 
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { getSmartNotificationService } from '@/lib/services/smart-notification.service';
import { formatDistanceToNow } from 'date-fns';

interface Notification {
  id: string;
  title: string;
  body: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  sent_at: string;
  read_at: string | null;
  data?: Record<string, any>;
}

const categoryIcons = {
  tasks: <Calendar className="h-4 w-4" />,
  vendors: <Users className="h-4 w-4" />,
  budget: <DollarSign className="h-4 w-4" />,
  rsvp: <Users className="h-4 w-4" />,
  wedding: <Heart className="h-4 w-4" />,
  location: <MapPin className="h-4 w-4" />
};

const priorityColors = {
  low: 'bg-gray-100 text-gray-800',
  medium: 'bg-blue-100 text-blue-800',
  high: 'bg-orange-100 text-orange-800',
  urgent: 'bg-red-100 text-red-800'
};

export function NotificationCenter() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isOpen, setIsOpen] = useState(false);
  
  const supabase = createClientComponentClient();
  const notificationService = getSmartNotificationService();

  useEffect(() => {
    loadNotifications();
    
    // Set up real-time subscription
    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notification_history'
        },
        (payload) => {
          setNotifications(prev => [payload.new as Notification, ...prev]);
          setUnreadCount(prev => prev + 1);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadNotifications = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const history = await notificationService.getNotificationHistory(user.id, 100);
      setNotifications(history);
      setUnreadCount(history.filter(n => !n.read_at).length);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    await notificationService.markNotificationRead(notificationId);
    
    setNotifications(prev =>
      prev.map(n =>
        n.id === notificationId ? { ...n, read_at: new Date().toISOString() } : n
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = async () => {
    const unreadIds = notifications.filter(n => !n.read_at).map(n => n.id);
    
    await Promise.all(unreadIds.map(id => notificationService.markNotificationRead(id)));
    
    setNotifications(prev =>
      prev.map(n => ({ ...n, read_at: n.read_at || new Date().toISOString() }))
    );
    setUnreadCount(0);
  };

  const clearAll = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Clear from database
    await supabase
      .from('notification_history')
      .delete()
      .eq('user_id', user.id);

    setNotifications([]);
    setUnreadCount(0);
  };

  const filteredNotifications = selectedCategory === 'all' 
    ? notifications 
    : notifications.filter(n => n.category === selectedCategory);

  const categories = ['all', ...Object.keys(categoryIcons)];

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ''}`}
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center justify-between">
            <span>Notifications</span>
            {notifications.length > 0 && (
              <div className="flex gap-2">
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={markAllAsRead}
                  >
                    Mark all read
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAll}
                >
                  Clear all
                </Button>
              </div>
            )}
          </SheetTitle>
          <SheetDescription>
            Stay updated with all your wedding planning activities
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6">
          <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
            <TabsList className="w-full flex-wrap h-auto p-1">
              {categories.map(category => (
                <TabsTrigger
                  key={category}
                  value={category}
                  className="flex-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  {category === 'all' ? 'All' : (
                    <span className="flex items-center gap-1">
                      {categoryIcons[category as keyof typeof categoryIcons]}
                      <span className="capitalize hidden sm:inline">{category}</span>
                    </span>
                  )}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value={selectedCategory} className="mt-4">
              <ScrollArea className="h-[calc(100vh-250px)]">
                {isLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="animate-pulse">
                        <div className="h-20 bg-gray-100 rounded-lg"></div>
                      </div>
                    ))}
                  </div>
                ) : filteredNotifications.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Bell className="h-12 w-12 mx-auto mb-3 opacity-20" />
                    <p>No notifications yet</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredNotifications.map(notification => (
                      <NotificationItem
                        key={notification.id}
                        notification={notification}
                        onRead={() => markAsRead(notification.id)}
                      />
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  );
}

interface NotificationItemProps {
  notification: Notification;
  onRead: () => void;
}

function NotificationItem({ notification, onRead }: NotificationItemProps) {
  const handleClick = () => {
    if (!notification.read_at) {
      onRead();
    }

    // Navigate if URL is provided
    if (notification.data?.url) {
      window.location.href = notification.data.url;
    }
  };

  return (
    <div
      className={cn(
        'p-3 rounded-lg border cursor-pointer transition-colors hover:bg-accent',
        !notification.read_at && 'bg-blue-50 border-blue-200'
      )}
      onClick={handleClick}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          {categoryIcons[notification.category as keyof typeof categoryIcons] || <Bell className="h-4 w-4" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h4 className="font-medium text-sm">{notification.title}</h4>
            <Badge 
              variant="secondary" 
              className={cn('text-xs', priorityColors[notification.priority])}
            >
              {notification.priority}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
            {notification.body}
          </p>
          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatDistanceToNow(new Date(notification.sent_at), { addSuffix: true })}
            </span>
            {notification.read_at && (
              <span className="flex items-center gap-1 text-green-600">
                <Check className="h-3 w-3" />
                Read
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}