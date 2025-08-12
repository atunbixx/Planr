'use client'

import { useState } from 'react'
import { Bell, Check, CheckCheck, X, Settings, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useNotifications } from '@/hooks/useNotifications'
import { NotificationData, NotificationCategory, NotificationPriority } from '@/lib/notifications/types'
import { formatDistanceToNow } from 'date-fns'

interface NotificationCenterProps {
  className?: string
}

export function NotificationCenter({ className }: NotificationCenterProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('all')
  
  const {
    notifications,
    stats,
    loading,
    error,
    hasMore,
    loadMore,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refresh,
    isConnected
  } = useNotifications()

  const filteredNotifications = notifications.filter(notification => {
    if (activeTab === 'all') return true
    if (activeTab === 'unread') return !notification.read
    return notification.category === activeTab
  })

  const getNotificationIcon = (category: NotificationCategory) => {
    const icons = {
      rsvp: '💌',
      guests: '👥',
      vendors: '🏢',
      budget: '💰',
      timeline: '📅',
      photos: '📸',
      system: '⚙️'
    }
    return icons[category] || '📢'
  }

  const getPriorityColor = (priority: NotificationPriority) => {
    const colors = {
      low: 'bg-gray-100 text-gray-800',
      medium: 'bg-blue-100 text-blue-800',
      high: 'bg-orange-100 text-orange-800',
      urgent: 'bg-red-100 text-red-800'
    }
    return colors[priority]
  }

  const formatNotificationTime = (createdAt: Date) => {
    return formatDistanceToNow(new Date(createdAt), { addSuffix: true })
  }

  const handleNotificationClick = async (notification: NotificationData) => {
    if (!notification.read) {
      await markAsRead(notification.id)
    }
    
    if (notification.actionUrl) {
      window.location.href = notification.actionUrl
    }
  }

  return (
    <div className={className}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="sm" className="relative">
            <Bell className="h-5 w-5" />
            {stats && stats.unread > 0 && (
              <Badge 
                variant="destructive" 
                className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs"
              >
                {stats.unread > 99 ? '99+' : stats.unread}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        
        <PopoverContent className="w-96 p-0" align="end">
          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Notifications</CardTitle>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <div 
                      className={`h-2 w-2 rounded-full ${
                        isConnected ? 'bg-green-500' : 'bg-red-500'
                      }`} 
                    />
                    {isConnected ? 'Connected' : 'Disconnected'}
                  </div>
                  
                  {stats && stats.unread > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={markAllAsRead}
                      className="text-xs"
                    >
                      <CheckCheck className="h-3 w-3 mr-1" />
                      Mark all read
                    </Button>
                  )}
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={refresh}
                    disabled={loading}
                  >
                    {loading ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Settings className="h-3 w-3" />
                    )}
                  </Button>
                </div>
              </div>
              
              {stats && (
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>{stats.total} total</span>
                  <span>{stats.unread} unread</span>
                </div>
              )}
            </CardHeader>
            
            <CardContent className="p-0">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <div className="px-4 pb-3">
                  <TabsList className="grid grid-cols-4 w-full text-xs">
                    <TabsTrigger value="all">All</TabsTrigger>
                    <TabsTrigger value="unread">
                      Unread {stats && stats.unread > 0 && `(${stats.unread})`}
                    </TabsTrigger>
                    <TabsTrigger value="rsvp">RSVP</TabsTrigger>
                    <TabsTrigger value="budget">Budget</TabsTrigger>
                  </TabsList>
                </div>

                <ScrollArea className="h-96">
                  <TabsContent value={activeTab} className="m-0">
                    {error && (
                      <div className="px-4 py-2 text-sm text-red-600 bg-red-50">
                        {error}
                      </div>
                    )}
                    
                    {filteredNotifications.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                        <Bell className="h-8 w-8 mb-2 opacity-50" />
                        <p className="text-sm">No notifications</p>
                        {activeTab === 'unread' && (
                          <p className="text-xs">You're all caught up!</p>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-0">
                        {filteredNotifications.map((notification, index) => (
                          <div key={notification.id}>
                            <div 
                              className={`px-4 py-3 cursor-pointer hover:bg-muted/50 ${
                                !notification.read ? 'bg-blue-50 border-l-2 border-l-blue-500' : ''
                              }`}
                              onClick={() => handleNotificationClick(notification)}
                            >
                              <div className="flex items-start gap-3">
                                <div className="text-lg leading-none">
                                  {getNotificationIcon(notification.category)}
                                </div>
                                
                                <div className="flex-1 space-y-1">
                                  <div className="flex items-center justify-between">
                                    <h4 className="text-sm font-medium leading-none">
                                      {notification.title}
                                    </h4>
                                    
                                    <div className="flex items-center gap-1">
                                      <Badge 
                                        variant="secondary" 
                                        className={`text-xs ${getPriorityColor(notification.priority)}`}
                                      >
                                        {notification.priority}
                                      </Badge>
                                      
                                      {!notification.read && (
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            markAsRead(notification.id)
                                          }}
                                          className="h-6 w-6 p-0"
                                        >
                                          <Check className="h-3 w-3" />
                                        </Button>
                                      )}
                                      
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          deleteNotification(notification.id)
                                        }}
                                        className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                                      >
                                        <X className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  </div>
                                  
                                  <p className="text-sm text-muted-foreground">
                                    {notification.message}
                                  </p>
                                  
                                  <div className="flex items-center justify-between">
                                    <time className="text-xs text-muted-foreground">
                                      {formatNotificationTime(notification.createdAt)}
                                    </time>
                                    
                                    {notification.actionLabel && notification.actionUrl && (
                                      <Button variant="link" size="sm" className="text-xs p-0 h-auto">
                                        {notification.actionLabel}
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                            
                            {index < filteredNotifications.length - 1 && <Separator />}
                          </div>
                        ))}
                        
                        {hasMore && (
                          <div className="p-4">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={loadMore}
                              disabled={loading}
                              className="w-full"
                            >
                              {loading ? (
                                <>
                                  <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                                  Loading...
                                </>
                              ) : (
                                'Load more'
                              )}
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </TabsContent>
                </ScrollArea>
              </Tabs>
            </CardContent>
          </Card>
        </PopoverContent>
      </Popover>
    </div>
  )
}