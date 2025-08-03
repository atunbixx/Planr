'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'
import { AvatarUpload } from '@/components/settings/AvatarUpload'
import { ThemeSelector, ThemePreview } from '@/components/settings/ThemeSelector'
import { NotificationToggle, NotificationGroup, ToggleAll } from '@/components/settings/NotificationToggle'
import { SmartNotificationSettings } from '@/components/settings/SmartNotificationSettings'
import { LocationTriggers } from '@/components/notifications/LocationTriggers'
import {
  profileSettingsSchema,
  passwordChangeSchema,
  type ProfileSettings,
  type PasswordChange,
  type NotificationPreferences,
  type ThemePreferences,
  type PrivacySettings
} from '@/types/settings'

export default function SettingsPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState('profile')
  const [loading, setLoading] = useState(false)
  const [pageLoading, setPageLoading] = useState(true)

  // Profile form
  const profileForm = useForm<ProfileSettings>({
    resolver: zodResolver(profileSettingsSchema),
    defaultValues: {
      fullName: '',
      email: '',
      weddingDate: '',
      partnerName: '',
      venue: '',
      guestCount: '',
      avatarUrl: ''
    }
  })

  // Password form
  const passwordForm = useForm<PasswordChange>({
    resolver: zodResolver(passwordChangeSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    }
  })

  // Notification preferences state
  const [notifications, setNotifications] = useState<NotificationPreferences>({
    emailUpdates: true,
    taskReminders: true,
    vendorMessages: true,
    guestRsvpAlerts: true,
    budgetAlerts: true,
    dailyDigest: false,
    weeklyReport: true
  })

  // Theme preferences state
  const [themePrefs, setThemePrefs] = useState<ThemePreferences>({
    colorScheme: 'wedding-blush',
    fontSize: 'medium',
    compactMode: false
  })

  // Privacy settings state
  const [privacySettings, setPrivacySettings] = useState<PrivacySettings>({
    profileVisibility: 'private',
    shareWithVendors: false,
    allowGuestUploads: true,
    dataExport: true
  })

  // Load user data on mount
  useEffect(() => {
    if (user) {
      profileForm.reset({
        fullName: user.user_metadata?.full_name || '',
        email: user.email || '',
        weddingDate: user.user_metadata?.wedding_date || '',
        partnerName: user.user_metadata?.partner_name || '',
        venue: user.user_metadata?.venue || '',
        guestCount: user.user_metadata?.guest_count || '',
        avatarUrl: user.user_metadata?.avatar_url || ''
      })
      
      // Load other preferences from user metadata or local storage
      if (user.user_metadata?.notifications) {
        setNotifications(user.user_metadata.notifications)
      }
      if (user.user_metadata?.theme) {
        setThemePrefs(user.user_metadata.theme)
      }
      if (user.user_metadata?.privacy) {
        setPrivacySettings(user.user_metadata.privacy)
      }
      
      setPageLoading(false)
    }
  }, [user, profileForm])

  const handleProfileUpdate = async (data: ProfileSettings) => {
    setLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          full_name: data.fullName,
          wedding_date: data.weddingDate,
          partner_name: data.partnerName,
          venue: data.venue,
          guest_count: data.guestCount
        }
      })

      if (error) throw error

      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordChange = async (data: PasswordChange) => {
    setLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({
        password: data.newPassword
      })

      if (error) throw error

      toast({
        title: "Password updated",
        description: "Your password has been successfully changed.",
      })
      
      passwordForm.reset()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to change password. Please try again.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleNotificationUpdate = async () => {
    setLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({
        data: { notifications }
      })

      if (error) throw error

      toast({
        title: "Notifications updated",
        description: "Your notification preferences have been saved.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update notifications. Please try again.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleThemeUpdate = async () => {
    setLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({
        data: { theme: themePrefs }
      })

      if (error) throw error

      // Apply theme to document
      document.documentElement.setAttribute('data-theme', themePrefs.colorScheme)
      document.documentElement.setAttribute('data-font-size', themePrefs.fontSize)
      document.documentElement.classList.toggle('compact', themePrefs.compactMode)

      toast({
        title: "Theme updated",
        description: "Your theme preferences have been applied.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update theme. Please try again.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handlePrivacyUpdate = async () => {
    setLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({
        data: { privacy: privacySettings }
      })

      if (error) throw error

      toast({
        title: "Privacy settings updated",
        description: "Your privacy preferences have been saved.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update privacy settings. Please try again.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const tabs = [
    { id: 'profile', label: 'Profile', icon: 'fas fa-user' },
    { id: 'account', label: 'Account', icon: 'fas fa-shield-alt' },
    { id: 'notifications', label: 'Notifications', icon: 'fas fa-bell' },
    { id: 'theme', label: 'Theme', icon: 'fas fa-palette' },
    { id: 'privacy', label: 'Privacy', icon: 'fas fa-lock' },
    { id: 'integrations', label: 'Integrations', icon: 'fas fa-plug' }
  ]

  if (pageLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-gray-500">Loading settings...</p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Link href="/dashboard" className="text-gray-500 hover:text-gray-700 mr-4">
                <i className="fas fa-arrow-left"></i>
              </Link>
              <h1 className="font-playfair text-2xl font-semibold text-gray-900">Settings</h1>
            </div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <Button 
                onClick={() => {
                  switch(activeTab) {
                    case 'profile':
                      profileForm.handleSubmit(handleProfileUpdate)()
                      break
                    case 'account':
                      if (passwordForm.formState.isDirty) {
                        passwordForm.handleSubmit(handlePasswordChange)()
                      }
                      break
                    case 'notifications':
                      handleNotificationUpdate()
                      break
                    case 'theme':
                      handleThemeUpdate()
                      break
                    case 'privacy':
                      handlePrivacyUpdate()
                      break
                  }
                }}
                disabled={loading}
                className="bg-black text-white hover:bg-gray-800"
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </Button>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white border-b sticky top-16 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8 overflow-x-auto" aria-label="Settings tabs">
            {tabs.map((tab) => (
              <motion.button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap
                  ${activeTab === tab.id
                    ? 'border-black text-gray-900'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
                whileHover={{ y: -1 }}
                whileTap={{ y: 0 }}
              >
                <i className={`${tab.icon} mr-2`}></i>
                {tab.label}
              </motion.button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnimatePresence mode="wait">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <motion.div
              key="profile"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
              className="grid gap-6 md:grid-cols-2"
            >
              <Card>
                <CardHeader>
                  <CardTitle>Personal Information</CardTitle>
                  <CardDescription>Update your personal details and wedding information</CardDescription>
                </CardHeader>
                <CardContent>
                  <form className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="fullName">Full Name</Label>
                      <Input
                        id="fullName"
                        {...profileForm.register('fullName')}
                        placeholder="Enter your full name"
                      />
                      {profileForm.formState.errors.fullName && (
                        <p className="text-sm text-red-600">{profileForm.formState.errors.fullName.message}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        {...profileForm.register('email')}
                        disabled
                        className="bg-gray-50"
                      />
                      <p className="text-sm text-gray-500">Email cannot be changed</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="weddingDate">Wedding Date</Label>
                      <Input
                        id="weddingDate"
                        type="date"
                        {...profileForm.register('weddingDate')}
                      />
                    </div>
                  </form>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Wedding Details</CardTitle>
                  <CardDescription>Information about your wedding</CardDescription>
                </CardHeader>
                <CardContent>
                  <form className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="partnerName">Partner's Name</Label>
                      <Input
                        id="partnerName"
                        {...profileForm.register('partnerName')}
                        placeholder="Enter your partner's name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="venue">Venue</Label>
                      <Input
                        id="venue"
                        {...profileForm.register('venue')}
                        placeholder="Enter your wedding venue"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="guestCount">Expected Guest Count</Label>
                      <Input
                        id="guestCount"
                        type="number"
                        {...profileForm.register('guestCount')}
                        placeholder="150"
                      />
                    </div>
                  </form>
                </CardContent>
              </Card>

              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Profile Photo</CardTitle>
                  <CardDescription>Upload a profile photo for your account</CardDescription>
                </CardHeader>
                <CardContent>
                  <AvatarUpload
                    currentAvatarUrl={profileForm.watch('avatarUrl')}
                    userId={user?.id || ''}
                    onUploadComplete={(url) => profileForm.setValue('avatarUrl', url)}
                  />
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Account Tab */}
          {activeTab === 'account' && (
            <motion.div
              key="account"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
              className="grid gap-6 md:grid-cols-2"
            >
              <Card>
                <CardHeader>
                  <CardTitle>Password</CardTitle>
                  <CardDescription>Change your account password</CardDescription>
                </CardHeader>
                <CardContent>
                  <form className="space-y-4" onSubmit={passwordForm.handleSubmit(handlePasswordChange)}>
                    <div className="space-y-2">
                      <Label htmlFor="currentPassword">Current Password</Label>
                      <Input
                        id="currentPassword"
                        type="password"
                        {...passwordForm.register('currentPassword')}
                        placeholder="Enter current password"
                      />
                      {passwordForm.formState.errors.currentPassword && (
                        <p className="text-sm text-red-600">{passwordForm.formState.errors.currentPassword.message}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="newPassword">New Password</Label>
                      <Input
                        id="newPassword"
                        type="password"
                        {...passwordForm.register('newPassword')}
                        placeholder="Enter new password"
                      />
                      {passwordForm.formState.errors.newPassword && (
                        <p className="text-sm text-red-600">{passwordForm.formState.errors.newPassword.message}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm New Password</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        {...passwordForm.register('confirmPassword')}
                        placeholder="Confirm new password"
                      />
                      {passwordForm.formState.errors.confirmPassword && (
                        <p className="text-sm text-red-600">{passwordForm.formState.errors.confirmPassword.message}</p>
                      )}
                    </div>
                  </form>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Two-Factor Authentication</CardTitle>
                  <CardDescription>Add an extra layer of security to your account</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <i className="fas fa-mobile-alt text-gray-600 text-xl"></i>
                      <div>
                        <p className="font-medium">SMS Authentication</p>
                        <p className="text-sm text-gray-500">Not enabled</p>
                      </div>
                    </div>
                    <Button variant="secondary" size="sm">Enable</Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="md:col-span-2">
                <CardHeader className="border-red-200 bg-red-50">
                  <CardTitle className="text-red-900">Danger Zone</CardTitle>
                  <CardDescription className="text-red-700">Irreversible actions for your account</CardDescription>
                </CardHeader>
                <CardContent className="bg-red-50 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-red-900">Delete Account</p>
                      <p className="text-sm text-red-700">Permanently delete your account and all data</p>
                    </div>
                    <Button variant="secondary" className="border-red-300 text-red-700 hover:bg-red-100">
                      Delete Account
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <motion.div
              key="notifications"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              {/* Smart Notification Settings */}
              <SmartNotificationSettings />
              
              {/* Location-Based Notifications */}
              <LocationTriggers />
            </motion.div>
          )}

          {/* Theme Tab */}
          {activeTab === 'theme' && (
            <motion.div
              key="theme"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
              className="grid gap-6"
            >
              <Card>
                <CardHeader>
                  <CardTitle>Color Scheme</CardTitle>
                  <CardDescription>Choose your preferred color theme</CardDescription>
                </CardHeader>
                <CardContent>
                  <ThemeSelector
                    selectedTheme={themePrefs.colorScheme}
                    onThemeChange={(theme) => setThemePrefs({ ...themePrefs, colorScheme: theme as any })}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Display Preferences</CardTitle>
                  <CardDescription>Customize how content is displayed</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <Label htmlFor="fontSize" className="mb-2 block">Font Size</Label>
                    <select
                      id="fontSize"
                      value={themePrefs.fontSize}
                      onChange={(e) => setThemePrefs({ ...themePrefs, fontSize: e.target.value as any })}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    >
                      <option value="small">Small</option>
                      <option value="medium">Medium (Default)</option>
                      <option value="large">Large</option>
                    </select>
                  </div>
                  <NotificationToggle
                    checked={themePrefs.compactMode}
                    onChange={(checked) => setThemePrefs({ ...themePrefs, compactMode: checked })}
                    label="Compact Mode"
                    description="Reduce spacing between elements for a denser layout"
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Theme Preview</CardTitle>
                  <CardDescription>See how your selected theme looks</CardDescription>
                </CardHeader>
                <CardContent>
                  <ThemePreview theme={themePrefs.colorScheme} />
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Privacy Tab */}
          {activeTab === 'privacy' && (
            <motion.div
              key="privacy"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
              className="grid gap-6"
            >
              <Card>
                <CardHeader>
                  <CardTitle>Privacy Settings</CardTitle>
                  <CardDescription>Control who can see your information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <Label htmlFor="profileVisibility" className="mb-2 block">Profile Visibility</Label>
                    <select
                      id="profileVisibility"
                      value={privacySettings.profileVisibility}
                      onChange={(e) => setPrivacySettings({ ...privacySettings, profileVisibility: e.target.value as any })}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    >
                      <option value="private">Private - Only you</option>
                      <option value="vendors">Vendors only</option>
                      <option value="guests">Guests and vendors</option>
                    </select>
                  </div>
                  <NotificationToggle
                    checked={privacySettings.shareWithVendors}
                    onChange={(checked) => setPrivacySettings({ ...privacySettings, shareWithVendors: checked })}
                    label="Share with Vendors"
                    description="Allow vendors to see your wedding details"
                  />
                  <NotificationToggle
                    checked={privacySettings.allowGuestUploads}
                    onChange={(checked) => setPrivacySettings({ ...privacySettings, allowGuestUploads: checked })}
                    label="Guest Photo Uploads"
                    description="Allow guests to upload photos to your gallery"
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Data Management</CardTitle>
                  <CardDescription>Control your data and export options</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">Export Your Data</p>
                      <p className="text-sm text-gray-500">Download all your wedding planning data</p>
                    </div>
                    <Button variant="secondary">
                      <i className="fas fa-download mr-2"></i>
                      Export
                    </Button>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">Data Retention</p>
                      <p className="text-sm text-gray-500">Your data is retained for 2 years after your wedding date</p>
                    </div>
                    <Button variant="ghost" size="sm">Learn More</Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Integrations Tab */}
          {activeTab === 'integrations' && (
            <motion.div
              key="integrations"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
              className="grid gap-6"
            >
              <Card>
                <CardHeader>
                  <CardTitle>Connected Services</CardTitle>
                  <CardDescription>Manage your connected third-party services</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    {
                      name: 'Google Calendar',
                      description: 'Sync your wedding timeline and vendor appointments',
                      icon: 'fab fa-google',
                      connected: false
                    },
                    {
                      name: 'Instagram',
                      description: 'Import photos from your wedding hashtag',
                      icon: 'fab fa-instagram',
                      connected: false
                    },
                    {
                      name: 'Pinterest',
                      description: 'Import inspiration boards and ideas',
                      icon: 'fab fa-pinterest',
                      connected: false
                    },
                    {
                      name: 'Dropbox',
                      description: 'Backup your wedding photos and documents',
                      icon: 'fab fa-dropbox',
                      connected: false
                    }
                  ].map((service, index) => (
                    <motion.div
                      key={service.name}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <div className="flex items-center space-x-4">
                        <i className={`${service.icon} text-2xl text-gray-600`}></i>
                        <div>
                          <p className="font-medium">{service.name}</p>
                          <p className="text-sm text-gray-500">{service.description}</p>
                        </div>
                      </div>
                      <Button variant={service.connected ? "secondary" : "primary"} size="sm">
                        {service.connected ? 'Disconnect' : 'Connect'}
                      </Button>
                    </motion.div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>API Access</CardTitle>
                  <CardDescription>Developer access for custom integrations</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="p-4 bg-gray-900 rounded-lg">
                    <p className="text-sm text-gray-300 mb-2">API Key</p>
                    <div className="flex items-center space-x-2">
                      <code className="flex-1 text-sm text-white bg-gray-800 px-3 py-2 rounded">
                        ••••••••••••••••••••••••••••••••
                      </code>
                      <Button variant="secondary" size="sm">
                        <i className="fas fa-eye"></i>
                      </Button>
                      <Button variant="secondary" size="sm">
                        <i className="fas fa-copy"></i>
                      </Button>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 mt-4">
                    Use this API key to integrate Wedding Studio with your own applications. 
                    <Link href="/docs/api" className="text-black underline ml-1">View documentation</Link>
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}