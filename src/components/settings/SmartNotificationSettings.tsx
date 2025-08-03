'use client';

import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  MapPin, 
  Calendar, 
  DollarSign, 
  Users, 
  Heart,
  Clock,
  Smartphone,
  Mail,
  Volume2,
  Sun,
  Moon,
  Info
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { getSmartNotificationService, SmartNotificationPreferences } from '@/lib/services/smart-notification.service';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface CategoryConfig {
  key: keyof SmartNotificationPreferences['categories'];
  label: string;
  description: string;
  icon: React.ReactNode;
  examples: string[];
}

const notificationCategories: CategoryConfig[] = [
  {
    key: 'tasks',
    label: 'Task Reminders',
    description: 'Get reminded about upcoming tasks and deadlines',
    icon: <Calendar className="h-4 w-4" />,
    examples: ['Task due tomorrow', 'Overdue tasks', 'Weekly task summary']
  },
  {
    key: 'vendors',
    label: 'Vendor Appointments',
    description: 'Never miss a vendor meeting or appointment',
    icon: <Users className="h-4 w-4" />,
    examples: ['Appointment reminders', 'Meeting confirmations', 'Vendor messages']
  },
  {
    key: 'budget',
    label: 'Budget & Payments',
    description: 'Stay on top of payments and budget alerts',
    icon: <DollarSign className="h-4 w-4" />,
    examples: ['Payment due dates', 'Budget overspending', 'Invoice reminders']
  },
  {
    key: 'rsvp',
    label: 'RSVP Updates',
    description: 'Get notified when guests respond',
    icon: <Users className="h-4 w-4" />,
    examples: ['New RSVP responses', 'RSVP deadline reminders', 'Guest count updates']
  },
  {
    key: 'wedding',
    label: 'Wedding Countdown',
    description: 'Important milestones as your big day approaches',
    icon: <Heart className="h-4 w-4" />,
    examples: ['1 month countdown', '1 week reminder', 'Day before checklist']
  },
  {
    key: 'location',
    label: 'Location-Based',
    description: 'Get reminders when you\'re near venues or vendors',
    icon: <MapPin className="h-4 w-4" />,
    examples: ['Near your venue', 'Close to vendor location', 'Appointment proximity']
  }
];

