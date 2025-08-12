'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { LocaleConfig, detectBrowserLocale, detectTimezone, getLocaleConfig, formatCurrency, formatDate, formatNumber } from '@/lib/locale'

interface LocaleContextType {
  localeConfig: LocaleConfig
  setLocale: (locale: string) => void
  formatCurrency: (amount: number, abbreviated?: boolean) => string
  formatDate: (date: Date, options?: Intl.DateTimeFormatOptions) => string
  formatNumber: (number: number) => string
  isLoading: boolean
}

const LocaleContext = createContext<LocaleContextType | undefined>(undefined)

interface LocaleProviderProps {
  children: ReactNode
}

export function LocaleProvider({ children }: LocaleProviderProps) {
  const [localeConfig, setLocaleConfig] = useState<LocaleConfig | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Initialize locale from browser detection
  useEffect(() => {
    const initializeLocale = async () => {
      try {
        // First, detect browser locale
        const browserLocale = detectBrowserLocale()
        const browserTimezone = detectTimezone()
        
        // Create initial config with browser detection
        const initialConfig = {
          ...browserLocale,
          timezone: browserTimezone
        }

        setLocaleConfig(initialConfig)

        // Try to fetch user preferences to override browser detection
        try {
          const response = await fetch('/api/settings/preferences', {
            credentials: 'include'
          })
          
          if (response.ok) {
            const data = await response.json()
            if (data.success && data.preferences) {
              const userLocale = data.preferences.language || browserLocale.language
              const userCurrency = data.preferences.currency || browserLocale.currency
              const userTimezone = data.preferences.timezone || browserTimezone

              // Get the best locale config for user's language
              const userConfig = getLocaleConfig(`${userLocale}-${browserLocale.country}`) || getLocaleConfig(userLocale) || browserLocale
              
              // Override with user preferences
              const finalConfig = {
                ...userConfig,
                currency: userCurrency,
                timezone: userTimezone
              }

              setLocaleConfig(finalConfig)
            }
          }
        } catch (error) {
          // User not authenticated or preferences not available
          // Continue with browser-detected locale
          console.log('Using browser-detected locale:', browserLocale)
        }
      } catch (error) {
        console.error('Error initializing locale:', error)
        // Fallback to US English
        setLocaleConfig(getLocaleConfig('en-US'))
      } finally {
        setIsLoading(false)
      }
    }

    initializeLocale()
  }, [])

  const setLocale = async (locale: string) => {
    const newConfig = getLocaleConfig(locale)
    setLocaleConfig(newConfig)

    // Save to user preferences if authenticated
    try {
      await fetch('/api/settings/preferences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          language: newConfig.language,
          currency: newConfig.currency,
          timezone: newConfig.timezone
        })
      })
    } catch (error) {
      console.log('Could not save locale preferences:', error)
    }
  }

  const contextValue: LocaleContextType = {
    localeConfig: localeConfig || getLocaleConfig('en-US'),
    setLocale,
    formatCurrency: (amount: number, abbreviated = false) => formatCurrency(amount, localeConfig?.currency || 'NGN', localeConfig?.locale || 'en-NG', abbreviated),
    formatDate: (date: Date, options?: Intl.DateTimeFormatOptions) => formatDate(date, localeConfig?.locale || 'en-US', options),
    formatNumber: (number: number) => formatNumber(number, localeConfig?.locale || 'en-US'),
    isLoading
  }

  return (
    <LocaleContext.Provider value={contextValue}>
      {children}
    </LocaleContext.Provider>
  )
}

export function useLocale() {
  const context = useContext(LocaleContext)
  if (context === undefined) {
    throw new Error('useLocale must be used within a LocaleProvider')
  }
  return context
}