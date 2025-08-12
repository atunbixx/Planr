'use client'

import { OnboardingData } from '../OnboardingFlow'

interface Step3Props {
  formData: OnboardingData
  updateFormData: (updates: Partial<OnboardingData>) => void
  onNext: () => void
  onPrevious: () => void
  onSkip: () => void
  currentStep: number
}

export default function Step3VenueLocation({ formData, updateFormData, onNext, onPrevious, onSkip }: Step3Props) {
  const handleNext = () => {
    onNext()
  }

  return (
    <div className="space-y-6">
      <div>
        <label htmlFor="venueName" className="block text-sm font-medium text-gray-700 mb-2">
          Venue Name
        </label>
        <input
          id="venueName"
          type="text"
          placeholder="The Grand Ballroom"
          value={formData.venueName || ''}
          onChange={(e) => updateFormData({ venueName: e.target.value })}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition-colors"
        />
        <p className="mt-1 text-sm text-gray-500">
          Enter the name of your wedding venue if you've chosen one
        </p>
      </div>

      <div>
        <label htmlFor="venueLocation" className="block text-sm font-medium text-gray-700 mb-2">
          Venue Location
        </label>
        <input
          id="venueLocation"
          type="text"
          placeholder="San Francisco, CA"
          value={formData.venueLocation || ''}
          onChange={(e) => updateFormData({ venueLocation: e.target.value })}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition-colors"
        />
        <p className="mt-1 text-sm text-gray-500">
          City and state/country where your wedding will take place
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">Haven't chosen a venue yet?</h3>
            <p className="mt-1 text-sm text-blue-700">
              No problem! You can skip this step and add venue details later. We'll help you find the perfect location in your area.
            </p>
          </div>
        </div>
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