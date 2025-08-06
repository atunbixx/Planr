'use client'

interface ProgressBarProps {
  currentStep: number
  totalSteps: number
}

const stepTitles = ['About You', 'Wedding Details', 'Venue', 'Budget']

export default function ProgressBar({ currentStep, totalSteps }: ProgressBarProps) {
  const progressPercentage = (currentStep / totalSteps) * 100

  return (
    <div className="mb-8">
      {/* Progress bar */}
      <div className="w-full bg-gray-200 rounded-full h-3 mb-6 overflow-hidden">
        <div 
          className="bg-gradient-to-r from-rose-500 to-purple-600 h-full rounded-full transition-all duration-500 ease-out relative"
          style={{ width: `${progressPercentage}%` }}
        >
          <div className="absolute inset-0 bg-white opacity-20 animate-pulse"></div>
        </div>
      </div>
      
      {/* Step indicators */}
      <div className="flex justify-between">
        {Array.from({ length: totalSteps }, (_, i) => {
          const stepNumber = i + 1
          const isCompleted = stepNumber < currentStep
          const isCurrent = stepNumber === currentStep
          
          return (
            <div key={stepNumber} className="flex flex-col items-center relative">
              {/* Connection line */}
              {stepNumber < totalSteps && (
                <div 
                  className={`absolute top-4 left-full w-full h-0.5 -ml-1/2 ${
                    isCompleted ? 'bg-rose-500' : 'bg-gray-300'
                  }`}
                  style={{ width: 'calc(100% - 2rem)' }}
                />
              )}
              
              {/* Step circle */}
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300 relative z-10 ${
                  isCompleted
                    ? 'bg-rose-500 text-white shadow-lg shadow-rose-200'
                    : isCurrent
                    ? 'bg-rose-600 text-white ring-4 ring-rose-100 shadow-lg shadow-rose-200'
                    : 'bg-white border-2 border-gray-300 text-gray-600'
                }`}
              >
                {isCompleted ? (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  stepNumber
                )}
              </div>
              
              {/* Step title */}
              <div className={`mt-3 text-xs text-center ${
                isCurrent ? 'text-gray-900 font-semibold' : 'text-gray-500'
              }`}>
                {stepTitles[i]}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}