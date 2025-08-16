'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

export default function OnboardingPage() {
  const router = useRouter()
  const { user, completeOnboarding, isLoading } = useAuth()
  const [formData, setFormData] = useState({
    venue: '',
    weddingDate: '',
    budget: '',
    guestCount: ''
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Redirect if not authenticated or already onboarded
  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push('/signin')
        return
      }
      
      if (user.onboardingCompleted) {
        router.push('/dashboard')
        return
      }
      
      if (user.role !== 'couple') {
        router.push('/dashboard')
        return
      }
    }
  }, [user, isLoading, router])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (formData.budget && isNaN(Number(formData.budget))) {
      newErrors.budget = 'Budget must be a number'
    }

    if (formData.guestCount && isNaN(Number(formData.guestCount))) {
      newErrors.guestCount = 'Guest count must be a number'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    try {
      const onboardingData = {
        venue: formData.venue || undefined,
        weddingDate: formData.weddingDate || undefined,
        budget: formData.budget ? Number(formData.budget) : undefined,
        guestCount: formData.guestCount ? Number(formData.guestCount) : undefined
      }

      const result = await completeOnboarding(onboardingData)
      
      if (result.success) {
        router.push('/dashboard')
      } else {
        setErrors({ submit: result.error?.message || 'Onboarding failed' })
      }
    } catch (error) {
      setErrors({ submit: 'An unexpected error occurred' })
    }
  }

  const handleSkip = () => {
    router.push('/dashboard')
  }

  // Show loading state while checking authentication
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
          Welcome to your wedding planner!
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Tell us about your special day
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card>
          <CardHeader>
            <CardTitle>Wedding Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <Input
                label="Wedding venue (optional)"
                type="text"
                name="venue"
                value={formData.venue}
                onChange={handleChange}
                placeholder="e.g., Central Park, NYC"
                helpText="Where are you planning to get married?"
              />

              <Input
                label="Wedding date (optional)"
                type="date"
                name="weddingDate"
                value={formData.weddingDate}
                onChange={handleChange}
                helpText="When is your big day?"
              />

              <Input
                label="Budget (optional)"
                type="number"
                name="budget"
                value={formData.budget}
                onChange={handleChange}
                error={errors.budget}
                placeholder="25000"
                helpText="Your estimated wedding budget in USD"
              />

              <Input
                label="Guest count (optional)"
                type="number"
                name="guestCount"
                value={formData.guestCount}
                onChange={handleChange}
                error={errors.guestCount}
                placeholder="100"
                helpText="Approximately how many guests will you invite?"
              />

              {errors.submit && (
                <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-3">
                  {errors.submit}
                </div>
              )}

              <div className="space-y-3">
                <Button
                  type="submit"
                  className="w-full"
                  isLoading={isLoading}
                  disabled={isLoading}
                >
                  {isLoading ? 'Saving...' : 'Complete setup'}
                </Button>
                
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={handleSkip}
                  disabled={isLoading}
                >
                  Skip for now
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}