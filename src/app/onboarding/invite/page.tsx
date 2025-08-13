'use client'

import { useState, useEffect } from 'react'
import StepWrapper from '@/components/onboarding/StepWrapper'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { MessageCircle } from 'lucide-react'

export default function InvitePage() {
  const [formData, setFormData] = useState({
    partnerEmail: '',
    teamEmail: '',
    whatsappLink: ''
  })
  const [errors, setErrors] = useState<any>({})
  
  // Load saved data on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await fetch('/api/onboarding/invite')
        if (response.ok) {
          const data = await response.json()
          if (data.stepData) {
            setFormData(prev => ({ ...prev, ...data.stepData }))
          }
        }
      } catch (error) {
        console.error('Error loading invite data:', error)
      }
    }
    loadData()
  }, [])
  
  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setErrors((prev: any) => ({ ...prev, [field]: undefined }))
  }
  
  const validateForm = () => {
    const newErrors: any = {}
    
    // Validate email formats if provided
    if (formData.partnerEmail && !isValidEmail(formData.partnerEmail)) {
      newErrors.partnerEmail = 'Please enter a valid email address'
    }
    
    if (formData.teamEmail && !isValidEmail(formData.teamEmail)) {
      newErrors.teamEmail = 'Please enter a valid email address'
    }
    
    // Validate WhatsApp link if provided
    if (formData.whatsappLink && !isValidWhatsAppLink(formData.whatsappLink)) {
      newErrors.whatsappLink = 'Please enter a valid WhatsApp group link'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }
  
  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }
  
  const isValidWhatsAppLink = (link: string) => {
    return link.includes('chat.whatsapp.com') || link.includes('wa.me')
  }
  
  const handleNext = async () => {
    if (!validateForm()) {
      return false
    }
    
    try {
      const response = await fetch('/api/onboarding/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      
      return response.ok
    } catch (error) {
      console.error('Error saving invite:', error)
      return false
    }
  }
  
  const handleSkip = async () => {
    try {
      await fetch('/api/onboarding/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skipped: true })
      })
    } catch (error) {
      console.error('Error skipping invite:', error)
    }
  }
  
  return (
    <StepWrapper
      step="invite"
      title="Invite your team"
      subtitle="Add people who'll help plan your wedding (you can do this later)"
      onNext={handleNext}
      onSkip={handleSkip}
      showSkip={true}
    >
      <div className="space-y-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            This step is optional. You can always invite team members later from your dashboard.
          </p>
        </div>
        
        <div>
          <Label htmlFor="partnerEmail">Partner's email</Label>
          <Input
            id="partnerEmail"
            type="email"
            value={formData.partnerEmail}
            onChange={(e) => handleInputChange('partnerEmail', e.target.value)}
            placeholder="partner@example.com"
            aria-invalid={!!errors.partnerEmail}
            aria-describedby={errors.partnerEmail ? 'partner-error' : undefined}
          />
          {errors.partnerEmail && (
            <p id="partner-error" className="text-sm text-red-600 mt-1">
              {errors.partnerEmail}
            </p>
          )}
          <p className="text-sm text-gray-500 mt-1">
            They'll get full access to plan alongside you
          </p>
        </div>
        
        <div>
          <Label htmlFor="teamEmail">Wedding planner or family member email</Label>
          <Input
            id="teamEmail"
            type="email"
            value={formData.teamEmail}
            onChange={(e) => handleInputChange('teamEmail', e.target.value)}
            placeholder="planner@example.com"
            aria-invalid={!!errors.teamEmail}
            aria-describedby={errors.teamEmail ? 'team-error' : undefined}
          />
          {errors.teamEmail && (
            <p id="team-error" className="text-sm text-red-600 mt-1">
              {errors.teamEmail}
            </p>
          )}
        </div>
        
        <div>
          <Label htmlFor="whatsappLink">WhatsApp group link (optional)</Label>
          <div className="relative">
            <Input
              id="whatsappLink"
              value={formData.whatsappLink}
              onChange={(e) => handleInputChange('whatsappLink', e.target.value)}
              placeholder="https://chat.whatsapp.com/..."
              className="pl-10"
              aria-invalid={!!errors.whatsappLink}
              aria-describedby={errors.whatsappLink ? 'whatsapp-error' : undefined}
            />
            <MessageCircle className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          </div>
          {errors.whatsappLink && (
            <p id="whatsapp-error" className="text-sm text-red-600 mt-1">
              {errors.whatsappLink}
            </p>
          )}
          <p className="text-sm text-gray-500 mt-1">
            Connect your wedding planning WhatsApp group
          </p>
        </div>
      </div>
    </StepWrapper>
  )
}