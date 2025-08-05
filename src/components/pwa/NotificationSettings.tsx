'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Bell, BellOff, CheckCircle2, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

interface NotificationPreferences {
  taskReminders: boolean
  vendorUpdates: boolean
  photoNotifications: boolean
  budgetAlerts: boolean
}

interface NotificationState {
  supported: boolean
  permission: NotificationPermission
  subscribed: boolean
  preferences: NotificationPreferences
}

export default function NotificationSettings() {
  const [state, setState] = useState<NotificationState>({
    supported: false,
    permission: 'default',
    subscribed: false,
    preferences: {
      taskReminders: true,
      vendorUpdates: true,
      photoNotifications: true,
      budgetAlerts: true
    }
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    checkNotificationSupport()
    loadPreferences()
  }, [])

  const checkNotificationSupport = () => {
    const supported = 'Notification' in window && 'serviceWorker' in navigator
    setState(prev => ({
      ...prev,
      supported,
      permission: supported ? Notification.permission : 'denied'
    }))
  }

  const loadPreferences = async () => {
    try {
      const response = await fetch('/api/notifications/send')
      if (response.ok) {
        const data = await response.json()
        setState(prev => ({
          ...prev,
          subscribed: data.subscribed,
          preferences: data.preferences
        }))
      }
    } catch (error) {
      console.error('Error loading preferences:', error)
    }
  }

  const requestPermission = async () => {
    if (!state.supported) {
      toast.error('Notifications not supported in this browser')
      return
    }

    try {
      const permission = await Notification.requestPermission()
      setState(prev => ({ ...prev, permission }))
      
      if (permission === 'granted') {
        await subscribeToNotifications()
      } else {
        toast.error('Notification permission denied')
      }
    } catch (error) {
      console.error('Error requesting permission:', error)
      toast.error('Failed to request notification permission')
    }
  }

  const subscribeToNotifications = async () => {
    if (!state.supported || state.permission !== 'granted') {
      return
    }

    setLoading(true)
    
    try {
      // Get service worker registration
      const registration = await navigator.serviceWorker.ready
      
      // Subscribe to push notifications
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '')
      })

      // Send subscription to server
      const response = await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          subscription: subscription.toJSON(),
          preferences: state.preferences
        })
      })

      if (response.ok) {
        setState(prev => ({ ...prev, subscribed: true }))
        toast.success('Notifications enabled successfully!')
      } else {
        throw new Error('Failed to subscribe')
      }
    } catch (error) {
      console.error('Error subscribing to notifications:', error)
      toast.error('Failed to enable notifications')
    } finally {
      setLoading(false)
    }
  }

  const unsubscribeFromNotifications = async () => {
    setLoading(true)
    
    try {
      // Get service worker registration
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()
      
      if (subscription) {
        // Unsubscribe from push notifications
        await subscription.unsubscribe()
        
        // Remove subscription from server
        await fetch('/api/notifications/subscribe', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            endpoint: subscription.endpoint
          })
        })
      }

      setState(prev => ({ ...prev, subscribed: false }))
      toast.success('Notifications disabled')
    } catch (error) {
      console.error('Error unsubscribing from notifications:', error)
      toast.error('Failed to disable notifications')
    } finally {
      setLoading(false)
    }
  }

  const updatePreferences = async (newPreferences: NotificationPreferences) => {
    if (!state.subscribed) return

    setState(prev => ({ ...prev, preferences: newPreferences }))

    try {
      // Get current subscription
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()
      
      if (subscription) {
        // Update preferences on server
        await fetch('/api/notifications/subscribe', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            subscription: subscription.toJSON(),
            preferences: newPreferences
          })
        })
        
        toast.success('Notification preferences updated')
      }
    } catch (error) {
      console.error('Error updating preferences:', error)
      toast.error('Failed to update preferences')
    }
  }

  const handlePreferenceChange = (key: keyof NotificationPreferences, value: boolean) => {
    const newPreferences = { ...state.preferences, [key]: value }
    updatePreferences(newPreferences)
  }

  // Helper function to convert VAPID key
  const urlBase64ToUint8Array = (base64String: string) => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4)
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/')

    const rawData = window.atob(base64)
    const outputArray = new Uint8Array(rawData.length)

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i)
    }
    return outputArray
  }

  const getStatusIcon = () => {
    if (!state.supported) {
      return <AlertCircle className="w-5 h-5 text-gray-400" />
    }
    if (state.subscribed) {
      return <CheckCircle2 className="w-5 h-5 text-green-600" />
    }
    if (state.permission === 'granted') {
      return <Bell className="w-5 h-5 text-blue-600" />
    }
    return <BellOff className="w-5 h-5 text-gray-400" />
  }

  const getStatusText = () => {
    if (!state.supported) {
      return 'Not supported in this browser'
    }
    if (state.subscribed) {
      return 'Notifications enabled'
    }
    if (state.permission === 'granted') {
      return 'Permission granted'
    }
    if (state.permission === 'denied') {
      return 'Permission denied'
    }
    return 'Permission not requested'
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          {getStatusIcon()}
          <div>
            <CardTitle>Push Notifications</CardTitle>
            <CardDescription>{getStatusText()}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {!state.supported ? (
          <div className="text-center py-4">
            <p className="text-muted-foreground">
              Push notifications are not supported in this browser.
            </p>
          </div>
        ) : !state.subscribed ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Enable push notifications to receive important updates about your wedding planning progress.
            </p>
            <Button
              onClick={requestPermission}
              disabled={loading || state.permission === 'denied'}
              className="w-full"
            >
              <Bell className="w-4 h-4 mr-2" />
              {loading ? 'Enabling...' : 'Enable Notifications'}
            </Button>
            {state.permission === 'denied' && (
              <p className="text-xs text-muted-foreground text-center">
                Notifications were blocked. You can enable them in your browser settings.
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            <div className="space-y-4">
              <h4 className="font-medium">Notification Types</h4>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="task-reminders" className="flex flex-col gap-1">
                    <span>Task Reminders</span>
                    <span className="font-normal text-sm text-muted-foreground">
                      Get reminded about upcoming tasks and deadlines
                    </span>
                  </Label>
                  <Switch
                    id="task-reminders"
                    checked={state.preferences.taskReminders}
                    onCheckedChange={(checked) => handlePreferenceChange('taskReminders', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="vendor-updates" className="flex flex-col gap-1">
                    <span>Vendor Updates</span>
                    <span className="font-normal text-sm text-muted-foreground">
                      Notifications about vendor communications and updates
                    </span>
                  </Label>
                  <Switch
                    id="vendor-updates"
                    checked={state.preferences.vendorUpdates}
                    onCheckedChange={(checked) => handlePreferenceChange('vendorUpdates', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="photo-notifications" className="flex flex-col gap-1">
                    <span>Photo Notifications</span>
                    <span className="font-normal text-sm text-muted-foreground">
                      Updates about new photos and album activities
                    </span>
                  </Label>
                  <Switch
                    id="photo-notifications"
                    checked={state.preferences.photoNotifications}
                    onCheckedChange={(checked) => handlePreferenceChange('photoNotifications', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="budget-alerts" className="flex flex-col gap-1">
                    <span>Budget Alerts</span>
                    <span className="font-normal text-sm text-muted-foreground">
                      Important budget updates and spending alerts
                    </span>
                  </Label>
                  <Switch
                    id="budget-alerts"
                    checked={state.preferences.budgetAlerts}
                    onCheckedChange={(checked) => handlePreferenceChange('budgetAlerts', checked)}
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 border-t">
              <Button
                variant="outline"
                onClick={unsubscribeFromNotifications}
                disabled={loading}
                className="w-full"
              >
                <BellOff className="w-4 h-4 mr-2" />
                {loading ? 'Disabling...' : 'Disable Notifications'}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}