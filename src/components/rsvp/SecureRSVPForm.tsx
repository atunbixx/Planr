'use client'

import { useState, useEffect, useRef } from 'react'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, Check, Shield } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface Guest {
  id: string
  firstName: string
  lastName: string
  email?: string
  phone?: string
  plusOneAllowed: boolean
  mealChoice?: string
  dietaryRestrictions?: string
  rsvpStatus?: string
  plusOneName?: string
  plusOneMealChoice?: string
  plusOneDietaryRestrictions?: string
}

interface MealOption {
  id: string
  name: string
  description: string
  category: string
}

interface SecureRSVPFormProps {
  guest: Guest
  mealOptions: MealOption[]
  onSubmit: (data: any) => Promise<void>
  initialData?: any
  requiresCaptcha?: boolean
}

// Form validation schema
const formSchema = z.object({
  attending: z.boolean(),
  email: z.string().email('Please enter a valid email').optional().or(z.literal('')),
  phone: z.string().optional(),
  mealChoice: z.string().optional(),
  dietaryRestrictions: z.string().max(500).optional(),
  plusOneAttending: z.boolean().optional(),
  plusOneName: z.string().max(100).optional(),
  plusOneMealChoice: z.string().optional(),
  plusOneDietaryRestrictions: z.string().max(500).optional(),
  notes: z.string().max(1000).optional(),
})

