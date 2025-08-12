'use client'

import { OnboardingData } from '../OnboardingFlow'

interface Step2Props {
  formData: OnboardingData
  updateFormData: (updates: Partial<OnboardingData>) => void
  onNext: () => void
  onPrevious: () => void
  onSkip: () => void
  currentStep: number
}

const weddingStyles = [
  { value: '', label: 'Select your style...' },
  { value: 'modern', label: 'Modern & Contemporary' },
  { value: 'traditional', label: 'Traditional & Classic' },
  { value: 'rustic', label: 'Rustic & Country' },
  { value: 'bohemian', label: 'Bohemian & Free-spirited' },
  { value: 'elegant', label: 'Elegant & Formal' },
  { value: 'destination', label: 'Destination & Travel' },
  { value: 'vintage', label: 'Vintage & Retro' },
  { value: 'minimalist', label: 'Minimalist & Simple' },
]

export default function Step2WeddingDetails({ formData, updateFormData, onNext, onPrevious, onSkip }: Step2Props) {
  const handleNext = () => {
    onNext()
  }

  return (
    <div className="space-y-6">
      <div>
        <label htmlFor="weddingStyle" className="block text-sm font-medium text-gray-700 mb-2">
          Wedding Style
        </label>
        <select
          id="weddingStyle"
          value={formData.weddingStyle || ''}
          onChange={(e) => updateFormData({ weddingStyle: e.target.value })}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition-colors"
        >
          {weddingStyles.map((style) => (
            <option key={style.value} value={style.value}>
              {style.label}
            </option>
          ))}
        </select>
        <p className="mt-1 text-sm text-gray-500">
          This helps us suggest vendors and themes that match your vision
        </p>
      </div>

      <div>
        <label htmlFor="weddingDate" className="block text-sm font-medium text-gray-700 mb-2">
          Wedding Date
        </label>
        <input
          id="weddingDate"
          type="date"
          placeholder="Choose your special day"
          value={formData.weddingDate || ''}
          onChange={(e) => updateFormData({ weddingDate: e.target.value })}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition-colors"
        />
        <p className="mt-1 text-sm text-gray-500">
          Don't worry, you can change this later as your plans develop
        </p>
      </div>

      <div className="flex justify-between space-x-4 pt-6">
        <button
          onClick={onPrevious}
          className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Previous
        </button>
        
        <div className="space-x-4">
          <button
            onClick={onSkip}
            className="px-6 py-3 text-gray-500 hover:text-gray-700 transition-colors"
          >
            Skip for now
          </button>
          <button
            onClick={handleNext}
            className="px-6 py-3 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors"
          >
            Next Step
          </button>
        </div>
      </div>
    </div>
  )
}