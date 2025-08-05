'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Textarea } from '@/components/ui/textarea'
import { Heart, Calendar, MapPin, CheckCircle } from 'lucide-react'

interface RSVPData {
  guest: {
    name: string
    plusOne: boolean
    rsvpStatus: string
    dietaryNotes?: string
    specialRequests?: string
  }
  wedding: {
    coupleName: string
    date: string
    venue: string
    location: string
  }
}

export default function RSVPPage({ params }: { params: Promise<{ code: string }> }) {
  const [rsvpData, setRsvpData] = useState<RSVPData | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [code, setCode] = useState<string>('')
  
  // Form state
  const [rsvpStatus, setRsvpStatus] = useState<'confirmed' | 'declined'>('confirmed')
  const [dietaryNotes, setDietaryNotes] = useState('')
  const [specialRequests, setSpecialRequests] = useState('')

  // Extract code from params Promise
  useEffect(() => {
    params.then(({ code }) => setCode(code))
  }, [params])

  const fetchInvitation = async () => {
    if (!code) return
    try {
      const response = await fetch(`/api/guests/rsvp/${code}`)
      if (!response.ok) {
        throw new Error('Invitation not found')
      }
      const data = await response.json()
      setRsvpData(data)
      setDietaryNotes(data.guest.dietaryNotes || '')
      setSpecialRequests(data.guest.specialRequests || '')
      
      // If already responded, show submitted state
      if (data.guest.rsvpStatus !== 'pending') {
        setSubmitted(true)
        setRsvpStatus(data.guest.rsvpStatus as 'confirmed' | 'declined')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load invitation')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchInvitation()
  }, [code])

  const handleSubmit = async () => {
    if (!rsvpData) return

    setSubmitting(true)
    try {
      const response = await fetch(`/api/guests/rsvp/${code}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rsvpStatus,
          dietaryNotes: dietaryNotes.trim() || null,
          specialRequests: specialRequests.trim() || null,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to submit RSVP')
      }

      setSubmitted(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit RSVP')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 to-pink-100 flex items-center justify-center">
        <div className="text-center">
          <Heart className="w-8 h-8 text-rose-500 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600">Loading your invitation...</p>
        </div>
      </div>
    )
  }

  if (error || !rsvpData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 to-pink-100 flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardHeader className="text-center">
            <CardTitle className="text-red-600">Invitation Not Found</CardTitle>
            <CardDescription>
              {error || 'This invitation link is invalid or has expired.'}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 to-pink-100 flex items-center justify-center">
        <Card className="w-full max-w-2xl mx-4">
          <CardHeader className="text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <CardTitle className="text-2xl text-gray-800">
              {rsvpStatus === 'confirmed' ? 'See You There!' : 'Thanks for Letting Us Know'}
            </CardTitle>
            <CardDescription className="text-lg">
              {rsvpStatus === 'confirmed' 
                ? `We're so excited to celebrate with you, ${rsvpData.guest.name}!` 
                : `We'll miss you, ${rsvpData.guest.name}, but we understand.`
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className="bg-white/50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-800 mb-2">Wedding Details</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center justify-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>{new Date(rsvpData.wedding.date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}</span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <MapPin className="w-4 h-4" />
                  <span>{rsvpData.wedding.venue}</span>
                </div>
                <div className="text-center">
                  <span>{rsvpData.wedding.location}</span>
                </div>
              </div>
            </div>
            {rsvpStatus === 'confirmed' && (
              <p className="text-sm text-gray-600">
                We'll send you more details closer to the wedding date.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 to-pink-100 py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        <Card className="shadow-lg">
          <CardHeader className="text-center bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-t-lg">
            <div className="flex justify-center mb-4">
              <Heart className="w-12 h-12" />
            </div>
            <CardTitle className="text-3xl font-serif">
              {rsvpData.wedding.coupleName}
            </CardTitle>
            <CardDescription className="text-rose-100 text-lg">
              cordially invite you to their wedding
            </CardDescription>
          </CardHeader>
          
          <CardContent className="p-6 space-y-6">
            {/* Wedding Details */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-rose-500" />
                <span className="font-medium">
                  {new Date(rsvpData.wedding.date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-rose-500" />
                <div>
                  <div className="font-medium">{rsvpData.wedding.venue}</div>
                  <div className="text-gray-600 text-sm">{rsvpData.wedding.location}</div>
                </div>
              </div>
            </div>

            {/* Guest Name */}
            <div className="text-center">
              <h2 className="text-xl font-medium text-gray-800">
                Dear {rsvpData.guest.name}
                {rsvpData.guest.plusOne && ' & Guest'}
              </h2>
            </div>

            {/* RSVP Form */}
            <div className="space-y-4">
              <div>
                <Label className="text-base font-medium">Will you be attending?</Label>
                <RadioGroup
                  value={rsvpStatus}
                  onValueChange={(value: string) => setRsvpStatus(value as 'confirmed' | 'declined')}
                  className="mt-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="confirmed" id="confirmed" />
                    <Label htmlFor="confirmed" className="cursor-pointer">
                      Yes, I'll be there! 🎉
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="declined" id="declined" />
                    <Label htmlFor="declined" className="cursor-pointer">
                      Sorry, I can't make it 😔
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {rsvpStatus === 'confirmed' && (
                <>
                  <div>
                    <Label htmlFor="dietary">Dietary Restrictions or Allergies</Label>
                    <Textarea
                      id="dietary"
                      placeholder="Please let us know about any dietary restrictions, allergies, or food preferences..."
                      value={dietaryNotes}
                      onChange={(e) => setDietaryNotes(e.target.value)}
                      className="mt-1"
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label htmlFor="requests">Special Requests or Notes</Label>
                    <Textarea
                      id="requests"
                      placeholder="Any special requests, accessibility needs, or messages for the couple..."
                      value={specialRequests}
                      onChange={(e) => setSpecialRequests(e.target.value)}
                      className="mt-1"
                      rows={3}
                    />
                  </div>
                </>
              )}

              <Button 
                onClick={handleSubmit} 
                disabled={submitting}
                className="w-full bg-rose-500 hover:bg-rose-600 text-white py-3 text-lg"
              >
                {submitting ? 'Submitting...' : 'Submit RSVP'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}