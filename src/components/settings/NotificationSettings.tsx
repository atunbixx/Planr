'use client';

import React, { useState, useEffect } from 'react';
import { Bell, Volume2, Mail, MessageSquare, Smartphone, Clock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { getNotificationService } from '@/lib/services/notification.service';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { toast } from 'sonner';

export function NotificationSettings() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  
  // Notification preferences
  const [browserNotifications, setBrowserNotifications] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [desktopNotifications, setDesktopNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [emailFrequency, setEmailFrequency] = useState<'instant' | 'hourly' | 'daily'>('instant');
  const [smsNotifications, setSmsNotifications] = useState(false);
  
  const supabase = createClientComponentClient();
  const notificationService = getNotificationService();

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      setIsLoading(true);
      
      // Load from database
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('message_notification_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (data) {
        setBrowserNotifications(data.browser_notifications);
        setSoundEnabled(data.sound_enabled);
        setDesktopNotifications(data.desktop_notifications);
        setEmailNotifications(data.email_notifications);
        setEmailFrequency(data.email_frequency);
        setSmsNotifications(data.sms_notifications);
      }

      // Check browser notification permission
      if ('Notification' in window) {
        setBrowserNotifications(Notification.permission === 'granted');
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBrowserNotificationChange = async (checked: boolean) => {
    setBrowserNotifications(checked);
    setHasChanges(true);

    if (checked && 'Notification' in window && Notification.permission !== 'granted') {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        setBrowserNotifications(false);
        toast.error('Browser notifications permission denied');
      }
    }

    notificationService.setEnabled(checked);
  };

  const handleSoundChange = (checked: boolean) => {
    setSoundEnabled(checked);
    setHasChanges(true);
    notificationService.setSoundEnabled(checked);
    
    if (checked) {
      // Play a test sound
      notificationService.playSound();
    }
  };

  const savePreferences = async () => {
    try {
      setIsSaving(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('message_notification_preferences')
        .upsert({
          user_id: user.id,
          browser_notifications: browserNotifications,
          sound_enabled: soundEnabled,
          desktop_notifications: desktopNotifications,
          email_notifications: emailNotifications,
          email_frequency: emailFrequency,
          sms_notifications: smsNotifications,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      setHasChanges(false);
      toast.success('Notification preferences saved');
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast.error('Failed to save preferences');
    } finally {
      setIsSaving(false);
    }
  };

  const testNotification = () => {
    notificationService.show({
      title: 'Test Notification',
      body: 'This is a test notification from Wedding Planner',
      requireInteraction: false
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Notification Settings
        </CardTitle>
        <CardDescription>
          Configure how you want to receive notifications
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Browser Notifications */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium">Browser Notifications</h3>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="browser-notifications" className="text-base">
                Enable browser notifications
              </Label>
              <p className="text-sm text-muted-foreground">
                Show notifications when you receive new messages
              </p>
            </div>
            <Switch
              id="browser-notifications"
              checked={browserNotifications}
              onCheckedChange={handleBrowserNotificationChange}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="sound" className="text-base flex items-center gap-2">
                <Volume2 className="h-4 w-4" />
                Notification sound
              </Label>
              <p className="text-sm text-muted-foreground">
                Play a sound when you receive notifications
              </p>
            </div>
            <Switch
              id="sound"
              checked={soundEnabled}
              onCheckedChange={handleSoundChange}
              disabled={!browserNotifications}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="desktop" className="text-base">
                Desktop notifications
              </Label>
              <p className="text-sm text-muted-foreground">
                Show notifications on your desktop
              </p>
            </div>
            <Switch
              id="desktop"
              checked={desktopNotifications}
              onCheckedChange={(checked) => {
                setDesktopNotifications(checked);
                setHasChanges(true);
              }}
              disabled={!browserNotifications}
            />
          </div>

          {browserNotifications && (
            <Button
              variant="outline"
              size="sm"
              onClick={testNotification}
              className="w-full sm:w-auto"
            >
              Test Notification
            </Button>
          )}
        </div>

        {/* Email Notifications */}
        <div className="space-y-4 pt-6 border-t">
          <h3 className="text-sm font-medium flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Email Notifications
          </h3>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="email-notifications" className="text-base">
                Enable email notifications
              </Label>
              <p className="text-sm text-muted-foreground">
                Receive message notifications via email
              </p>
            </div>
            <Switch
              id="email-notifications"
              checked={emailNotifications}
              onCheckedChange={(checked) => {
                setEmailNotifications(checked);
                setHasChanges(true);
              }}
            />
          </div>

          {emailNotifications && (
            <div className="space-y-2">
              <Label htmlFor="email-frequency">Email frequency</Label>
              <Select
                value={emailFrequency}
                onValueChange={(value: 'instant' | 'hourly' | 'daily') => {
                  setEmailFrequency(value);
                  setHasChanges(true);
                }}
              >
                <SelectTrigger id="email-frequency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="instant">Instant</SelectItem>
                  <SelectItem value="hourly">Hourly digest</SelectItem>
                  <SelectItem value="daily">Daily digest</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* SMS Notifications */}
        <div className="space-y-4 pt-6 border-t">
          <h3 className="text-sm font-medium flex items-center gap-2">
            <Smartphone className="h-4 w-4" />
            SMS Notifications
          </h3>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="sms-notifications" className="text-base">
                Enable SMS notifications
              </Label>
              <p className="text-sm text-muted-foreground">
                Receive important messages via SMS
              </p>
            </div>
            <Switch
              id="sms-notifications"
              checked={smsNotifications}
              onCheckedChange={(checked) => {
                setSmsNotifications(checked);
                setHasChanges(true);
              }}
            />
          </div>

          {smsNotifications && (
            <Alert>
              <MessageSquare className="h-4 w-4" />
              <AlertDescription>
                SMS notifications may incur charges from your carrier. 
                You'll need to verify your phone number to enable this feature.
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Save Button */}
        {hasChanges && (
          <div className="flex justify-end pt-6 border-t">
            <Button
              onClick={savePreferences}
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}