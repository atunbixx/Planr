'use client';

import React, { useEffect, useState } from 'react';
import { 
  Bell, 
  Calendar, 
  DollarSign, 
  Users, 
  Heart, 
  MapPin,
  X,
  AlertCircle,
  CheckCircle,
  Info
} from 'lucide-react';
import { toast as sonnerToast } from 'sonner';
import { cn } from '@/lib/utils';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { getSmartNotificationService } from '@/lib/services/smart-notification.service';

interface ToastNotification {
  id: string;
  title: string;
  body: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  action?: {
    label: string;
    onClick: () => void;
  };
}

const categoryConfig = {
  tasks: {
    icon: Calendar,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50'
  },
  vendors: {
    icon: Users,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50'
  },
  budget: {
    icon: DollarSign,
    color: 'text-green-600',
    bgColor: 'bg-green-50'
  },
  rsvp: {
    icon: Users,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50'
  },
  wedding: {
    icon: Heart,
    color: 'text-pink-600',
    bgColor: 'bg-pink-50'
  },
  location: {
    icon: MapPin,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50'
  }
};

const priorityConfig = {
  low: {
    duration: 4000,
    icon: Info,
    style: 'info' as const
  },
  medium: {
    duration: 5000,
    icon: Bell,
    style: 'default' as const
  },
  high: {
    duration: 7000,
    icon: AlertCircle,
    style: 'warning' as const
  },
  urgent: {
    duration: Infinity,
    icon: AlertCircle,
    style: 'error' as const
  }
};

export function NotificationToastProvider({ children }: { children: React.ReactNode }) {
  const [isClient, setIsClient] = useState(false);
  const [notificationService, setNotificationService] = useState<any>(null);
  const supabase = createClientComponentClient();

  useEffect(() => {
    setIsClient(true);
    
    // Only initialize notification service on client
    if (typeof window !== 'undefined') {
      const service = getSmartNotificationService();
      setNotificationService(service);
      
      // Process pending notifications on load
      service.processPendingNotifications();

      // Set up periodic check for pending notifications
      const interval = setInterval(() => {
        service.processPendingNotifications();
      }, 60000); // Check every minute

      return () => {
        clearInterval(interval);
      };
    }
  }, []);

  useEffect(() => {
    if (!isClient || !notificationService) return;

    // Subscribe to real-time notifications
    const channel = supabase
      .channel('notification-toasts')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notification_history',
          filter: `user_id=eq.${supabase.auth.getUser().then(u => u.data.user?.id)}`
        },
        (payload) => {
          showToast(payload.new as ToastNotification);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isClient, notificationService]);

  const showToast = (notification: ToastNotification) => {
    const config = categoryConfig[notification.category as keyof typeof categoryConfig] || {
      icon: Bell,
      color: 'text-gray-600',
      bgColor: 'bg-gray-50'
    };
    
    const priority = priorityConfig[notification.priority];
    const Icon = config.icon;

    sonnerToast.custom(
      (t) => (
        <div
          className={cn(
            'w-full max-w-md rounded-lg shadow-lg overflow-hidden',
            config.bgColor,
            'border',
            notification.priority === 'urgent' && 'border-red-300'
          )}
        >
          <div className="p-4">
            <div className="flex items-start">
              <div className={cn('flex-shrink-0', config.color)}>
                <Icon className="h-5 w-5" />
              </div>
              <div className="ml-3 flex-1">
                <p className={cn('text-sm font-medium', config.color)}>
                  {notification.title}
                </p>
                <p className="mt-1 text-sm text-gray-600">
                  {notification.body}
                </p>
                {notification.action && (
                  <div className="mt-3">
                    <button
                      onClick={() => {
                        notification.action!.onClick();
                        sonnerToast.dismiss(t);
                      }}
                      className={cn(
                        'text-sm font-medium',
                        config.color,
                        'hover:underline focus:outline-none'
                      )}
                    >
                      {notification.action.label} →
                    </button>
                  </div>
                )}
              </div>
              <div className="ml-4 flex-shrink-0">
                <button
                  onClick={() => sonnerToast.dismiss(t)}
                  className="inline-flex text-gray-400 hover:text-gray-500 focus:outline-none"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
          {notification.priority === 'urgent' && (
            <div className="bg-red-500 p-2">
              <p className="text-xs text-white text-center font-medium">
                Urgent - Action Required
              </p>
            </div>
          )}
        </div>
      ),
      {
        duration: priority.duration,
        position: 'top-right'
      }
    );
  };

  return <>{children}</>;
}