export function SmartNotificationSettings() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [preferences, setPreferences] = useState<SmartNotificationPreferences>({
    categories: {
      tasks: true,
      vendors: true,
      budget: true,
      rsvp: true,
      wedding: true,
      location: false
    },
    channels: {
      push: true,
      email: true,
      sms: false
    },
    timing: {
      preference: 'immediately',
      quietHoursStart: '22:00',
      quietHoursEnd: '08:00'
    },
    frequency: 'each'
  });

  const supabase = createClientComponentClient();
  const notificationService = getSmartNotificationService();

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const prefs = await notificationService.getPreferences(user.id);
      setPreferences(prefs);
    } catch (error) {
      console.error('Error loading preferences:', error);
      toast.error('Failed to load notification preferences');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCategoryToggle = (category: keyof SmartNotificationPreferences['categories'], enabled: boolean) => {
    setPreferences(prev => ({
      ...prev,
      categories: {
        ...prev.categories,
        [category]: enabled
      }
    }));
    setHasChanges(true);

    // Request location permission if enabling location-based notifications
    if (category === 'location' && enabled) {
      requestLocationPermission();
    }
  };

  const handleChannelToggle = (channel: keyof SmartNotificationPreferences['channels'], enabled: boolean) => {
    setPreferences(prev => ({
      ...prev,
      channels: {
        ...prev.channels,
        [channel]: enabled
      }
    }));
    setHasChanges(true);

    // Request browser permission if enabling push notifications
    if (channel === 'push' && enabled && 'Notification' in window) {
      Notification.requestPermission();
    }
  };

  const handleTimingChange = (timing: SmartNotificationPreferences['timing']) => {
    setPreferences(prev => ({
      ...prev,
      timing
    }));
    setHasChanges(true);
  };

  const handleFrequencyChange = (frequency: SmartNotificationPreferences['frequency']) => {
    setPreferences(prev => ({
      ...prev,
      frequency
    }));
    setHasChanges(true);
  };

  const requestLocationPermission = async () => {
    if ('geolocation' in navigator) {
      try {
        await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject);
        });
        toast.success('Location permission granted');
      } catch (error) {
        toast.error('Location permission denied. Location-based notifications won\'t work.');
        handleCategoryToggle('location', false);
      }
    } else {
      toast.error('Location services not available');
      handleCategoryToggle('location', false);
    }
  };

  const savePreferences = async () => {
    try {
      setIsSaving(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await notificationService.updatePreferences(user.id, preferences);

      // Setup location tracking if enabled
      if (preferences.categories.location) {
        await notificationService.setupLocationTracking(user.id);
      } else {
        await notificationService.stopLocationTracking();
      }

      setHasChanges(false);
      toast.success('Notification preferences saved');
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast.error('Failed to save preferences');
    } finally {
      setIsSaving(false);
    }
  };

  const testNotification = async () => {
    await notificationService.sendNotification({
      title: 'Test Notification',
      body: 'Your smart notifications are working! 🎉',
      category: 'wedding',
      priority: 'medium'
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
          Smart Notifications
        </CardTitle>
        <CardDescription>
          Context-aware reminders that help you stay on track without being annoying
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="categories" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="categories">Categories</TabsTrigger>
            <TabsTrigger value="channels">Channels</TabsTrigger>
            <TabsTrigger value="timing">Timing</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          {/* Categories Tab */}
          <TabsContent value="categories" className="space-y-4">
            <div className="space-y-4">
              {notificationCategories.map((category) => (
                <Card key={category.key}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                          {category.icon}
                          <Label htmlFor={category.key} className="text-base font-medium">
                            {category.label}
                          </Label>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {category.description}
                        </p>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {category.examples.map((example, idx) => (
                            <span key={idx} className="text-xs bg-muted px-2 py-1 rounded-md">
                              {example}
                            </span>
                          ))}
                        </div>
                      </div>
                      <Switch
                        id={category.key}
                        checked={preferences.categories[category.key]}
                        onCheckedChange={(checked) => handleCategoryToggle(category.key, checked)}
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Channels Tab */}
          <TabsContent value="channels" className="space-y-6">
            <div className="space-y-4">
              {/* Push Notifications */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="push" className="text-base flex items-center gap-2">
                        <Bell className="h-4 w-4" />
                        Push Notifications
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Instant notifications in your browser or mobile app
                      </p>
                    </div>
                    <Switch
                      id="push"
                      checked={preferences.channels.push}
                      onCheckedChange={(checked) => handleChannelToggle('push', checked)}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Email Notifications */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="email" className="text-base flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        Email Notifications
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Important updates sent to your email
                      </p>
                    </div>
                    <Switch
                      id="email"
                      checked={preferences.channels.email}
                      onCheckedChange={(checked) => handleChannelToggle('email', checked)}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* SMS Notifications */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="sms" className="text-base flex items-center gap-2">
                        <Smartphone className="h-4 w-4" />
                        SMS Notifications
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Critical alerts via text message (additional charges may apply)
                      </p>
                    </div>
                    <Switch
                      id="sms"
                      checked={preferences.channels.sms}
                      onCheckedChange={(checked) => handleChannelToggle('sms', checked)}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Notification Frequency */}
              <Card>
                <CardContent className="p-4">
                  <Label className="text-base mb-3 block">Notification Frequency</Label>
                  <RadioGroup
                    value={preferences.frequency}
                    onValueChange={(value) => handleFrequencyChange(value as SmartNotificationPreferences['frequency'])}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="each" id="each" />
                      <Label htmlFor="each">Send each notification immediately</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="hourly" id="hourly" />
                      <Label htmlFor="hourly">Hourly digest</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="daily_digest" id="daily" />
                      <Label htmlFor="daily">Daily digest</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="weekly_digest" id="weekly" />
                      <Label htmlFor="weekly">Weekly digest</Label>
                    </div>
                  </RadioGroup>
                </CardContent>
              </Card>
            </div>

            {preferences.channels.push && (
              <Button
                variant="outline"
                onClick={testNotification}
                className="w-full sm:w-auto"
              >
                Test Push Notification
              </Button>
            )}
          </TabsContent>

          {/* Timing Tab */}
          <TabsContent value="timing" className="space-y-6">
            <Card>
              <CardContent className="p-4 space-y-4">
                <div>
                  <Label className="text-base mb-3 block">When to send notifications</Label>
                  <RadioGroup
                    value={preferences.timing.preference}
                    onValueChange={(value) => handleTimingChange({
                      ...preferences.timing,
                      preference: value as SmartNotificationPreferences['timing']['preference']
                    })}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="immediately" id="immediately" />
                      <Label htmlFor="immediately">Send immediately</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="morning" id="morning" />
                      <Label htmlFor="morning">Morning digest (9 AM)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="evening" id="evening" />
                      <Label htmlFor="evening">Evening digest (6 PM)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="custom" id="custom" />
                      <Label htmlFor="custom">Custom time</Label>
                    </div>
                  </RadioGroup>
                </div>

                {preferences.timing.preference === 'custom' && (
                  <div>
                    <Label htmlFor="custom-time">Custom notification time</Label>
                    <Input
                      id="custom-time"
                      type="time"
                      value={preferences.timing.customTime || '09:00'}
                      onChange={(e) => handleTimingChange({
                        ...preferences.timing,
                        customTime: e.target.value
                      })}
                    />
                  </div>
                )}

                <div className="space-y-3">
                  <Label className="text-base flex items-center gap-2">
                    <Moon className="h-4 w-4" />
                    Quiet Hours
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    No notifications will be sent during these hours (except urgent ones)
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="quiet-start">Start time</Label>
                      <Input
                        id="quiet-start"
                        type="time"
                        value={preferences.timing.quietHoursStart}
                        onChange={(e) => handleTimingChange({
                          ...preferences.timing,
                          quietHoursStart: e.target.value
                        })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="quiet-end">End time</Label>
                      <Input
                        id="quiet-end"
                        type="time"
                        value={preferences.timing.quietHoursEnd}
                        onChange={(e) => handleTimingChange({
                          ...preferences.timing,
                          quietHoursEnd: e.target.value
                        })}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Urgent notifications (like appointment reminders within 1 hour) will always be sent immediately, 
                even during quiet hours.
              </AlertDescription>
            </Alert>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="space-y-4">
            <NotificationHistory />
          </TabsContent>
        </Tabs>

        {/* Save Button */}
        {hasChanges && (
          <div className="flex justify-end mt-6 pt-6 border-t">
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

function NotificationHistory() {
  const [history, setHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClientComponentClient();
  const notificationService = getSmartNotificationService();

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const notifications = await notificationService.getNotificationHistory(user.id, 20);
      setHistory(notifications);
    } catch (error) {
      console.error('Error loading history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <div className="animate-pulse h-40 bg-gray-100 rounded-lg"></div>;
  }

  if (history.length === 0) {
    return (
      <Alert>
        <Bell className="h-4 w-4" />
        <AlertDescription>
          No notifications sent yet. Once you start receiving notifications, they'll appear here.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-2">
      {history.map((notification) => (
        <Card key={notification.id} className="p-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h4 className="font-medium text-sm">{notification.title}</h4>
              <p className="text-sm text-muted-foreground mt-1">{notification.body}</p>
              <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                <span>{new Date(notification.sent_at).toLocaleString()}</span>
                <span className="capitalize">{notification.channel}</span>
                {notification.read_at && (
                  <span className="text-green-600">Read</span>
                )}
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}