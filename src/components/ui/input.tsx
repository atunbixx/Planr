import React from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helpText?: string
  variant?: 'default' | 'filled'
}

export function Input({ 
  label, 
  error, 
  helpText, 
  variant = 'default',
  className = '', 
  id,
  ...props 
}: InputProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')

  const variantClasses = {
    default: 'bg-white border-[#E2E8F0] focus:bg-white dark:bg-dark-2',
    filled: 'bg-[#F8FAFC] border-[#E2E8F0] focus:bg-white dark:bg-dark-2'
  }

  return (
    <div className="space-y-2">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-semibold text-[#1E293B] dark:text-neutral-200">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`
          w-full px-4 py-3 border-2 rounded-xl shadow-sm text-[#1E293B] dark:text-white transition-all duration-200
          placeholder-[#94A3B8] dark:placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#722F37]/20 focus:border-[#722F37]
          ${variantClasses[variant]}
          dark:bg-dark-2 dark:border-dark-3
          ${error ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500' : ''}
          ${className}
        `}
        {...props}
      />
      {error && (
        <p className="text-sm text-red-600 flex items-center gap-1">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </p>
      )}
      {helpText && !error && (
        <p className="text-sm text-[#64748B]">{helpText}</p>
      )}
    </div>
  )
}