// Custom toast functions for different notification types
export const notificationToast = {
  task: (title: string, body: string, priority: 'low' | 'medium' | 'high' | 'urgent' = 'medium') => {
    const config = categoryConfig.tasks;
    const Icon = config.icon;
    
    sonnerToast.custom(
      (t) => (
        <div className={cn('flex items-center gap-3 p-4 rounded-lg', config.bgColor)}>
          <Icon className={cn('h-5 w-5', config.color)} />
          <div className="flex-1">
            <p className="font-medium text-sm">{title}</p>
            <p className="text-sm text-gray-600">{body}</p>
          </div>
          <button
            onClick={() => sonnerToast.dismiss(t)}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ),
      { duration: priorityConfig[priority].duration }
    );
  },

  vendor: (vendorName: string, message: string) => {
    const config = categoryConfig.vendors;
    const Icon = config.icon;
    
    sonnerToast.custom(
      (t) => (
        <div className={cn('flex items-center gap-3 p-4 rounded-lg', config.bgColor)}>
          <Icon className={cn('h-5 w-5', config.color)} />
          <div className="flex-1">
            <p className="font-medium text-sm">{vendorName}</p>
            <p className="text-sm text-gray-600">{message}</p>
          </div>
          <button
            onClick={() => sonnerToast.dismiss(t)}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )
    );
  },

  budget: (title: string, amount: string, isOverBudget = false) => {
    const config = categoryConfig.budget;
    const Icon = config.icon;
    
    sonnerToast.custom(
      (t) => (
        <div className={cn(
          'flex items-center gap-3 p-4 rounded-lg',
          isOverBudget ? 'bg-red-50' : config.bgColor
        )}>
          <Icon className={cn('h-5 w-5', isOverBudget ? 'text-red-600' : config.color)} />
          <div className="flex-1">
            <p className="font-medium text-sm">{title}</p>
            <p className={cn('text-sm', isOverBudget ? 'text-red-600' : 'text-gray-600')}>
              {amount}
            </p>
          </div>
          <button
            onClick={() => sonnerToast.dismiss(t)}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ),
      { duration: isOverBudget ? Infinity : 5000 }
    );
  },

  rsvp: (guestName: string, response: 'yes' | 'no' | 'maybe') => {
    const config = categoryConfig.rsvp;
    const Icon = config.icon;
    const responseText = {
      yes: 'accepted your invitation! 🎉',
      no: 'declined your invitation',
      maybe: 'might attend your wedding'
    };
    
    sonnerToast.custom(
      (t) => (
        <div className={cn('flex items-center gap-3 p-4 rounded-lg', config.bgColor)}>
          <Icon className={cn('h-5 w-5', config.color)} />
          <div className="flex-1">
            <p className="font-medium text-sm">New RSVP Response</p>
            <p className="text-sm text-gray-600">
              {guestName} {responseText[response]}
            </p>
          </div>
          <button
            onClick={() => sonnerToast.dismiss(t)}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )
    );
  },

  location: (placeName: string, message: string, action?: () => void) => {
    const config = categoryConfig.location;
    const Icon = config.icon;
    
    sonnerToast.custom(
      (t) => (
        <div className={cn('flex items-center gap-3 p-4 rounded-lg', config.bgColor)}>
          <Icon className={cn('h-5 w-5', config.color)} />
          <div className="flex-1">
            <p className="font-medium text-sm">Near {placeName}</p>
            <p className="text-sm text-gray-600">{message}</p>
            {action && (
              <button
                onClick={() => {
                  action();
                  sonnerToast.dismiss(t);
                }}
                className={cn('text-sm font-medium mt-2', config.color, 'hover:underline')}
              >
                View Details →
              </button>
            )}
          </div>
          <button
            onClick={() => sonnerToast.dismiss(t)}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )
    );
  }
};