export default function SecureRSVPForm({
  guest,
  mealOptions,
  onSubmit,
  initialData,
  requiresCaptcha = false,
}: SecureRSVPFormProps) {
  const [formData, setFormData] = useState({
    attending: initialData?.attending ?? true,
    email: initialData?.email || guest.email || '',
    phone: initialData?.phone || guest.phone || '',
    mealChoice: initialData?.mealChoice || '',
    dietaryRestrictions: initialData?.dietaryRestrictions || '',
    plusOneAttending: initialData?.plusOneAttending ?? false,
    plusOneName: initialData?.plusOneName || '',
    plusOneMealChoice: initialData?.plusOneMealChoice || '',
    plusOneDietaryRestrictions: initialData?.plusOneDietaryRestrictions || '',
    notes: initialData?.notes || '',
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [showSecurityBadge, setShowSecurityBadge] = useState(false)
  
  // Honeypot fields (hidden from users)
  const [honeypot, setHoneypot] = useState({
    website: '',
    url: '',
    company: '',
    address2: '',
  })

  // Track form load time for bot detection
  const formLoadTime = useRef(Date.now())

  useEffect(() => {
    // Show security badge after a delay
    const timer = setTimeout(() => {
      setShowSecurityBadge(true)
    }, 2000)
    return () => clearTimeout(timer)
  }, [])

  const validateForm = (): boolean => {
    try {
      formSchema.parse(formData)
      setErrors({})
      return true
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {}
        error.errors.forEach((err) => {
          if (err.path[0]) {
            newErrors[err.path[0].toString()] = err.message
          }
        })
        setErrors(newErrors)
      }
      return false
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)
    setSubmitError(null)

    try {
      // Include security data in submission
      const securityData = {
        ...formData,
        guestId: guest.id,
        // Honeypot fields
        website: honeypot.website,
        url: honeypot.url,
        company: honeypot.company,
        address2: honeypot.address2,
        // Timing data
        submissionTime: formLoadTime.current,
      }

      await onSubmit(securityData)
    } catch (error: any) {
      setSubmitError(error.message || 'Failed to submit RSVP. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const groupedMealOptions = mealOptions.reduce((acc, option) => {
    if (!acc[option.category]) {
      acc[option.category] = []
    }
    acc[option.category].push(option)
    return acc
  }, {} as Record<string, MealOption[]>)

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Hidden honeypot fields */}
      <div style={{ position: 'absolute', left: '-9999px' }}>
        <input
          type="text"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          value={honeypot.website}
          onChange={(e) => setHoneypot(prev => ({ ...prev, website: e.target.value }))}
        />
        <input
          type="text"
          name="url"
          tabIndex={-1}
          autoComplete="off"
          value={honeypot.url}
          onChange={(e) => setHoneypot(prev => ({ ...prev, url: e.target.value }))}
        />
        <input
          type="text"
          name="company"
          tabIndex={-1}
          autoComplete="off"
          value={honeypot.company}
          onChange={(e) => setHoneypot(prev => ({ ...prev, company: e.target.value }))}
        />
        <input
          type="text"
          name="address2"
          tabIndex={-1}
          autoComplete="off"
          value={honeypot.address2}
          onChange={(e) => setHoneypot(prev => ({ ...prev, address2: e.target.value }))}
        />
      </div>

      {/* Security Badge */}
      {showSecurityBadge && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Shield className="h-4 w-4" />
          <span>Your information is secure and protected</span>
        </div>
      )}

      {/* Guest Information */}
      <Card>
        <CardHeader>
          <CardTitle>Guest Information</CardTitle>
          <CardDescription>
            Welcome, {guest.firstName} {guest.lastName}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className={errors.email ? 'border-red-500' : ''}
              />
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+1 (555) 123-4567"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Attendance */}
      <Card>
        <CardHeader>
          <CardTitle>Will you be attending?</CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={formData.attending ? 'yes' : 'no'}
            onValueChange={(value) => handleInputChange('attending', value === 'yes')}
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="yes" id="attending-yes" />
              <Label htmlFor="attending-yes">Yes, I'll be there!</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="no" id="attending-no" />
              <Label htmlFor="attending-no">Sorry, I can't make it</Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Meal Selection (only if attending) */}
      {formData.attending && mealOptions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Meal Selection</CardTitle>
            <CardDescription>Please select your meal preference</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="meal">Main Course</Label>
              <Select
                value={formData.mealChoice}
                onValueChange={(value) => handleInputChange('mealChoice', value)}
              >
                <SelectTrigger id="meal">
                  <SelectValue placeholder="Select a meal option" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(groupedMealOptions).map(([category, options]) => (
                    <div key={category}>
                      <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground">
                        {category}
                      </div>
                      {options.map((option) => (
                        <SelectItem key={option.id} value={option.id}>
                          <div>
                            <div className="font-medium">{option.name}</div>
                            {option.description && (
                              <div className="text-sm text-muted-foreground">
                                {option.description}
                              </div>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </div>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dietary">Dietary Restrictions or Allergies</Label>
              <Textarea
                id="dietary"
                placeholder="Please let us know about any dietary restrictions or allergies..."
                value={formData.dietaryRestrictions}
                onChange={(e) => handleInputChange('dietaryRestrictions', e.target.value)}
                rows={3}
                maxLength={500}
              />
              <p className="text-sm text-muted-foreground">
                {formData.dietaryRestrictions.length}/500 characters
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Plus One (if allowed and attending) */}
      {guest.plusOneAllowed && formData.attending && (
        <Card>
          <CardHeader>
            <CardTitle>Plus One</CardTitle>
            <CardDescription>Will you be bringing a guest?</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <RadioGroup
              value={formData.plusOneAttending ? 'yes' : 'no'}
              onValueChange={(value) => handleInputChange('plusOneAttending', value === 'yes')}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="yes" id="plus-one-yes" />
                <Label htmlFor="plus-one-yes">Yes, I'll bring a guest</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="no" id="plus-one-no" />
                <Label htmlFor="plus-one-no">No, just me</Label>
              </div>
            </RadioGroup>

            {formData.plusOneAttending && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="plus-one-name">Guest Name</Label>
                  <Input
                    id="plus-one-name"
                    placeholder="Guest's full name"
                    value={formData.plusOneName}
                    onChange={(e) => handleInputChange('plusOneName', e.target.value)}
                    maxLength={100}
                  />
                </div>

                {mealOptions.length > 0 && (
                  <div className="space-y-2">
                    <Label htmlFor="plus-one-meal">Guest's Meal Choice</Label>
                    <Select
                      value={formData.plusOneMealChoice}
                      onValueChange={(value) => handleInputChange('plusOneMealChoice', value)}
                    >
                      <SelectTrigger id="plus-one-meal">
                        <SelectValue placeholder="Select a meal option" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(groupedMealOptions).map(([category, options]) => (
                          <div key={category}>
                            <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground">
                              {category}
                            </div>
                            {options.map((option) => (
                              <SelectItem key={option.id} value={option.id}>
                                <div>
                                  <div className="font-medium">{option.name}</div>
                                  {option.description && (
                                    <div className="text-sm text-muted-foreground">
                                      {option.description}
                                    </div>
                                  )}
                                </div>
                              </SelectItem>
                            ))}
                          </div>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="plus-one-dietary">
                    Guest's Dietary Restrictions or Allergies
                  </Label>
                  <Textarea
                    id="plus-one-dietary"
                    placeholder="Guest's dietary restrictions or allergies..."
                    value={formData.plusOneDietaryRestrictions}
                    onChange={(e) => handleInputChange('plusOneDietaryRestrictions', e.target.value)}
                    rows={3}
                    maxLength={500}
                  />
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Additional Notes */}
      <Card>
        <CardHeader>
          <CardTitle>Additional Information</CardTitle>
          <CardDescription>
            Anything else you'd like us to know?
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Special requests, questions, or well wishes..."
            value={formData.notes}
            onChange={(e) => handleInputChange('notes', e.target.value)}
            rows={4}
            maxLength={1000}
          />
          <p className="mt-2 text-sm text-muted-foreground">
            {formData.notes.length}/1000 characters
          </p>
        </CardContent>
      </Card>

      {/* Error Alert */}
      {submitError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{submitError}</AlertDescription>
        </Alert>
      )}

      {/* CAPTCHA Notice */}
      {requiresCaptcha && (
        <Alert>
          <Shield className="h-4 w-4" />
          <AlertDescription>
            For security purposes, please complete the verification below.
          </AlertDescription>
        </Alert>
      )}

      {/* Submit Button */}
      <Button
        type="submit"
        size="lg"
        className="w-full"
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <>
            <span className="animate-spin mr-2">⏳</span>
            Submitting...
          </>
        ) : (
          <>
            <Check className="mr-2 h-4 w-4" />
            {guest.rsvpStatus === 'confirmed' ? 'Update RSVP' : 'Submit RSVP'}
          </>
        )}
      </Button>
    </form>
  )
}