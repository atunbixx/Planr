'use client'

import { useState, useEffect } from 'react'
import { useSupabaseAuth } from '@/lib/auth/client'
// import { useTranslations } from 'next-intl' // Removed to fix build errors
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { LocaleSelector } from '@/components/settings/LocaleSelector'
import { TranslationTest } from '@/components/TranslationTest'
// import NotificationSettings from '@/components/pwa/NotificationSettings' // Removed - API endpoints no longer available
import Link from 'next/link'
import { Users, ArrowRight } from 'lucide-react'
import { api } from '@/lib/api/client'

interface CoupleSettings {
  partner1Name: string
  partner2Name: string
  weddingDate: string
  venue: string
  location: string
  expectedGuests: number
  totalBudget: number
  weddingStyle: string
}

interface UserPreferences {
  currency: string
  alertThreshold: number
  emailNotifications: boolean
  taskReminders: boolean
  budgetAlerts: boolean
  vendorUpdates: boolean
  timezone: string
  language: string
}

export default function SettingsPage() {
  const { user, isSignedIn, isLoading } = useSupabaseAuth()
  // const t = useTranslations('common') // Removed to fix build errors
  const [coupleSettings, setCoupleSettings] = useState<CoupleSettings>({
    partner1Name: '',
    partner2Name: '',
    weddingDate: '',
    venue: '',
    location: '',
    expectedGuests: 0,
    totalBudget: 0,
    weddingStyle: ''
  })
  
  const [userPreferences, setUserPreferences] = useState<UserPreferences>({
    currency: 'USD',
    alertThreshold: 85,
    emailNotifications: true,
    taskReminders: true,
    budgetAlerts: true,
    vendorUpdates: false,
    timezone: 'America/New_York',
    language: 'en'
  })

  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!isLoading && isSignedIn && user) {
      loadSettings()
    }
  }, [isLoading, isSignedIn, user])

  const loadSettings = async () => {
    try {
      // Initialize user first
      await fetch('/api/user/initialize', {
        method: 'POST',
      })

      // Load existing wedding settings (only if onboarding is completed)
      try {
        const weddingResponse = await api.settings.wedding.get()
        if (weddingResponse.success && weddingResponse.data) {
          const wedding = weddingResponse.data
          setCoupleSettings({
            partner1Name: wedding.partnerOneName || '',
            partner2Name: wedding.partnerTwoName || '',
            weddingDate: wedding.weddingDate ? new Date(wedding.weddingDate).toISOString().split('T')[0] : '',
            venue: wedding.venue?.name || '',
            location: wedding.venue ? `${wedding.venue.city}, ${wedding.venue.state}` : '',
            expectedGuests: wedding.guestCount || 0,
            totalBudget: wedding.budget || 0,
            weddingStyle: wedding.theme || ''
          })
        }
      } catch (weddingError: any) {
        // If onboarding isn't completed, wedding settings won't be available
        if (weddingError?.message?.includes('Onboarding must be completed')) {
          console.log('Wedding settings not available - onboarding not completed')
        } else {
          console.error('Error loading wedding settings:', weddingError)
        }
      }

      // Load existing user preferences (should always work for authenticated users)
      const preferencesResponse = await api.settings.preferences.get()
      if (preferencesResponse.success && preferencesResponse.data) {
        setUserPreferences({
          currency: preferencesResponse.data.currency,
          alertThreshold: 85, // Not in API response, using default
          emailNotifications: preferencesResponse.data.emailNotifications,
          taskReminders: true, // Not in API response, using default
          budgetAlerts: true, // Not in API response, using default
          vendorUpdates: false, // Not in API response, using default
          timezone: preferencesResponse.data.timezone,
          language: preferencesResponse.data.language
        })
      }
    } catch (error) {
      console.error('Error loading settings:', error)
    }
  }

  const saveWeddingDetails = async () => {
    setLoading(true)
    try {
      const response = await api.settings.wedding.update({
        partnerOneName: coupleSettings.partner1Name,
        partnerTwoName: coupleSettings.partner2Name,
        weddingDate: coupleSettings.weddingDate,
        venue: {
          name: coupleSettings.venue,
          address: '',
          city: coupleSettings.location.split(',')[0]?.trim() || '',
          state: coupleSettings.location.split(',')[1]?.trim() || '',
          country: 'USA',
        },
        guestCount: coupleSettings.expectedGuests,
        budget: coupleSettings.totalBudget,
        theme: coupleSettings.weddingStyle
      })

      if (response.success) {
        alert('Settings saved successfully!')
      } else {
        alert('Failed to save settings. Please try again.')
      }
    } catch (error) {
      console.error('Error saving wedding details:', error)
      alert('Failed to save wedding details. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const saveUserPreferences = async () => {
    setLoading(true)
    try {
      const response = await api.settings.preferences.update({
        language: userPreferences.language,
        timezone: userPreferences.timezone,
        currency: userPreferences.currency,
        dateFormat: 'MM/DD/YYYY',
        timeFormat: '12h',
        firstDayOfWeek: 0,
        emailNotifications: userPreferences.emailNotifications,
        smsNotifications: false,
        pushNotifications: false
      })

      if (response.success) {
        alert('Preferences saved successfully!')
      } else {
        alert('Failed to save preferences. Please try again.')
      }
    } catch (error) {
      console.error('Error saving preferences:', error)
      alert('Failed to save preferences. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const exportData = async () => {
    try {
      const response = await fetch('/api/export')
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'wedding-data-export.json'
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      } else {
        alert('Failed to export data. Please try again.')
      }
    } catch (error) {
      console.error('Error exporting data:', error)
      alert('Failed to export data. Please try again.')
    }
  }

  const deleteAccount = async () => {
    if (!confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      return
    }

    if (!confirm('This will permanently delete all your wedding planning data. Are you absolutely sure?')) {
      return
    }

    try {
      const response = await fetch('/api/account', {
        method: 'DELETE',
      })

      if (response.ok) {
        alert('Account deleted successfully. You will be redirected to the homepage.')
        window.location.href = '/'
      } else {
        alert('Failed to delete account. Please try again.')
      }
    } catch (error) {
      console.error('Error deleting account:', error)
      alert('Failed to delete account. Please try again.')
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Please sign in</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div>
        <h1 data-testid="settings-page-title" className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-2">Manage your wedding planning preferences and account settings</p>
      </div>

      {/* Wedding Details */}
      <Card>
        <CardHeader>
          <CardTitle>Wedding Details</CardTitle>
          <CardDescription>Basic information about your wedding</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">Partner Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="partner1-name">Partner 1 Name</Label>
                <Input 
                  id="partner1-name" 
                  placeholder="First partner's full name"
                  value={coupleSettings.partner1Name}
                  onChange={(e) => setCoupleSettings({...coupleSettings, partner1Name: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="partner2-name">Partner 2 Name</Label>
                <Input 
                  id="partner2-name" 
                  placeholder="Second partner's full name"
                  value={coupleSettings.partner2Name}
                  onChange={(e) => setCoupleSettings({...coupleSettings, partner2Name: e.target.value})}
                />
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="wedding-style">Wedding Style</Label>
              <Select 
                value={coupleSettings.weddingStyle}
                onValueChange={(value) => setCoupleSettings({...coupleSettings, weddingStyle: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select wedding style" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="traditional">Traditional</SelectItem>
                  <SelectItem value="modern">Modern</SelectItem>
                  <SelectItem value="rustic">Rustic</SelectItem>
                  <SelectItem value="vintage">Vintage</SelectItem>
                  <SelectItem value="destination">Destination</SelectItem>
                  <SelectItem value="casual">Casual</SelectItem>
                  <SelectItem value="formal">Formal</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="wedding-date">Wedding Date</Label>
              <Input 
                id="wedding-date" 
                type="date"
                value={coupleSettings.weddingDate}
                onChange={(e) => setCoupleSettings({...coupleSettings, weddingDate: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="guest-count">Expected Guest Count</Label>
              <Input 
                id="guest-count" 
                type="number" 
                placeholder="Enter guest count"
                value={coupleSettings.expectedGuests || ''}
                onChange={(e) => setCoupleSettings({...coupleSettings, expectedGuests: parseInt(e.target.value) || 0})}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="venue">Venue</Label>
            <Input 
              id="venue" 
              placeholder="Enter venue name"
              value={coupleSettings.venue}
              onChange={(e) => setCoupleSettings({...coupleSettings, venue: e.target.value})}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input 
              id="location" 
              placeholder="Enter city, state/country"
              value={coupleSettings.location}
              onChange={(e) => setCoupleSettings({...coupleSettings, location: e.target.value})}
            />
          </div>
          
          <Button onClick={saveWeddingDetails} disabled={loading}>
            {loading ? 'Loading...' : 'Save'}
          </Button>
        </CardContent>
      </Card>

      {/* Sharing & Collaboration */}
      <Card>
        <CardHeader>
          <CardTitle>Sharing & Collaboration</CardTitle>
          <CardDescription>Invite planners, family members, or vendors</CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/dashboard/settings/sharing">
            <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Manage Collaborators</h3>
                  <p className="text-sm text-muted-foreground">Invite planners, family members, or vendors</p>
                </div>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground" />
            </div>
          </Link>
        </CardContent>
      </Card>

      {/* Budget Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Budget Settings</CardTitle>
          <CardDescription>Manage your wedding budget preferences</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="total-budget">Total Wedding Budget</Label>
            <Input 
              id="total-budget" 
              type="number" 
              placeholder="Enter total budget"
              value={coupleSettings.totalBudget || ''}
              onChange={(e) => setCoupleSettings({...coupleSettings, totalBudget: parseInt(e.target.value) || 0})}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Select 
                value={userPreferences.currency}
                onValueChange={(value) => setUserPreferences({...userPreferences, currency: value})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD ($)</SelectItem>
                  <SelectItem value="EUR">EUR (€)</SelectItem>
                  <SelectItem value="GBP">GBP (£)</SelectItem>
                  <SelectItem value="NGN">NGN (₦)</SelectItem>
                  <SelectItem value="CAD">CAD ($)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="alert-threshold">Budget Alert Threshold</Label>
              <Select 
                value={userPreferences.alertThreshold.toString()}
                onValueChange={(value) => setUserPreferences({...userPreferences, alertThreshold: parseInt(value)})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="80">80% of budget</SelectItem>
                  <SelectItem value="85">85% of budget</SelectItem>
                  <SelectItem value="90">90% of budget</SelectItem>
                  <SelectItem value="95">95% of budget</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Push Notifications - Removed (API endpoints no longer available) */}

      {/* Email Notification Preferences */}
      <Card>
        <CardHeader>
          <CardTitle>Email Notifications</CardTitle>
          <CardDescription>Choose how you'd like to receive email updates</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="email-notifications" className="text-base">Email Notifications</Label>
              <p className="text-sm text-muted-foreground">Receive updates via email</p>
            </div>
            <Switch
              id="email-notifications"
              checked={userPreferences.emailNotifications}
              onCheckedChange={(checked) => setUserPreferences({...userPreferences, emailNotifications: checked})}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="email-task-reminders" className="text-base">Task Reminders</Label>
              <p className="text-sm text-muted-foreground">Get reminded about upcoming deadlines</p>
            </div>
            <Switch
              id="email-task-reminders"
              checked={userPreferences.taskReminders}
              onCheckedChange={(checked) => setUserPreferences({...userPreferences, taskReminders: checked})}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="email-budget-alerts" className="text-base">Budget Alerts</Label>
              <p className="text-sm text-muted-foreground">Notifications when approaching budget limits</p>
            </div>
            <Switch
              id="email-budget-alerts"
              checked={userPreferences.budgetAlerts}
              onCheckedChange={(checked) => setUserPreferences({...userPreferences, budgetAlerts: checked})}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="email-vendor-updates" className="text-base">Vendor Updates</Label>
              <p className="text-sm text-muted-foreground">Updates from your wedding vendors</p>
            </div>
            <Switch
              id="email-vendor-updates"
              checked={userPreferences.vendorUpdates}
              onCheckedChange={(checked) => setUserPreferences({...userPreferences, vendorUpdates: checked})}
            />
          </div>
          
          <Button onClick={saveUserPreferences} disabled={loading}>
            {loading ? 'Saving...' : 'Save Email Preferences'}
          </Button>
        </CardContent>
      </Card>

      {/* Account Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Account Settings</CardTitle>
          <CardDescription>Manage your account preferences</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="display-name">Display Name</Label>
            <Input 
              id="display-name" 
              placeholder="Enter your display name"
              value={user?.email || ''}
              disabled
            />
            <p className="text-sm text-muted-foreground">
              Display name is managed through your account
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input 
              id="email" 
              value={user?.email || ''}
              disabled
            />
            <p className="text-sm text-muted-foreground">
              Email address is managed through your account
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="timezone">Timezone</Label>
            <Select 
              value={userPreferences.timezone}
              onValueChange={(value) => setUserPreferences({...userPreferences, timezone: value})}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="America/New_York">Eastern Time (UTC-5)</SelectItem>
                <SelectItem value="America/Chicago">Central Time (UTC-6)</SelectItem>
                <SelectItem value="America/Denver">Mountain Time (UTC-7)</SelectItem>
                <SelectItem value="America/Los_Angeles">Pacific Time (UTC-8)</SelectItem>
                <SelectItem value="Europe/London">London (UTC+0)</SelectItem>
                <SelectItem value="Europe/Paris">Paris (UTC+1)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="language">Language</Label>
            <Select 
              value={userPreferences.language}
              onValueChange={(value) => setUserPreferences({...userPreferences, language: value})}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="es">Español (Spanish)</SelectItem>
                <SelectItem value="fr">Français (French)</SelectItem>
                <SelectItem value="de">Deutsch (German)</SelectItem>
                <SelectItem value="it">Italiano (Italian)</SelectItem>
                <SelectItem value="pt">Português (Portuguese)</SelectItem>
                <SelectItem value="ja">日本語 (Japanese)</SelectItem>
                <SelectItem value="zh">中文 (Chinese)</SelectItem>
                <SelectItem value="ar">العربية (Arabic)</SelectItem>
                <SelectItem value="hi">हिन्दी (Hindi)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <Button onClick={saveUserPreferences} disabled={loading}>
            {loading ? 'Saving...' : 'Save Account Settings'}
          </Button>
        </CardContent>
      </Card>

      {/* Translation Test */}
      <TranslationTest />

      {/* Language & Region Settings */}
      <LocaleSelector />

      {/* Data & Privacy */}
      <Card>
        <CardHeader>
          <CardTitle>Data & Privacy</CardTitle>
          <CardDescription>Manage your data and privacy settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <h3 className="font-semibold">Export Data</h3>
              <p className="text-sm text-muted-foreground">Download a copy of all your wedding planning data</p>
            </div>
            <Button variant="outline" onClick={exportData}>
              Export
            </Button>
          </div>
          
          <div className="flex items-center justify-between p-4 border rounded-lg border-red-200">
            <div>
              <h3 className="font-semibold text-red-900">Delete Account</h3>
              <p className="text-sm text-red-600">Permanently delete your account and all data</p>
            </div>
            <Button variant="destructive" onClick={deleteAccount}>
              Delete
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}