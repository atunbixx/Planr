'use client'

import { useState, useEffect } from 'react'
import StepWrapper from '@/components/onboarding/StepWrapper'
import { Label } from '@/components/ui/label'
import { Camera, Music, Utensils, Flower, MapPin, Users, Palette, Car } from 'lucide-react'

const vendorCategories = [
  { id: 'venue', label: 'Venue', icon: MapPin, description: 'Reception & ceremony locations' },
  { id: 'photography', label: 'Photography', icon: Camera, description: 'Photos & videos' },
  { id: 'catering', label: 'Catering', icon: Utensils, description: 'Food & beverages' },
  { id: 'music', label: 'Music/DJ', icon: Music, description: 'Entertainment & sound' },
  { id: 'flowers', label: 'Flowers', icon: Flower, description: 'Bouquets & decorations' },
  { id: 'planner', label: 'Planner', icon: Users, description: 'Coordination & planning' },
  { id: 'decor', label: 'Decor', icon: Palette, description: 'Styling & decoration' },
  { id: 'transport', label: 'Transport', icon: Car, description: 'Guest transportation' }
]

export default function VendorsPage() {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [errors, setErrors] = useState<any>({})
  
  // Load saved data on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await fetch('/api/onboarding/vendors')
        if (response.ok) {
          const data = await response.json()
          if (data.stepData?.categories) {
            setSelectedCategories(data.stepData.categories)
          }
        }
      } catch (error) {
        console.error('Error loading vendors data:', error)
      }
    }
    loadData()
  }, [])
  
  const toggleCategory = (categoryId: string) => {
    setSelectedCategories(prev => {
      if (prev.includes(categoryId)) {
        return prev.filter(id => id !== categoryId)
      } else if (prev.length < 3) {
        return [...prev, categoryId]
      }
      return prev
    })
    
    // Clear error when user interacts
    if (errors.categories) {
      setErrors({})
    }
  }
  
  const validateForm = () => {
    const newErrors: any = {}
    
    if (selectedCategories.length === 0) {
      newErrors.categories = 'Please select at least one vendor category'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }
  
  const handleNext = async () => {
    if (!validateForm()) {
      return false
    }
    
    try {
      const response = await fetch('/api/onboarding/vendors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categories: selectedCategories })
      })
      
      return response.ok
    } catch (error) {
      console.error('Error saving vendors:', error)
      return false
    }
  }
  
  return (
    <StepWrapper
      step="vendors"
      title="What vendors are most important to you?"
      subtitle="Select up to 3 categories you'd like to focus on first"
      onNext={handleNext}
    >
      <div className="space-y-6">
        <div>
          <Label>Choose your top priorities ({selectedCategories.length}/3 selected)</Label>
          <div className="grid grid-cols-2 gap-3 mt-3">
            {vendorCategories.map((category) => {
              const Icon = category.icon
              const isSelected = selectedCategories.includes(category.id)
              const isDisabled = !isSelected && selectedCategories.length >= 3
              
              return (
                <button
                  key={category.id}
                  onClick={() => toggleCategory(category.id)}
                  disabled={isDisabled}
                  className={`p-4 rounded-lg border-2 text-left transition-all ${
                    isSelected
                      ? 'border-purple-500 bg-purple-50'
                      : isDisabled
                      ? 'border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  aria-pressed={isSelected}
                  aria-label={`${category.label}: ${category.description}`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-full ${
                      isSelected ? 'bg-purple-100' : 'bg-gray-100'
                    }`}>
                      <Icon className={`h-5 w-5 ${
                        isSelected ? 'text-purple-600' : 'text-gray-600'
                      }`} />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{category.label}</div>
                      <div className="text-sm text-gray-600">{category.description}</div>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
          {errors.categories && (
            <p className="text-sm text-red-600 mt-3">
              {errors.categories}
            </p>
          )}
        </div>
        
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <p className="text-sm text-purple-800">
            <strong>Why only 3?</strong> Starting with your top priorities helps us create a focused 
            plan. You can explore all vendor categories after setup.
          </p>
        </div>
      </div>
    </StepWrapper>
  )
}