'use client'

import { useState, useEffect } from 'react'
import { detectUserRegion, getDefaultRegion, type RegionInfo } from '@/lib/region-detection'

export interface UseRegionDetectionResult {
  region: RegionInfo | null
  isLoading: boolean
  error: string | null
  currency: string
  locale: string
  timezone: string
}

/**
 * Hook to detect user's region and provide appropriate currency/locale settings
 */
export function useRegionDetection(): UseRegionDetectionResult {
  const [region, setRegion] = useState<RegionInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function detectRegion() {
      try {
        setIsLoading(true)
        setError(null)
        
        const detectedRegion = await detectUserRegion()
        
        if (detectedRegion) {
          setRegion(detectedRegion)
        } else {
          // Fallback to default region
          setRegion(getDefaultRegion())
        }
      } catch (err) {
        console.error('Region detection failed:', err)
        setError(err instanceof Error ? err.message : 'Failed to detect region')
        // Fallback to default region on error
        setRegion(getDefaultRegion())
      } finally {
        setIsLoading(false)
      }
    }

    detectRegion()
  }, [])

  return {
    region,
    isLoading,
    error,
    currency: region?.currency || 'USD',
    locale: region?.locale || 'en-US',
    timezone: region?.timezone || 'America/New_York'
  }
}

/**
 * Hook to get currency symbol for the detected region
 */
export function useRegionalCurrency(): { currency: string; symbol: string; isLoading: boolean } {
  const { currency, isLoading } = useRegionDetection()
  
  const getCurrencySymbol = (curr: string): string => {
    const symbols: Record<string, string> = {
      USD: '$',
      EUR: '€',
      GBP: '£',
      JPY: '¥',
      CNY: '¥',
      INR: '₹',
      NGN: '₦',
      CAD: 'C$',
      AUD: 'A$',
      CHF: 'Fr',
      SEK: 'kr',
      NOK: 'kr',
      DKK: 'kr',
      MXN: '$',
      BRL: 'R$',
      ARS: '$',
      CLP: '$',
      COP: '$',
      PEN: 'S/',
      UYU: '$',
      ZAR: 'R'
    }
    return symbols[curr] || curr
  }

  return {
    currency,
    symbol: getCurrencySymbol(currency),
    isLoading
  }
}