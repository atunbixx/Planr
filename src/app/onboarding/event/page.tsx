'use client'

import { useState, useEffect } from 'react'
import StepWrapper from '@/components/onboarding/StepWrapper'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { SimpleRadioGroup } from '@/components/ui/simple-radio-group'
import { Calendar } from 'lucide-react'

export default function EventPage() {
  const [formData, setFormData] = useState({
    hasDate: 'yes',
    weddingDate: '',
    estimatedMonth: '',
    estimatedYear: new Date().getFullYear() + 1,
    venueName: '',
    venueLocation: '',
    estimatedGuestCount: '',
    weddingStyle: ''
  })
  const [errors, setErrors] = useState<any>({})
  
  // Load saved data on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await fetch('/api/onboarding/event')
        if (response.ok) {
          const data = await response.json()
          if (data.stepData) {
            setFormData(prev => ({ ...prev, ...data.stepData }))
          }
        }
      } catch (error) {
        console.error('Error loading event data:', error)
      }
    }
    loadData()
  }, [])
  
  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setErrors((prev: any) => ({ ...prev, [field]: undefined }))
  }
  
  const validateForm = () => {
    const newErrors: any = {}
    
    if (formData.hasDate === 'yes' && !formData.weddingDate) {
      newErrors.weddingDate = 'Please select your wedding date'
    }
    
    if (formData.hasDate === 'no' && !formData.estimatedMonth) {
      newErrors.estimatedMonth = 'Please select an estimated month'
    }
    
    if (!formData.venueLocation.trim()) {
      newErrors.venueLocation = 'Location is required'
    }
    
    if (!formData.estimatedGuestCount || parseInt(formData.estimatedGuestCount) < 1) {
      newErrors.estimatedGuestCount = 'Please enter estimated number of guests'
    }
    
    if (!formData.weddingStyle) {
      newErrors.weddingStyle = 'Please select a wedding style'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }
  
  const handleNext = async () => {
    if (!validateForm()) {
      return false
    }
    
    try {
      const response = await fetch('/api/onboarding/event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      
      return response.ok
    } catch (error) {
      console.error('Error saving event:', error)
      return false
    }
  }
  
  return (
    <StepWrapper
      step="event"
      title="When's the big day?"
      subtitle="Don't worry if you're not sure yet, you can always update this later"
      onNext={handleNext}
    >
      <div className="space-y-6">
        <div>
          <Label>Do you have a wedding date?</Label>
          <SimpleRadioGroup
            value={formData.hasDate}
            onChange={(value) => handleInputChange('hasDate', value)}
            options={[
              { value: 'yes', label: 'Yes, we have a date' },
              { value: 'no', label: 'Not sure yet' }
            ]}
          />
        </div>
        
        {formData.hasDate === 'yes' ? (
          <div>
            <Label htmlFor="weddingDate">Wedding date *</Label>
            <div className="relative">
              <Input
                id="weddingDate"
                type="date"
                value={formData.weddingDate}
                onChange={(e) => handleInputChange('weddingDate', e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                aria-invalid={!!errors.weddingDate}
                aria-describedby={errors.weddingDate ? 'date-error' : undefined}
              />
              <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
            </div>
            {errors.weddingDate && (
              <p id="date-error" className="text-sm text-red-600 mt-1">
                {errors.weddingDate}
              </p>
            )}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="estimatedMonth">Estimated month *</Label>
              <select
                id="estimatedMonth"
                value={formData.estimatedMonth}
                onChange={(e) => handleInputChange('estimatedMonth', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                aria-invalid={!!errors.estimatedMonth}
              >
                <option value="">Select month</option>
                <option value="01">January</option>
                <option value="02">February</option>
                <option value="03">March</option>
                <option value="04">April</option>
                <option value="05">May</option>
                <option value="06">June</option>
                <option value="07">July</option>
                <option value="08">August</option>
                <option value="09">September</option>
                <option value="10">October</option>
                <option value="11">November</option>
                <option value="12">December</option>
              </select>
              {errors.estimatedMonth && (
                <p className="text-sm text-red-600 mt-1">
                  {errors.estimatedMonth}
                </p>
              )}
            </div>
            
            <div>
              <Label htmlFor="estimatedYear">Year</Label>
              <Input
                id="estimatedYear"
                type="number"
                value={formData.estimatedYear}
                onChange={(e) => handleInputChange('estimatedYear', parseInt(e.target.value))}
                min={new Date().getFullYear()}
                max={new Date().getFullYear() + 5}
              />
            </div>
          </div>
        )}
        
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="venueName">Venue Name (optional)</Label>
            <Input
              id="venueName"
              value={formData.venueName}
              onChange={(e) => handleInputChange('venueName', e.target.value)}
              placeholder="e.g., The Grand Ballroom"
            />
          </div>
          
          <div>
            <Label htmlFor="venueLocation">Location (City, State/Country) *</Label>
            <Input
              id="venueLocation"
              value={formData.venueLocation}
              onChange={(e) => handleInputChange('venueLocation', e.target.value)}
              placeholder="e.g., New York, NY"
              aria-invalid={!!errors.venueLocation}
              aria-describedby={errors.venueLocation ? 'location-error' : undefined}
            />
            {errors.venueLocation && (
              <p id="location-error" className="text-sm text-red-600 mt-1">
                {errors.venueLocation}
              </p>
            )}
          </div>
        </div>
        
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="weddingStyle">Wedding Style *</Label>
            <select
              id="weddingStyle"
              value={formData.weddingStyle}
              onChange={(e) => handleInputChange('weddingStyle', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              aria-invalid={!!errors.weddingStyle}
            >
              <option value="">Select style</option>
              <option value="traditional">Traditional</option>
              <option value="modern">Modern</option>
              <option value="rustic">Rustic</option>
              <option value="vintage">Vintage</option>
              <option value="destination">Destination</option>
              <option value="casual">Casual</option>
              <option value="formal">Formal</option>
            </select>
            {errors.weddingStyle && (
              <p className="text-sm text-red-600 mt-1">
                {errors.weddingStyle}
              </p>
            )}
          </div>
          
          <div>
            <Label htmlFor="estimatedGuestCount">Estimated number of guests *</Label>
            <Input
              id="estimatedGuestCount"
              type="number"
              value={formData.estimatedGuestCount}
              onChange={(e) => handleInputChange('estimatedGuestCount', e.target.value)}
              placeholder="e.g., 150"
              min="1"
              aria-invalid={!!errors.estimatedGuestCount}
              aria-describedby={errors.estimatedGuestCount ? 'guests-error' : undefined}
            />
            {errors.estimatedGuestCount && (
              <p id="guests-error" className="text-sm text-red-600 mt-1">
                {errors.estimatedGuestCount}
              </p>
            )}
          </div>
        </div>
        
        <p className="text-sm text-gray-500 mt-1">
          Don't worry about being exact, this helps with planning
        </p>
      </div>
    </StepWrapper>
  )
}