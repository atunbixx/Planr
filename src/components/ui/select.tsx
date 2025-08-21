import React from 'react'

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  helpText?: string
  variant?: 'default' | 'filled'
  options: { value: string; label: string }[]
}

export function Select({ 
  label, 
  error, 
  helpText, 
  variant = 'default',
  options,
  className = '', 
  id,
  ...props 
}: SelectProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')

  const variantClasses = {
    default: 'bg-white border-[#E2E8F0] focus:bg-white',
    filled: 'bg-[#F8FAFC] border-[#E2E8F0] focus:bg-white'
  }

  return (
    <div className="space-y-2">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-semibold text-[#1E293B]">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          id={inputId}
          className={`
            w-full px-4 py-3 border-2 rounded-xl shadow-sm text-[#1E293B] transition-all duration-200
            focus:outline-none focus:ring-2 focus:ring-[#722F37]/20 focus:border-[#722F37]
            appearance-none cursor-pointer
            ${variantClasses[variant]}
            ${error ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500' : ''}
            ${className}
          `}
          {...props}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          <svg className="w-5 h-5 text-[#94A3B8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
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