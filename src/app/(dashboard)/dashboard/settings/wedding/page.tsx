'use client'

import { useState, useEffect } from 'react'
import { useSupabaseAuth } from '@/lib/auth/client'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, Heart } from 'lucide-react'
import Link from 'next/link'
import { api } from '@/lib/api/client'

interface WeddingSettings {
  partner1Name: string
  partner2Name: string
  weddingDate: string
  venue: string
  location: string
  expectedGuests: number
  totalBudget: number
  weddingStyle: string
}

export default function WeddingSettingsPage() {
  const { user, isSignedIn, isLoading } = useSupabaseAuth()
  const router = useRouter()
  const [settings, setSettings] = useState<WeddingSettings>({
    partner1Name: '',
    partner2Name: '',
    weddingDate: '',
    venue: '',
    location: '',
    expectedGuests: 0,
    totalBudget: 0,
    weddingStyle: ''
  })
  
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!isLoading && isSignedIn && user) {
      loadSettings()
    }
  }, [isLoading, isSignedIn, user])

  const loadSettings = async () => {
    setLoading(true)
    try {
      // Initialize user first
      await fetch('/api/user/initialize', {
        method: 'POST',
      })

      // Load existing wedding settings
      const response = await api.settings.wedding.get()
      console.log('Settings API response:', response)
      
      if (response.success && response.data) {
        const wedding = response.data
        console.log('Settings data received:', wedding)
        
        const newSettings = {
          partner1Name: wedding.partnerOneName || '',
          partner2Name: wedding.partnerTwoName || '',
          weddingDate: wedding.weddingDate ? new Date(wedding.weddingDate).toISOString().split('T')[0] : '',
          venue: wedding.venue?.name || '',
          location: wedding.venue ? `${wedding.venue.city}, ${wedding.venue.state}` : '',
          expectedGuests: wedding.guestCount || 0,
          totalBudget: wedding.budget || 0,
          weddingStyle: wedding.theme || ''
        }
        console.log('Setting new settings:', newSettings)
        setSettings(newSettings)
      } else {
        console.log('No wedding data found in response')
      }
    } catch (error) {
      console.error('Error loading settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const saveSettings = async () => {
    setSaving(true)
    try {
      const response = await api.settings.wedding.update({
        partnerOneName: settings.partner1Name,
        partnerTwoName: settings.partner2Name,
        weddingDate: settings.weddingDate,
        venue: {
          name: settings.venue,
          address: '',
          city: settings.location.split(',')[0]?.trim() || '',
          state: settings.location.split(',')[1]?.trim() || '',
          country: 'Nigeria',
        },
        guestCount: settings.expectedGuests,
        budget: settings.totalBudget,
        theme: settings.weddingStyle
      })

      if (response.success) {
        alert('Wedding details saved successfully! You can now access all features.')
        // Redirect back to where they came from (guests page) or dashboard
        router.push('/dashboard/guests')
      } else {
        alert('Failed to save wedding details. Please try again.')
      }
    } catch (error) {
      console.error('Error saving wedding details:', error)
      alert(error instanceof Error ? error.message : 'Failed to save wedding details. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const isFormValid = () => {
    return settings.partner1Name.trim() && 
           settings.partner2Name.trim() &&
           settings.weddingDate && 
           settings.venue.trim() && 
           settings.location.trim()
  }

  if (isLoading || loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2">Loading wedding settings...</p>
        </div>
      </div>
    )
  }

  if (!isSignedIn || !user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Please sign in to access settings</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      {/* Header */}
      <div className="mb-8">
        <Link href="/dashboard" className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Link>
        
        <div className="text-center">
          <div className="flex items-center justify-center mb-4">
            <Heart className="h-8 w-8 text-rose-500 mr-2" />
            <h1 className="text-3xl font-bold text-gray-900">Wedding Setup</h1>
          </div>
          <p className="text-gray-600 max-w-md mx-auto">
            Complete your wedding profile to unlock all features including guest management, vendor tracking, and budget planning.
          </p>
        </div>
      </div>

      {/* Wedding Details Form */}
      <Card>
        <CardHeader>
          <CardTitle>Your Wedding Details</CardTitle>
          <CardDescription>
            Tell us about your special day to personalize your experience
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Partner Names Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Heart className="h-4 w-4 text-rose-500" />
              <h3 className="font-semibold text-gray-900">Partner Information</h3>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="partner1-name" className="text-sm font-medium">Partner 1 Name *</Label>
                <Input 
                  id="partner1-name" 
                  placeholder="First partner's full name"
                  value={settings.partner1Name}
                  onChange={(e) => setSettings({...settings, partner1Name: e.target.value})}
                  required
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="partner2-name" className="text-sm font-medium">Partner 2 Name *</Label>
                <Input 
                  id="partner2-name" 
                  placeholder="Second partner's full name"
                  value={settings.partner2Name}
                  onChange={(e) => setSettings({...settings, partner2Name: e.target.value})}
                  required
                  className="w-full"
                />
              </div>
            </div>
          </div>
          
          {/* Wedding Date Section */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">Wedding Date</h3>
            <div className="space-y-2">
              <Label htmlFor="wedding-date" className="text-sm font-medium">Wedding Date *</Label>
              <Input 
                id="wedding-date" 
                type="date"
                value={settings.weddingDate}
                onChange={(e) => setSettings({...settings, weddingDate: e.target.value})}
                required
                className="w-full max-w-md"
              />
            </div>
          </div>
          
          {/* Venue Information Section */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">Venue Information</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="venue" className="text-sm font-medium">Venue Name *</Label>
                <Input 
                  id="venue" 
                  placeholder="Venue name (e.g., Eko Hotel & Suites)"
                  value={settings.venue}
                  onChange={(e) => setSettings({...settings, venue: e.target.value})}
                  required
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location" className="text-sm font-medium">Location *</Label>
                <Input 
                  id="location" 
                  placeholder="City, State (e.g., Lagos, Nigeria)"
                  value={settings.location}
                  onChange={(e) => setSettings({...settings, location: e.target.value})}
                  required
                  className="w-full"
                />
              </div>
            </div>
          </div>
          
          {/* Wedding Details Section */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">Wedding Details</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="guest-count" className="text-sm font-medium">Expected Guest Count</Label>
                <Input 
                  id="guest-count" 
                  type="number" 
                  placeholder="Number of guests (e.g., 150)"
                  value={settings.expectedGuests || ''}
                  onChange={(e) => setSettings({...settings, expectedGuests: parseInt(e.target.value) || 0})}
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="total-budget" className="text-sm font-medium">Total Budget (₦)</Label>
                <Input 
                  id="total-budget" 
                  type="number" 
                  placeholder="Wedding budget in Naira (e.g., 5000000)"
                  value={settings.totalBudget || ''}
                  onChange={(e) => setSettings({...settings, totalBudget: parseInt(e.target.value) || 0})}
                  className="w-full"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="wedding-style" className="text-sm font-medium">Wedding Style</Label>
              <Select 
                value={settings.weddingStyle}
                onValueChange={(value) => setSettings({...settings, weddingStyle: value})}
              >
                <SelectTrigger className="w-full max-w-md">
                  <SelectValue placeholder="Choose your wedding style" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="traditional">Traditional Nigerian</SelectItem>
                  <SelectItem value="modern">Modern</SelectItem>
                  <SelectItem value="fusion">Traditional + White Wedding</SelectItem>
                  <SelectItem value="rustic">Rustic</SelectItem>
                  <SelectItem value="vintage">Vintage</SelectItem>
                  <SelectItem value="destination">Destination</SelectItem>
                  <SelectItem value="casual">Casual</SelectItem>
                  <SelectItem value="formal">Formal</SelectItem>
                  <SelectItem value="bohemian">Bohemian</SelectItem>
                  <SelectItem value="garden">Garden Party</SelectItem>
                  <SelectItem value="beach">Beach</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Save Button */}
          <div className="pt-4">
            <Button 
              onClick={saveSettings} 
              disabled={saving || !isFormValid()}
              className="w-full"
              size="lg"
            >
              {saving ? 'Saving Wedding Details...' : 'Complete Wedding Setup'}
            </Button>
            
            <p className="text-sm text-gray-500 text-center mt-2">
              * Required fields. You can update these details anytime.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Help Section */}
      <Card className="mt-6">
        <CardContent className="pt-6">
          <div className="text-center">
            <h3 className="font-semibold mb-2">Need Help?</h3>
            <p className="text-sm text-gray-600 mb-4">
              After completing your wedding profile, you'll have access to:
            </p>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-rose-500 rounded-full mr-2"></div>
                Guest Management
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-rose-500 rounded-full mr-2"></div>
                Budget Tracking
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-rose-500 rounded-full mr-2"></div>
                Vendor Directory
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-rose-500 rounded-full mr-2"></div>
                Task Management
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}