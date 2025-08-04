'use client'

import { OnboardingData } from '../OnboardingFlow'

interface Step1Props {
  formData: OnboardingData
  updateFormData: (updates: Partial<OnboardingData>) => void
  onNext: () => void
  currentStep: number
}

export default function Step1AboutYou({ formData, updateFormData, onNext }: Step1Props) {
  const handleNext = () => {
    if (formData.partner1_name.trim()) {
      onNext()
    }
  }

  const isValid = formData.partner1_name.trim().length > 0

  return (
    <div className="space-y-6">
      <div>
        <label htmlFor="partner1_name" className="block text-sm font-medium text-gray-700 mb-2">
          Your Name *
        </label>
        <input
          id="partner1_name"
          type="text"
          placeholder="Enter your full name"
          value={formData.partner1_name}
          onChange={(e) => updateFormData({ partner1_name: e.target.value })}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition-colors"
          required
        />
        {!isValid && formData.partner1_name.length > 0 && (
          <p className="mt-1 text-sm text-red-600">Please enter your name</p>
        )}
      </div>

      <div>
        <label htmlFor="partner2_name" className="block text-sm font-medium text-gray-700 mb-2">
          Partner's Name (Optional)
        </label>
        <input
          id="partner2_name"
          type="text"
          placeholder="Enter partner's full name"
          value={formData.partner2_name || ''}
          onChange={(e) => updateFormData({ partner2_name: e.target.value })}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition-colors"
        />
        <p className="mt-1 text-sm text-gray-500">
          You can add your partner's information now or later
        </p>
      </div>

      <div className="flex justify-end space-x-4 pt-6">
        <button
          onClick={handleNext}
          disabled={!isValid}
          className={`px-6 py-3 rounded-lg font-medium transition-colors ${
            isValid
              ? 'bg-pink-600 text-white hover:bg-pink-700'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          Next Step
        </button>
      </div>
    </div>
  )
}