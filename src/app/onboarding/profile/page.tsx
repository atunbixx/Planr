'use client'

import { useState, useEffect } from 'react'
import StepWrapper from '@/components/onboarding/StepWrapper'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { SimpleSelect } from '@/components/ui/simple-select'

const roles = [
  { value: 'bride', label: 'Bride' },
  { value: 'groom', label: 'Groom' },
  { value: 'planner', label: 'Wedding Planner' },
  { value: 'family', label: 'Family Member' },
  { value: 'other', label: 'Other' }
]

const countries = [
  { value: 'US', label: 'United States' },
  { value: 'CA', label: 'Canada' },
  { value: 'GB', label: 'United Kingdom' },
  { value: 'NG', label: 'Nigeria' },
  { value: 'IN', label: 'India' },
  { value: 'AU', label: 'Australia' },
  { value: 'other', label: 'Other' }
]

const currencies = [
  { value: 'USD', label: 'USD ($)' },
  { value: 'EUR', label: 'EUR (€)' },
  { value: 'GBP', label: 'GBP (£)' },
  { value: 'NGN', label: 'NGN (₦)' },
  { value: 'INR', label: 'INR (₹)' },
  { value: 'CAD', label: 'CAD ($)' },
  { value: 'AUD', label: 'AUD ($)' }
]

export default function ProfilePage() {
  const [formData, setFormData] = useState({
    partner1Name: '',
    partner2Name: '',
    firstName: '',
    lastName: '',
    role: '',
    country: '',
    currency: 'USD',
    timezone: 'America/New_York',
    language: 'en'
  })
  const [errors, setErrors] = useState<any>({})
  const [autosave, setAutosave] = useState<((data: any) => void) | null>(null)
  
  // Load saved data on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await fetch('/api/onboarding/profile')
        if (response.ok) {
          const data = await response.json()
          if (data.stepData) {
            setFormData(prev => ({ ...prev, ...data.stepData }))
          }
        }
      } catch (error) {
        console.error('Error loading profile data:', error)
      }
    }
    loadData()
  }, [])
  
  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value }
      // Trigger autosave
      if (autosave) {
        autosave(newData)
      }
      return newData
    })
    // Clear error for this field
    setErrors((prev: any) => ({ ...prev, [field]: undefined }))
  }
  
  const validateForm = () => {
    const newErrors: any = {}
    
    if (!formData.partner1Name.trim()) {
      newErrors.partner1Name = 'Partner 1 name is required'
    }
    
    if (!formData.partner2Name.trim()) {
      newErrors.partner2Name = 'Partner 2 name is required'
    }
    
    if (!formData.country) {
      newErrors.country = 'Please select your country'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }
  
  const handleNext = async () => {
    if (!validateForm()) {
      return false
    }
    
    try {
      // Save profile data
      const response = await fetch('/api/onboarding/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      
      return response.ok
    } catch (error) {
      console.error('Error saving profile:', error)
      return false
    }
  }
  
  return (
    <StepWrapper
      step="profile"
      title="Tell us about yourself"
      subtitle="This helps us personalize your wedding planning experience"
      onNext={handleNext}
      onAutosave={setAutosave}
    >
      <div className="space-y-6">
        <div>
          <h3 className="font-semibold text-gray-900 mb-4">Partner Information</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="partner1Name">Partner 1 Name *</Label>
              <Input
                id="partner1Name"
                value={formData.partner1Name}
                onChange={(e) => handleInputChange('partner1Name', e.target.value)}
                placeholder="First partner's full name"
                aria-invalid={!!errors.partner1Name}
                aria-describedby={errors.partner1Name ? 'partner1Name-error' : undefined}
              />
              {errors.partner1Name && (
                <p id="partner1Name-error" className="text-sm text-red-600 mt-1">
                  {errors.partner1Name}
                </p>
              )}
            </div>
            
            <div>
              <Label htmlFor="partner2Name">Partner 2 Name *</Label>
              <Input
                id="partner2Name"
                value={formData.partner2Name}
                onChange={(e) => handleInputChange('partner2Name', e.target.value)}
                placeholder="Second partner's full name"
                aria-invalid={!!errors.partner2Name}
                aria-describedby={errors.partner2Name ? 'partner2Name-error' : undefined}
              />
              {errors.partner2Name && (
                <p id="partner2Name-error" className="text-sm text-red-600 mt-1">
                  {errors.partner2Name}
                </p>
              )}
            </div>
          </div>
        </div>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="country">Country *</Label>
            <SimpleSelect
              id="country"
              value={formData.country}
              onChange={(value) => handleInputChange('country', value)}
              options={countries}
              placeholder="Select your country"
              aria-invalid={!!errors.country}
              aria-describedby={errors.country ? 'country-error' : undefined}
            />
            {errors.country && (
              <p id="country-error" className="text-sm text-red-600 mt-1">
                {errors.country}
              </p>
            )}
          </div>
          
          <div>
            <Label htmlFor="currency">Preferred currency</Label>
            <SimpleSelect
              id="currency"
              value={formData.currency}
              onChange={(value) => handleInputChange('currency', value)}
              options={currencies}
              placeholder="Select currency"
            />
          </div>
        </div>
      </div>
    </StepWrapper>
  )
}