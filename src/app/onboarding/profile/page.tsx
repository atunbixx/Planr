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
    userName: '',
    partnerName: '',
    role: '',
    country: '',
    currency: 'USD'
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
    
    if (!formData.userName.trim()) {
      newErrors.userName = 'Your name is required'
    }
    
    if (!formData.role) {
      newErrors.role = 'Please select your role'
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
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="userName">Your name *</Label>
            <Input
              id="userName"
              value={formData.userName}
              onChange={(e) => handleInputChange('userName', e.target.value)}
              placeholder="Enter your name"
              aria-invalid={!!errors.userName}
              aria-describedby={errors.userName ? 'userName-error' : undefined}
            />
            {errors.userName && (
              <p id="userName-error" className="text-sm text-red-600 mt-1">
                {errors.userName}
              </p>
            )}
          </div>
          
          <div>
            <Label htmlFor="partnerName">Partner's name (optional)</Label>
            <Input
              id="partnerName"
              value={formData.partnerName}
              onChange={(e) => handleInputChange('partnerName', e.target.value)}
              placeholder="Enter partner's name"
            />
          </div>
        </div>
        
        <div>
          <Label htmlFor="role">Your role *</Label>
          <SimpleSelect
            id="role"
            value={formData.role}
            onChange={(value) => handleInputChange('role', value)}
            options={roles}
            placeholder="Select your role"
            aria-invalid={!!errors.role}
            aria-describedby={errors.role ? 'role-error' : undefined}
          />
          {errors.role && (
            <p id="role-error" className="text-sm text-red-600 mt-1">
              {errors.role}
            </p>
          )}
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