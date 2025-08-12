/**
 * Region detection and currency mapping utilities
 */

export interface RegionInfo {
  country: string
  currency: string
  locale: string
  timezone: string
}

// Mapping of countries to their default currencies and locales
export const countryToCurrency: Record<string, RegionInfo> = {
  // North America
  'US': { country: 'United States', currency: 'USD', locale: 'en-US', timezone: 'America/New_York' },
  'CA': { country: 'Canada', currency: 'CAD', locale: 'en-CA', timezone: 'America/Toronto' },
  'MX': { country: 'Mexico', currency: 'MXN', locale: 'es-MX', timezone: 'America/Mexico_City' },
  
  // Europe
  'GB': { country: 'United Kingdom', currency: 'GBP', locale: 'en-GB', timezone: 'Europe/London' },
  'DE': { country: 'Germany', currency: 'EUR', locale: 'de-DE', timezone: 'Europe/Berlin' },
  'FR': { country: 'France', currency: 'EUR', locale: 'fr-FR', timezone: 'Europe/Paris' },
  'ES': { country: 'Spain', currency: 'EUR', locale: 'es-ES', timezone: 'Europe/Madrid' },
  'IT': { country: 'Italy', currency: 'EUR', locale: 'it-IT', timezone: 'Europe/Rome' },
  'PT': { country: 'Portugal', currency: 'EUR', locale: 'pt-PT', timezone: 'Europe/Lisbon' },
  'CH': { country: 'Switzerland', currency: 'CHF', locale: 'de-CH', timezone: 'Europe/Zurich' },
  'SE': { country: 'Sweden', currency: 'SEK', locale: 'sv-SE', timezone: 'Europe/Stockholm' },
  'NO': { country: 'Norway', currency: 'NOK', locale: 'no-NO', timezone: 'Europe/Oslo' },
  'DK': { country: 'Denmark', currency: 'DKK', locale: 'da-DK', timezone: 'Europe/Copenhagen' },
  
  // Africa
  'NG': { country: 'Nigeria', currency: 'NGN', locale: 'en-NG', timezone: 'Africa/Lagos' },
  'ZA': { country: 'South Africa', currency: 'ZAR', locale: 'en-ZA', timezone: 'Africa/Johannesburg' },
  
  // Asia
  'JP': { country: 'Japan', currency: 'JPY', locale: 'ja-JP', timezone: 'Asia/Tokyo' },
  'CN': { country: 'China', currency: 'CNY', locale: 'zh-CN', timezone: 'Asia/Shanghai' },
  'IN': { country: 'India', currency: 'INR', locale: 'hi-IN', timezone: 'Asia/Kolkata' },
  
  // Oceania
  'AU': { country: 'Australia', currency: 'AUD', locale: 'en-AU', timezone: 'Australia/Sydney' },
  
  // South America
  'BR': { country: 'Brazil', currency: 'BRL', locale: 'pt-BR', timezone: 'America/Sao_Paulo' },
  'AR': { country: 'Argentina', currency: 'ARS', locale: 'es-AR', timezone: 'America/Argentina/Buenos_Aires' },
  'CL': { country: 'Chile', currency: 'CLP', locale: 'es-CL', timezone: 'America/Santiago' },
  'CO': { country: 'Colombia', currency: 'COP', locale: 'es-CO', timezone: 'America/Bogota' },
  'PE': { country: 'Peru', currency: 'PEN', locale: 'es-PE', timezone: 'America/Lima' },
  'UY': { country: 'Uruguay', currency: 'UYU', locale: 'es-UY', timezone: 'America/Montevideo' }
}

/**
 * Detect user's region using browser APIs
 */
export async function detectUserRegion(): Promise<RegionInfo | null> {
  try {
    // Try to get country from browser's Intl API
    const locale = Intl.DateTimeFormat().resolvedOptions().locale
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
    
    // Extract country code from locale (e.g., 'en-US' -> 'US')
    const countryCode = locale.split('-')[1]?.toUpperCase()
    
    if (countryCode && countryToCurrency[countryCode]) {
      return {
        ...countryToCurrency[countryCode],
        timezone // Use actual detected timezone
      }
    }
    
    // Fallback: try to detect from timezone
    const timezoneToCountry: Record<string, string> = {
      'Africa/Lagos': 'NG',
      'America/New_York': 'US',
      'America/Toronto': 'CA',
      'Europe/London': 'GB',
      'Europe/Berlin': 'DE',
      'Europe/Paris': 'FR',
      'Asia/Tokyo': 'JP',
      'Australia/Sydney': 'AU'
    }
    
    const countryFromTimezone = timezoneToCountry[timezone]
    if (countryFromTimezone && countryToCurrency[countryFromTimezone]) {
      return countryToCurrency[countryFromTimezone]
    }
    
    return null
  } catch (error) {
    console.warn('Failed to detect user region:', error)
    return null
  }
}

/**
 * Get region info by country code
 */
export function getRegionByCountryCode(countryCode: string): RegionInfo | null {
  return countryToCurrency[countryCode.toUpperCase()] || null
}

/**
 * Get all supported countries
 */
export function getSupportedCountries(): Array<{ code: string; info: RegionInfo }> {
  return Object.entries(countryToCurrency).map(([code, info]) => ({ code, info }))
}

/**
 * Check if a currency is supported
 */
export function isCurrencySupported(currency: string): boolean {
  return Object.values(countryToCurrency).some(region => region.currency === currency)
}

/**
 * Get default region (fallback)
 */
export function getDefaultRegion(): RegionInfo {
  return countryToCurrency['NG'] // Default to Nigeria
}