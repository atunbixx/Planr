'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/utils/cn'

interface InviteCodeInputProps {
  onSubmit: (code: string) => void
  error?: string
  loading?: boolean
}

export default function InviteCodeInput({ onSubmit, error, loading }: InviteCodeInputProps) {
  const [code, setCode] = useState(['', '', '', '', '', ''])
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    // Focus first input on mount
    inputRefs.current[0]?.focus()
  }, [])

  const handleChange = (index: number, value: string) => {
    // Only allow alphanumeric characters
    const sanitizedValue = value.replace(/[^A-Za-z0-9]/g, '').toUpperCase()
    
    if (sanitizedValue.length <= 1) {
      const newCode = [...code]
      newCode[index] = sanitizedValue
      setCode(newCode)

      // Move to next input if value is entered
      if (sanitizedValue && index < 5) {
        inputRefs.current[index + 1]?.focus()
      }
    } else if (sanitizedValue.length === 6) {
      // Handle paste of full code
      const newCode = sanitizedValue.split('').slice(0, 6)
      setCode(newCode)
      inputRefs.current[5]?.focus()
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      // Move to previous input on backspace if current is empty
      inputRefs.current[index - 1]?.focus()
    } else if (e.key === 'Enter') {
      handleSubmit()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text')
    const sanitizedData = pastedData.replace(/[^A-Za-z0-9]/g, '').toUpperCase()
    const pastedCode = sanitizedData.slice(0, 6).split('')
    
    const newCode = [...code]
    pastedCode.forEach((char, i) => {
      if (i < 6) newCode[i] = char
    })
    setCode(newCode)
    
    // Focus last filled input or last input
    const lastFilledIndex = pastedCode.length - 1
    inputRefs.current[Math.min(lastFilledIndex, 5)]?.focus()
  }

  const handleSubmit = () => {
    const fullCode = code.join('')
    if (fullCode.length === 6) {
      onSubmit(fullCode)
    }
  }

  const isCodeComplete = code.every(char => char !== '')

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="font-playfair text-3xl sm:text-4xl font-semibold text-ink">
          Enter Your Invite Code
        </h2>
        <p className="text-gray-600">
          You'll find your 6-character code on your invitation
        </p>
      </div>

      <div className="max-w-sm mx-auto space-y-6">
        {/* Code Input Fields */}
        <div className="flex gap-2 sm:gap-3 justify-center">
          {code.map((digit, index) => (
            <input
              key={index}
              ref={(el) => (inputRefs.current[index] = el)}
              type="text"
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={handlePaste}
              className={cn(
                'w-12 h-14 sm:w-14 sm:h-16 text-center text-xl sm:text-2xl font-bold',
                'border-2 rounded-lg transition-all duration-200',
                'focus:outline-none focus:ring-2 focus:ring-offset-1',
                digit ? 'border-ink bg-gray-50' : 'border-gray-300',
                error ? 'border-red-500 focus:ring-red-500/20' : 'focus:border-ink focus:ring-ink/20'
              )}
              maxLength={1}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
            />
          ))}
        </div>

        {/* Error Message */}
        {error && (
          <div className="text-center animate-in slide-in-from-top-1 duration-300">
            <p className="text-red-500 text-sm font-medium flex items-center justify-center gap-2">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {error}
            </p>
          </div>
        )}

        {/* Submit Button */}
        <Button
          onClick={handleSubmit}
          disabled={!isCodeComplete || loading}
          loading={loading}
          variant="primary"
          size="lg"
          fullWidth
          className="font-semibold"
        >
          Continue to RSVP
        </Button>

        {/* Help Text */}
        <div className="text-center space-y-2">
          <p className="text-sm text-gray-500">
            Can't find your code?
          </p>
          <button
            type="button"
            className="text-sm font-medium text-ink hover:text-gray-700 underline transition-colors"
          >
            Contact the couple for help
          </button>
        </div>
      </div>
    </div>
  )
}