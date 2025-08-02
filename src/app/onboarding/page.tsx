'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { AuthGuard } from '@/components/AuthGuard'
import { DatePicker, DatePickerWithFallback } from '@/components/LazyComponents'

interface OnboardingData {
  partner1Name: string
  partner2Name: string
  weddingDate: string
  venueName: string
  venueLocation: string
  guestCountEstimate: number
  budgetTotal: number
  weddingStyle: string
  currentStep: number
  completedSteps: number[]
  isComplete: boolean
}

const STORAGE_KEY = 'wedding-onboarding-data'

function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(1)
  const [completedSteps, setCompletedSteps] = useState<number[]>([])
  const [formData, setFormData] = useState<OnboardingData>({
    partner1Name: '',
    partner2Name: '',
    weddingDate: '',
    venueName: '',
    venueLocation: '',
    guestCountEstimate: 100,
    budgetTotal: 50000,
    weddingStyle: 'traditional',
    currentStep: 1,
    completedSteps: [],
    isComplete: false
  })
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saveMessage, setSaveMessage] = useState<string>('')

  const { user, createCouple, loading } = useAuth()
  const router = useRouter()
  const [detectedRegion, setDetectedRegion] = useState<{ country: string, timezone: string, locale: string } | null>(null)

  const totalSteps = 4

  // Simple redirect for unauthenticated users
  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/signin?redirectTo=/onboarding')
    }
  }, [user, loading, router])

  // Detect user's region on mount
  useEffect(() => {
    const detectUserRegion = () => {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
      const locale = navigator.language || 'en-US'
      
      // Map common timezones to country codes
      const timezoneToCountry: Record<string, string> = {
        'America/New_York': 'US',
        'America/Chicago': 'US',
        'America/Los_Angeles': 'US',
        'Europe/London': 'GB',
        'Europe/Paris': 'FR',
        'Europe/Berlin': 'DE',
        'Europe/Madrid': 'ES',
        'Europe/Rome': 'IT',
        'Asia/Tokyo': 'JP',
        'Asia/Shanghai': 'CN',
        'Asia/Kolkata': 'IN',
        'America/Toronto': 'CA',
        'America/Mexico_City': 'MX',
        'America/Sao_Paulo': 'BR',
        'Australia/Sydney': 'AU',
        'Africa/Johannesburg': 'ZA',
        'Africa/Lagos': 'NG',
        'Africa/Nairobi': 'KE',
        'Asia/Dubai': 'AE',
        'Asia/Singapore': 'SG',
        'Pacific/Auckland': 'NZ',
        'Europe/Dublin': 'IE'
      }

      // Extract country code from locale (e.g., en-US -> US)
      const localeCountry = locale.split('-')[1]?.toUpperCase()
      
      // Try timezone mapping first, then locale, then default to US
      const detectedCountry = timezoneToCountry[timezone] || localeCountry || 'US'
      
      const regionInfo = { 
        country: detectedCountry, 
        timezone, 
        locale 
      }
      
      setDetectedRegion(regionInfo)
      console.log('Detected region:', regionInfo)
    }

    detectUserRegion()
  }, [])

  // Load saved data on component mount
  useEffect(() => {
    const savedData = localStorage.getItem(STORAGE_KEY)
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData) as OnboardingData
        setFormData(parsed)
        setCurrentStep(parsed.currentStep || 1)
        setCompletedSteps(parsed.completedSteps || [])
      } catch (error) {
        console.error('Failed to load saved onboarding data:', error)
      }
    }

    // Pre-populate with user data if available
    if (user?.user_metadata?.full_name && !formData.partner1Name) {
      setFormData(prev => ({ 
        ...prev, 
        partner1Name: user.user_metadata.full_name,
        partner2Name: user.user_metadata.partner_name || ''
      }))
    }
  }, [user])

  // Auto-save functionality
  const autoSave = async (data: OnboardingData) => {
    setIsSaving(true)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
      setSaveMessage('Progress saved automatically')
      setTimeout(() => setSaveMessage(''), 2000)
    } catch (error) {
      console.error('Failed to auto-save:', error)
    } finally {
      setIsSaving(false)
    }
  }

  // Auto-save when data changes
  useEffect(() => {
    if (formData.partner1Name || formData.partner2Name || formData.weddingDate) {
      const updatedData = { ...formData, currentStep, completedSteps }
      autoSave(updatedData)
    }
  }, [formData, currentStep, completedSteps])

  // Validate current step
  const validateCurrentStep = () => {
    const newErrors: Record<string, string> = {}

    switch (currentStep) {
      case 1: // About You
        if (!formData.partner1Name.trim()) {
          newErrors.partner1Name = 'Your name is required'
        }
        break
      case 2: // Wedding Details
        // Wedding details are optional but validate if provided
        break
      case 3: // Venue Information
        // Venue information is optional
        break
      case 4: // Planning Details
        if (formData.guestCountEstimate < 1 || formData.guestCountEstimate > 1000) {
          newErrors.guestCountEstimate = 'Guest count must be between 1 and 1000'
        }
        if (formData.budgetTotal < 0) {
          newErrors.budgetTotal = 'Budget cannot be negative'
        }
        break
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const value = e.target.type === 'number' ? Number(e.target.value) : e.target.value
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  // Navigate to next step
  const handleNext = () => {
    if (validateCurrentStep()) {
      const newCompletedSteps = [...completedSteps]
      if (!newCompletedSteps.includes(currentStep)) {
        newCompletedSteps.push(currentStep)
        setCompletedSteps(newCompletedSteps)
      }
      
      if (currentStep < totalSteps) {
        setCurrentStep(currentStep + 1)
      }
    }
  }

  // Navigate to previous step
  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  // Skip current step
  const handleSkip = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1)
    }
  }

  // Final submission after all steps completed
  const handleFinalSubmit = async () => {
    console.log('🚀 handleFinalSubmit called!')
    console.log('Current step:', currentStep, 'Total steps:', totalSteps)
    console.log('Form data:', formData)
    console.log('User:', user?.id)
    
    if (!validateCurrentStep()) {
      console.log('❌ Validation failed, not submitting')
      return
    }

    console.log('✅ Validation passed, starting final submission...')
    setIsLoading(true)
    setErrors({})

    try {
      console.log('Calling createCouple with data:', {
        partner1Name: formData.partner1Name,
        partner2Name: formData.partner2Name || undefined,
        weddingDate: formData.weddingDate || undefined,
        venueName: formData.venueName || undefined,
        venueLocation: formData.venueLocation || undefined,
        guestCountEstimate: formData.guestCountEstimate,
        budgetTotal: formData.budgetTotal,
        weddingStyle: formData.weddingStyle
      })

      const result = await createCouple({
        partner1Name: formData.partner1Name,
        partner2Name: formData.partner2Name || undefined,
        weddingDate: formData.weddingDate || undefined,
        venueName: formData.venueName || undefined,
        venueLocation: formData.venueLocation || undefined,
        guestCountEstimate: formData.guestCountEstimate,
        budgetTotal: formData.budgetTotal,
        weddingStyle: formData.weddingStyle
      })
      
      console.log('createCouple completed successfully:', result)
      
      // Initialize user settings with detected region
      if (user && detectedRegion) {
        try {
          console.log('Initializing user settings with region:', detectedRegion.country)
          
          // Call the initialization function
          const { error: initError } = await supabase
            .rpc('initialize_user_settings', {
              p_user_id: user.id,
              p_country_code: detectedRegion.country
            })
          
          if (initError) {
            console.error('Failed to initialize user settings:', initError)
          } else {
            console.log('User settings initialized successfully')
            
            // Update the timezone specifically with the detected timezone
            const { error: updateError } = await supabase
              .from('user_settings')
              .update({ 
                timezone: detectedRegion.timezone,
                wedding_style: formData.weddingStyle || 'traditional',
                guest_count_estimate: formData.guestCountEstimate,
                onboarding_completed: true,
                onboarding_step: totalSteps
              })
              .eq('user_id', user.id)
            
            if (updateError) {
              console.error('Failed to update user settings:', updateError)
            }
          }
        } catch (err) {
          console.error('Error initializing settings:', err)
          // Don't throw - this is not critical for onboarding
        }
      }
      
      // Clear saved data after successful submission
      localStorage.removeItem(STORAGE_KEY)
      console.log('Cleared localStorage, redirecting to dashboard...')
      
      // Small delay to ensure state updates are processed
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Use window.location instead of router.push for more reliable redirect
      window.location.href = '/dashboard'
    } catch (error: any) {
      console.error('Failed to create couple profile:', error)
      setErrors({ general: error.message || 'Failed to create your wedding profile' })
    } finally {
      setIsLoading(false)
    }
  }

  // Get step configuration
  const getStepConfig = (step: number) => {
    const configs = {
      1: {
        title: 'About You',
        subtitle: 'Let\'s start with the basics about you and your partner',
        icon: 'fas fa-users',
        description: 'Tell us who you are so we can personalize your experience'
      },
      2: {
        title: 'Wedding Details',
        subtitle: 'Share your wedding vision and style preferences',
        icon: 'fas fa-ring',
        description: 'Help us understand your dream wedding aesthetic'
      },
      3: {
        title: 'Venue Information',
        subtitle: 'Tell us about your wedding venue and location',
        icon: 'fas fa-map-marker-alt',
        description: 'Venue details help us provide location-specific recommendations'
      },
      4: {
        title: 'Planning Details',
        subtitle: 'Help us understand the scope of your celebration',
        icon: 'fas fa-clipboard-list',
        description: 'Guest count and budget help us tailor our planning tools'
      }
    }
    return configs[step as keyof typeof configs]
  }

  const currentStepConfig = getStepConfig(currentStep)

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <i className="fas fa-spinner fa-spin text-4xl text-gray-600 mb-4"></i>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // Don't render if not authenticated (will redirect)
  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Header Section */}
        <div className="text-center mb-12">
          <div className="mb-6">
            <i className="fas fa-heart text-6xl text-red-500 mb-4"></i>
          </div>
          <h1 className="font-playfair text-5xl font-bold text-gray-900 mb-6">
            Welcome to Your Wedding Journey
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Let's create your personalized wedding profile step by step. 
            Your progress is saved automatically, so you can return anytime.
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <span className="text-sm font-medium text-gray-600">
              Step {currentStep} of {totalSteps}
            </span>
            <span className="text-sm font-medium text-gray-600">
              {Math.round((currentStep / totalSteps) * 100)}% Complete
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-gray-800 to-black h-3 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            ></div>
          </div>
          
          {/* Step indicators */}
          <div className="flex justify-between mt-4">
            {[1, 2, 3, 4].map((step) => (
              <div key={step} className="flex flex-col items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300 ${
                    step <= currentStep
                      ? 'bg-black text-white'
                      : completedSteps.includes(step)
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-300 text-gray-600'
                  }`}
                >
                  {completedSteps.includes(step) ? (
                    <i className="fas fa-check text-xs"></i>
                  ) : (
                    step
                  )}
                </div>
                <span className="text-xs text-gray-600 mt-2 max-w-[80px] text-center">
                  {getStepConfig(step).title}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Auto-save indicator */}
        {saveMessage && (
          <div className="mb-4 flex items-center justify-center">
            <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-2 flex items-center">
              <i className="fas fa-check-circle text-green-500 mr-2"></i>
              <span className="text-sm text-green-700">{saveMessage}</span>
            </div>
          </div>
        )}

        {/* Region detection indicator */}
        {detectedRegion && currentStep === 1 && (
          <div className="mb-4 flex items-center justify-center">
            <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2 flex items-center">
              <i className="fas fa-globe text-blue-500 mr-2"></i>
              <span className="text-sm text-blue-700">
                Detected location: {detectedRegion.country} ({detectedRegion.timezone})
              </span>
            </div>
          </div>
        )}

        {/* Main Form Card */}
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
          {/* Card Header */}
          <div className="bg-gradient-to-r from-gray-900 to-gray-800 px-8 py-8">
            <div className="flex items-center mb-4">
              <i className={`${currentStepConfig.icon} text-white text-2xl mr-4`}></i>
              <div>
                <h2 className="font-playfair text-3xl font-bold text-white mb-2">
                  {currentStepConfig.title}
                </h2>
                <p className="text-gray-300 text-lg">
                  {currentStepConfig.subtitle}
                </p>
              </div>
            </div>
            <p className="text-gray-400 text-sm">
              {currentStepConfig.description}
            </p>
          </div>
          
          {/* Form Content */}
          <div className="px-8 py-10">
            {errors.general && (
              <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-md shadow-sm mb-8">
                <div className="flex items-center">
                  <i className="fas fa-exclamation-triangle text-red-500 text-xl mr-4"></i>
                  <p className="text-red-800 font-medium">{errors.general}</p>
                </div>
              </div>
            )}

            {/* Step 1: About You */}
            {currentStep === 1 && (
              <div className="form-card">
                <div className="form-section-header">
                  <h3 className="form-section-title">
                    <i className="fas fa-users form-section-icon"></i>
                    Tell Us About You
                  </h3>
                  <p className="form-section-description">
                    Let's start with the basics. We'll use this information to personalize your wedding planning experience and create your couple profile.
                  </p>
                </div>
                
                <div className="form-grid">
                  <div className="form-field">
                    <label className="form-label">
                      Your Name *
                    </label>
                    <input
                      type="text"
                      value={formData.partner1Name}
                      onChange={handleChange('partner1Name')}
                      className={`form-input w-full ${
                        errors.partner1Name ? 'error-border' : ''
                      }`}
                      placeholder="Enter your full name"
                      disabled={isLoading}
                    />
                    {errors.partner1Name && (
                      <p className="error-message">
                        <i className="fas fa-exclamation-circle"></i>
                        {errors.partner1Name}
                      </p>
                    )}
                  </div>

                  <div className="form-field">
                    <label className="form-label">
                      Partner's Name <span className="form-label-optional">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      value={formData.partner2Name}
                      onChange={handleChange('partner2Name')}
                      className="form-input w-full"
                      placeholder="Enter partner's full name"
                      disabled={isLoading}
                    />
                    <p className="form-help-text">
                      You can add your partner's details now or invite them to join later.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Wedding Details */}
            {currentStep === 2 && (
              <div className="form-card">
                <div className="form-section-header">
                  <h3 className="form-section-title">
                    <i className="fas fa-ring form-section-icon"></i>
                    Your Wedding Vision
                  </h3>
                  <p className="form-section-description">
                    Share your dream wedding details with us. This helps us provide personalized recommendations and planning tools tailored to your style and timeline.
                  </p>
                </div>
                
                <div className="form-grid">
                  <div className="form-field">
                    <label className="form-label">
                      Wedding Date <span className="form-label-optional">(Optional)</span>
                    </label>
                    <Suspense fallback={<DatePickerWithFallback />}>
                      <DatePicker
                        value={formData.weddingDate}
                        onChange={(date) => setFormData(prev => ({ ...prev, weddingDate: date }))}
                        placeholder="Choose your special day"
                        disabled={isLoading}
                      />
                    </Suspense>
                    <p className="form-help-text">
                      Don't have a date yet? No problem! You can always update this later as your plans develop.
                    </p>
                  </div>

                  <div className="form-field">
                    <label className="form-label">
                      Wedding Style
                    </label>
                    <select
                      value={formData.weddingStyle}
                      onChange={handleChange('weddingStyle')}
                      className="form-input w-full"
                      disabled={isLoading}
                    >
                      <option value="traditional">Traditional</option>
                      <option value="modern">Modern</option>
                      <option value="rustic">Rustic</option>
                      <option value="bohemian">Bohemian</option>
                      <option value="vintage">Vintage</option>
                      <option value="beach">Beach</option>
                      <option value="garden">Garden</option>
                      <option value="destination">Destination</option>
                    </select>
                    <p className="form-help-text">
                      This helps us suggest vendors and ideas that match your aesthetic preferences.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Venue Information */}
            {currentStep === 3 && (
              <div className="form-card">
                <div className="form-section-header">
                  <h3 className="form-section-title">
                    <i className="fas fa-map-marker-alt form-section-icon"></i>
                    Venue & Location
                  </h3>
                  <p className="form-section-description">
                    Tell us about your dream venue or location. This information helps us provide location-specific vendor recommendations and planning insights.
                  </p>
                </div>
                
                <div className="form-grid">
                  <div className="form-field">
                    <label className="form-label">
                      Venue Name <span className="form-label-optional">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      value={formData.venueName}
                      onChange={handleChange('venueName')}
                      className="form-input w-full"
                      placeholder="e.g., The Grand Ballroom"
                      disabled={isLoading}
                    />
                    <p className="form-help-text">
                      If you already have a venue in mind or booked, let us know! Still searching? We can help you find the perfect location.
                    </p>
                  </div>

                  <div className="form-field">
                    <label className="form-label">
                      City & State <span className="form-label-optional">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      value={formData.venueLocation}
                      onChange={handleChange('venueLocation')}
                      className="form-input w-full"
                      placeholder="e.g., San Francisco, CA"
                      disabled={isLoading}
                    />
                    <p className="form-help-text">
                      This helps us connect you with local vendors, weather insights, and area-specific planning tips.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Planning Details */}
            {currentStep === 4 && (
              <div className="form-card">
                <div className="form-section-header">
                  <h3 className="form-section-title">
                    <i className="fas fa-clipboard-list form-section-icon"></i>
                    Planning & Budget
                  </h3>
                  <p className="form-section-description">
                    Help us understand the scope of your celebration. These details allow us to provide more accurate planning tools, vendor suggestions, and budget breakdowns.
                  </p>
                </div>
                
                <div className="form-grid">
                  <div className="form-field">
                    <label className="form-label">
                      Estimated Guest Count
                    </label>
                    <input
                      type="number"
                      value={formData.guestCountEstimate}
                      onChange={handleChange('guestCountEstimate')}
                      className={`form-input w-full ${
                        errors.guestCountEstimate ? 'error-border' : ''
                      }`}
                      placeholder="100"
                      disabled={isLoading}
                      min="1"
                      max="1000"
                    />
                    <p className="form-help-text">
                      Don't worry about being exact—this helps us suggest appropriate venue sizes and catering options.
                    </p>
                    {errors.guestCountEstimate && (
                      <p className="error-message">
                        <i className="fas fa-exclamation-circle"></i>
                        {errors.guestCountEstimate}
                      </p>
                    )}
                  </div>

                  <div className="form-field">
                    <label className="form-label">
                      Total Budget ($)
                    </label>
                    <input
                      type="number"
                      value={formData.budgetTotal}
                      onChange={handleChange('budgetTotal')}
                      className={`form-input w-full ${
                        errors.budgetTotal ? 'error-border' : ''
                      }`}
                      placeholder="50,000"
                      disabled={isLoading}
                      min="0"
                      step="1000"
                    />
                    <p className="form-help-text">
                      Your total wedding budget. This information is private and helps us create realistic planning recommendations.
                    </p>
                    {errors.budgetTotal && (
                      <p className="error-message">
                        <i className="fas fa-exclamation-circle"></i>
                        {errors.budgetTotal}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="border-t border-gray-200 pt-12 mt-12">
              {/* Progress Summary */}
              <div className="text-center mb-8">
                <p className="text-sm text-gray-600 mb-2">
                  {currentStep < totalSteps 
                    ? `Step ${currentStep} of ${totalSteps} • ${Math.round((currentStep / totalSteps) * 100)}% Complete`
                    : 'Ready to create your wedding profile!'
                  }
                </p>
                <div className="w-24 h-1 bg-gray-200 rounded-full mx-auto">
                  <div 
                    className="h-1 bg-black rounded-full transition-all duration-500"
                    style={{ width: `${(currentStep / totalSteps) * 100}%` }}
                  ></div>
                </div>
              </div>

              {/* Button Container */}
              <div className="btn-group-spaced max-w-2xl mx-auto">
                {/* Left Side - Previous Button */}
                <div className="flex-shrink-0">
                  {currentStep > 1 ? (
                    <button
                      type="button"
                      onClick={handlePrevious}
                      disabled={isLoading}
                      className="btn-base btn-secondary"
                    >
                      <i className="fas fa-arrow-left btn-icon-left"></i>
                      Previous
                    </button>
                  ) : (
                    <div className="w-[140px]"></div>
                  )}
                </div>

                {/* Center - Skip Button (only when applicable) */}
                <div className="flex-shrink-0">
                  {currentStep < totalSteps && (
                    <button
                      type="button"
                      onClick={handleSkip}
                      disabled={isLoading}
                      className="btn-base btn-ghost"
                    >
                      <i className="fas fa-forward btn-icon-left"></i>
                      Skip for now
                    </button>
                  )}
                </div>

                {/* Right Side - Primary Action Button */}
                <div className="flex-shrink-0">
                  {currentStep < totalSteps ? (
                    <button
                      type="button"
                      onClick={handleNext}
                      disabled={isLoading}
                      className="btn-base btn-wedding"
                    >
                      {isLoading ? (
                        <>
                          <i className="fas fa-spinner fa-spin btn-icon-left"></i>
                          Saving...
                        </>
                      ) : (
                        <>
                          Next Step
                          <i className="fas fa-arrow-right btn-icon-right"></i>
                        </>
                      )}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={async (e) => {
                        try {
                          console.log('🔘 Complete Setup button clicked!', e)
                          console.log('About to call handleFinalSubmit...')
                          await handleFinalSubmit()
                          console.log('handleFinalSubmit completed')
                        } catch (error) {
                          console.error('❌ Error in button click handler:', error)
                        }
                      }}
                      disabled={isLoading}
                      className="btn-base btn-wedding"
                      style={{ minWidth: '180px' }}
                    >
                      {isLoading ? (
                        <>
                          <i className="fas fa-spinner fa-spin btn-icon-left"></i>
                          Creating...
                        </>
                      ) : (
                        <>
                          <i className="fas fa-heart btn-icon-left"></i>
                          Complete Setup
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* Help Text */}
              <div className="text-center mt-8">
                <p className="text-xs text-gray-500 max-w-md mx-auto leading-relaxed">
                  {currentStep < totalSteps 
                    ? 'Don\'t worry about getting everything perfect—you can always update these details later.'
                    : 'Once you complete setup, you\'ll have access to all our wedding planning tools and features!'
                  }
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Help Section */}
        <div className="mt-8 bg-blue-50 rounded-xl p-8 border border-blue-100">
          <div className="text-center">
            <div className="mb-4">
              <i className="fas fa-lightbulb text-3xl text-blue-500"></i>
            </div>
            <h4 className="font-semibold text-blue-900 mb-3 text-lg">
              {currentStep < totalSteps ? 'Take your time!' : 'Almost done!'}
            </h4>
            <p className="text-blue-800 leading-relaxed max-w-2xl mx-auto">
              {currentStep < totalSteps
                ? 'Your progress is automatically saved. You can always come back later to complete or update your information.'
                : 'Complete your profile to unlock all our wedding planning tools and get personalized recommendations for your special day!'
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

// Wrap the component with AuthGuard
function OnboardingPageWithAuth() {
  return (
    <AuthGuard requireAuth={true} redirectTo="/auth/signin">
      <OnboardingPage />
    </AuthGuard>
  )
}

// Export with Suspense wrapper to handle useSearchParams
export default function Page() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4"></div>
          <p className="text-gray-600">Loading onboarding...</p>
        </div>
      </div>
    }>
      <OnboardingPageWithAuth />
    </Suspense>
  )
}