'use client'

import { OnboardingData } from '../OnboardingFlow'

interface Step4Props {
  formData: OnboardingData
  updateFormData: (updates: Partial<OnboardingData>) => void
  onPrevious: () => void
  onComplete: () => void
  isLoading: boolean
  currentStep: number
}

export default function Step4PlanningBudget({ formData, updateFormData, onPrevious, onComplete, isLoading }: Step4Props) {
  const handleComplete = () => {
    onComplete()
  }

  return (
    <div className="space-y-6">
      <div>
        <label htmlFor="guestCountEstimate" className="block text-sm font-medium text-gray-700 mb-2">
          Estimated Guest Count
        </label>
        <input
          id="guestCountEstimate"
          type="number"
          placeholder="100"
          min="1"
          value={formData.guestCountEstimate || ''}
          onChange={(e) => updateFormData({ guestCountEstimate: parseInt(e.target.value) || undefined })}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition-colors"
        />
        <p className="mt-1 text-sm text-gray-500">
          This helps us suggest appropriate venues and catering options
        </p>
      </div>

      <div>
        <label htmlFor="totalBudget" className="block text-sm font-medium text-gray-700 mb-2">
          Total Budget ($)
        </label>
        <input
          id="totalBudget"
          type="number"
          placeholder="50,000"
          min="0"
          step="100"
          value={formData.totalBudget || ''}
          onChange={(e) => updateFormData({ totalBudget: parseFloat(e.target.value) || undefined })}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition-colors"
        />
        <p className="mt-1 text-sm text-gray-500">
          Your total wedding budget helps us recommend vendors within your range
        </p>
      </div>

      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-green-800">You're almost done!</h3>
            <p className="mt-1 text-sm text-green-700">
              Once you complete setup, you'll have access to your personalized wedding dashboard with budget tracking, vendor management, and planning tools.
            </p>
          </div>
        </div>
      </div>

      <div className="flex justify-between space-x-4 pt-6">
        <button
          onClick={onPrevious}
          disabled={isLoading}
          className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </button>
        
        <button
          onClick={handleComplete}
          disabled={isLoading}
          className="px-8 py-3 bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-lg hover:from-pink-700 hover:to-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Setting up...</span>
            </>
          ) : (
            <span>Complete Setup</span>
          )}
        </button>
      </div>
    </div>
  )
}