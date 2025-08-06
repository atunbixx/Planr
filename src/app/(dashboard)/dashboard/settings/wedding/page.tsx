'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, Heart } from 'lucide-react'
import Link from 'next/link'

interface WeddingSettings {
  partnerName: string
  weddingDate: string
  venue: string
  location: string
  expectedGuests: number
  totalBudget: number
  weddingStyle: string
}

export default function WeddingSettingsPage() {
  const { user, isLoaded } = useUser()
  const router = useRouter()
  const [settings, setSettings] = useState<WeddingSettings>({
    partnerName: '',
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
    if (isLoaded && user) {
      loadSettings()
    }
  }, [isLoaded, user])

  const loadSettings = async () => {
    setLoading(true)
    try {
      // Initialize user first
      await fetch('/api/user/initialize', {
        method: 'POST',
      })

      // Load existing wedding settings
      const response = await fetch('/api/settings/wedding')
      if (response.ok) {
        const data = await response.json()
        if (data.couple) {
          setSettings({
            partnerName: data.couple.partnerName || '',
            weddingDate: data.couple.weddingDate ? new Date(data.couple.weddingDate).toISOString().split('T')[0] : '',
            venue: data.couple.venue || '',
            location: data.couple.location || '',
            expectedGuests: data.couple.expectedGuests || 0,
            totalBudget: data.couple.totalBudget || 0,
            weddingStyle: data.couple.weddingStyle || ''
          })
        }
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
      const response = await fetch('/api/settings/wedding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      })

      if (response.ok) {
        alert('Wedding details saved successfully! You can now access all features.')
        // Redirect back to where they came from (guests page) or dashboard
        router.push('/dashboard/guests')
      } else {
        const errorData = await response.json()
        alert(errorData.message || 'Failed to save wedding details. Please try again.')
      }
    } catch (error) {
      console.error('Error saving wedding details:', error)
      alert('Failed to save wedding details. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const isFormValid = () => {
    return settings.partnerName.trim() && 
           settings.weddingDate && 
           settings.venue.trim() && 
           settings.location.trim()
  }

  if (!isLoaded || loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2">Loading wedding settings...</p>
        </div>
      </div>
    )
  }

  if (!user) {
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
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="partner-name">Partner's Name *</Label>
              <Input 
                id="partner-name" 
                placeholder="Your partner's full name"
                value={settings.partnerName}
                onChange={(e) => setSettings({...settings, partnerName: e.target.value})}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="wedding-date">Wedding Date *</Label>
              <Input 
                id="wedding-date" 
                type="date"
                value={settings.weddingDate}
                onChange={(e) => setSettings({...settings, weddingDate: e.target.value})}
                required
              />
            </div>
          </div>
          
          {/* Venue Information */}
          <div className="space-y-2">
            <Label htmlFor="venue">Venue *</Label>
            <Input 
              id="venue" 
              placeholder="Venue name (e.g., Grand Ballroom Hotel)"
              value={settings.venue}
              onChange={(e) => setSettings({...settings, venue: e.target.value})}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location *</Label>
            <Input 
              id="location" 
              placeholder="City, State/Country (e.g., New York, NY)"
              value={settings.location}
              onChange={(e) => setSettings({...settings, location: e.target.value})}
              required
            />
          </div>
          
          {/* Additional Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="guest-count">Expected Guest Count</Label>
              <Input 
                id="guest-count" 
                type="number" 
                placeholder="Number of guests"
                value={settings.expectedGuests || ''}
                onChange={(e) => setSettings({...settings, expectedGuests: parseInt(e.target.value) || 0})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="total-budget">Total Budget</Label>
              <Input 
                id="total-budget" 
                type="number" 
                placeholder="Wedding budget (USD)"
                value={settings.totalBudget || ''}
                onChange={(e) => setSettings({...settings, totalBudget: parseInt(e.target.value) || 0})}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="wedding-style">Wedding Style</Label>
            <Select 
              value={settings.weddingStyle}
              onValueChange={(value) => setSettings({...settings, weddingStyle: value})}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose your wedding style" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="traditional">Traditional</SelectItem>
                <SelectItem value="modern">Modern</SelectItem>
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