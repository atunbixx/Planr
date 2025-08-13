import * as React from 'react'

interface RadioOption {
  value: string
  label: string
}

interface SimpleRadioGroupProps {
  value: string
  onChange: (value: string) => void
  options: RadioOption[]
  name?: string
  className?: string
}

export function SimpleRadioGroup({ value, onChange, options, name, className }: SimpleRadioGroupProps) {
  return (
    <div className={`space-y-2 ${className || ''}`}>
      {options.map((option) => (
        <label
          key={option.value}
          className="flex items-center gap-3 cursor-pointer"
        >
          <input
            type="radio"
            name={name}
            value={option.value}
            checked={value === option.value}
            onChange={(e) => onChange(e.target.value)}
            className="h-4 w-4 text-purple-600 focus:ring-purple-500"
          />
          <span className="text-sm text-gray-700">{option.label}</span>
        </label>
      ))}
    </div>
  )
}