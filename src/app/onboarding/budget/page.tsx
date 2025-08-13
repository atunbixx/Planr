'use client'

import { useState, useEffect } from 'react'
import StepWrapper from '@/components/onboarding/StepWrapper'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { SimpleRadioGroup } from '@/components/ui/simple-radio-group'
import { DollarSign } from 'lucide-react'

const budgetTiers = [
  { value: 'basic', label: 'Basic', range: 'Under $10,000' },
  { value: 'standard', label: 'Standard', range: '$10,000 - $25,000' },
  { value: 'premium', label: 'Premium', range: '$25,000 - $50,000' },
  { value: 'luxury', label: 'Luxury', range: 'Over $50,000' }
]

const nigeriaBudgetTiers = [
  { value: 'basic', label: 'Basic', range: 'Under ₦5M' },
  { value: 'standard', label: 'Standard', range: '₦5M - ₦15M' },
  { value: 'premium', label: 'Premium', range: '₦15M - ₦30M' },
  { value: 'luxury', label: 'Luxury', range: 'Over ₦30M' }
]

export default function BudgetPage() {
  const [formData, setFormData] = useState({
    budgetType: 'exact',
    exactBudget: '',
    budgetTier: '',
    currency: 'USD',
    country: ''
  })
  const [errors, setErrors] = useState<any>({})
  
  // Load saved data on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await fetch('/api/onboarding/budget')
        if (response.ok) {
          const data = await response.json()
          if (data.stepData) {
            setFormData(prev => ({ ...prev, ...data.stepData }))
          }
        }
        
        // Also load profile data to get country/currency
        const profileResponse = await fetch('/api/onboarding/profile')
        if (profileResponse.ok) {
          const profileData = await profileResponse.json()
          if (profileData.stepData) {
            setFormData(prev => ({
              ...prev,
              currency: profileData.stepData.currency || 'USD',
              country: profileData.stepData.country || ''
            }))
          }
        }
      } catch (error) {
        console.error('Error loading budget data:', error)
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
    
    if (formData.budgetType === 'exact') {
      if (!formData.exactBudget || parseFloat(formData.exactBudget) <= 0) {
        newErrors.exactBudget = 'Please enter your budget amount'
      }
    } else {
      if (!formData.budgetTier) {
        newErrors.budgetTier = 'Please select a budget tier'
      }
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }
  
  const handleNext = async () => {
    if (!validateForm()) {
      return false
    }
    
    try {
      const response = await fetch('/api/onboarding/budget', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      
      return response.ok
    } catch (error) {
      console.error('Error saving budget:', error)
      return false
    }
  }
  
  const formatCurrency = (value: string) => {
    // Remove non-numeric characters
    const numericValue = value.replace(/[^0-9.]/g, '')
    return numericValue
  }
  
  // Use Nigeria tiers if country is Nigeria or currency is NGN
  const tiers = (formData.country === 'NG' || formData.currency === 'NGN') 
    ? nigeriaBudgetTiers 
    : budgetTiers
  
  const currencySymbol = formData.currency === 'NGN' ? '₦' : '$'
  
  return (
    <StepWrapper
      step="budget"
      title="What's your budget?"
      subtitle="This helps us recommend vendors and services in your price range"
      onNext={handleNext}
    >
      <div className="space-y-6">
        <div>
          <Label>How would you like to set your budget?</Label>
          <SimpleRadioGroup
            value={formData.budgetType}
            onChange={(value) => handleInputChange('budgetType', value)}
            options={[
              { value: 'exact', label: 'I have a specific budget' },
              { value: 'tier', label: 'I prefer to select a range' }
            ]}
          />
        </div>
        
        {formData.budgetType === 'exact' ? (
          <div>
            <Label htmlFor="exactBudget">Total wedding budget *</Label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                {currencySymbol}
              </div>
              <Input
                id="exactBudget"
                type="text"
                value={formData.exactBudget}
                onChange={(e) => handleInputChange('exactBudget', formatCurrency(e.target.value))}
                placeholder="50000"
                className="pl-8"
                aria-invalid={!!errors.exactBudget}
                aria-describedby={errors.exactBudget ? 'budget-error' : undefined}
              />
            </div>
            {errors.exactBudget && (
              <p id="budget-error" className="text-sm text-red-600 mt-1">
                {errors.exactBudget}
              </p>
            )}
            <p className="text-sm text-gray-500 mt-1">
              We'll help you allocate this across different categories
            </p>
          </div>
        ) : (
          <div>
            <Label>Select your budget range *</Label>
            <div className="space-y-3">
              {tiers.map((tier) => (
                <label
                  key={tier.value}
                  className={`flex items-center justify-between p-4 border rounded-lg cursor-pointer transition-colors ${
                    formData.budgetTier === tier.value
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="budgetTier"
                      value={tier.value}
                      checked={formData.budgetTier === tier.value}
                      onChange={(e) => handleInputChange('budgetTier', e.target.value)}
                      className="text-purple-600 focus:ring-purple-500"
                    />
                    <div>
                      <div className="font-medium text-gray-900">{tier.label}</div>
                      <div className="text-sm text-gray-600">{tier.range}</div>
                    </div>
                  </div>
                  <DollarSign className="h-5 w-5 text-gray-400" />
                </label>
              ))}
            </div>
            {errors.budgetTier && (
              <p className="text-sm text-red-600 mt-1">
                {errors.budgetTier}
              </p>
            )}
          </div>
        )}
        
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm text-gray-600">
            <strong>Tip:</strong> The average wedding in {formData.country === 'NG' ? 'Lagos' : 'the US'} costs{' '}
            {formData.country === 'NG' ? '₦10-15 million' : '$25,000-$30,000'}. 
            Your budget will be kept private and only used to show you relevant options.
          </p>
        </div>
      </div>
    </StepWrapper>
  )
}