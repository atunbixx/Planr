/**
 * Locale detection and region settings utilities
 */

export interface LocaleConfig {
  locale: string
  language: string
  country: string
  currency: string
  timezone: string
  dateFormat: string
  numberFormat: string
}

// Mapping of locales to their regional settings
export const LOCALE_CONFIGS: Record<string, LocaleConfig> = {
  'en-US': {
    locale: 'en-US',
    language: 'en',
    country: 'US',
    currency: 'USD',
    timezone: 'America/New_York',
    dateFormat: 'MM/dd/yyyy',
    numberFormat: 'en-US'
  },
  'en-GB': {
    locale: 'en-GB',
    language: 'en',
    country: 'GB',
    currency: 'GBP',
    timezone: 'Europe/London',
    dateFormat: 'dd/MM/yyyy',
    numberFormat: 'en-GB'
  },
  'en-CA': {
    locale: 'en-CA',
    language: 'en',
    country: 'CA',
    currency: 'CAD',
    timezone: 'America/Toronto',
    dateFormat: 'yyyy-MM-dd',
    numberFormat: 'en-CA'
  },
  'en-AU': {
    locale: 'en-AU',
    language: 'en',
    country: 'AU',
    currency: 'AUD',
    timezone: 'Australia/Sydney',
    dateFormat: 'dd/MM/yyyy',
    numberFormat: 'en-AU'
  },
  'es-ES': {
    locale: 'es-ES',
    language: 'es',
    country: 'ES',
    currency: 'EUR',
    timezone: 'Europe/Madrid',
    dateFormat: 'dd/MM/yyyy',
    numberFormat: 'es-ES'
  },
  'es-MX': {
    locale: 'es-MX',
    language: 'es',
    country: 'MX',
    currency: 'MXN',
    timezone: 'America/Mexico_City',
    dateFormat: 'dd/MM/yyyy',
    numberFormat: 'es-MX'
  },
  'fr-FR': {
    locale: 'fr-FR',
    language: 'fr',
    country: 'FR',
    currency: 'EUR',
    timezone: 'Europe/Paris',
    dateFormat: 'dd/MM/yyyy',
    numberFormat: 'fr-FR'
  },
  'fr-CA': {
    locale: 'fr-CA',
    language: 'fr',
    country: 'CA',
    currency: 'CAD',
    timezone: 'America/Toronto',
    dateFormat: 'yyyy-MM-dd',
    numberFormat: 'fr-CA'
  },
  'de-DE': {
    locale: 'de-DE',
    language: 'de',
    country: 'DE',
    currency: 'EUR',
    timezone: 'Europe/Berlin',
    dateFormat: 'dd.MM.yyyy',
    numberFormat: 'de-DE'
  },
  'it-IT': {
    locale: 'it-IT',
    language: 'it',
    country: 'IT',
    currency: 'EUR',
    timezone: 'Europe/Rome',
    dateFormat: 'dd/MM/yyyy',
    numberFormat: 'it-IT'
  },
  'pt-BR': {
    locale: 'pt-BR',
    language: 'pt',
    country: 'BR',
    currency: 'BRL',
    timezone: 'America/Sao_Paulo',
    dateFormat: 'dd/MM/yyyy',
    numberFormat: 'pt-BR'
  },
  'pt-PT': {
    locale: 'pt-PT',
    language: 'pt',
    country: 'PT',
    currency: 'EUR',
    timezone: 'Europe/Lisbon',
    dateFormat: 'dd/MM/yyyy',
    numberFormat: 'pt-PT'
  },
  'ja-JP': {
    locale: 'ja-JP',
    language: 'ja',
    country: 'JP',
    currency: 'JPY',
    timezone: 'Asia/Tokyo',
    dateFormat: 'yyyy/MM/dd',
    numberFormat: 'ja-JP'
  },
  'zh-CN': {
    locale: 'zh-CN',
    language: 'zh',
    country: 'CN',
    currency: 'CNY',
    timezone: 'Asia/Shanghai',
    dateFormat: 'yyyy/MM/dd',
    numberFormat: 'zh-CN'
  },
  'hi-IN': {
    locale: 'hi-IN',
    language: 'hi',
    country: 'IN',
    currency: 'INR',
    timezone: 'Asia/Kolkata',
    dateFormat: 'dd/MM/yyyy',
    numberFormat: 'hi-IN'
  },
  'ar-SA': {
    locale: 'ar-SA',
    language: 'ar',
    country: 'SA',
    currency: 'SAR',
    timezone: 'Asia/Riyadh',
    dateFormat: 'dd/MM/yyyy',
    numberFormat: 'ar-SA'
  },
  'en-NG': {
    locale: 'en-NG',
    language: 'en',
    country: 'NG',
    currency: 'NGN',
    timezone: 'Africa/Lagos',
    dateFormat: 'dd/MM/yyyy',
    numberFormat: 'en-NG'
  },
  'en-GH': {
    locale: 'en-GH',
    language: 'en',
    country: 'GH',
    currency: 'GHS',
    timezone: 'Africa/Accra',
    dateFormat: 'dd/MM/yyyy',
    numberFormat: 'en-GH'
  },
  'en-KE': {
    locale: 'en-KE',
    language: 'en',
    country: 'KE',
    currency: 'KES',
    timezone: 'Africa/Nairobi',
    dateFormat: 'dd/MM/yyyy',
    numberFormat: 'en-KE'
  },
  'en-ZA': {
    locale: 'en-ZA',
    language: 'en',
    country: 'ZA',
    currency: 'ZAR',
    timezone: 'Africa/Johannesburg',
    dateFormat: 'yyyy/MM/dd',
    numberFormat: 'en-ZA'
  }
}

// Default fallback configuration
const DEFAULT_CONFIG: LocaleConfig = LOCALE_CONFIGS['en-NG']

/**
 * Detects the user's browser locale and returns regional configuration
 */
export function detectBrowserLocale(): LocaleConfig {
  if (typeof window === 'undefined') {
    return DEFAULT_CONFIG
  }

  // Get browser locales in order of preference
  const browserLocales = [
    navigator.language,
    ...navigator.languages
  ]

  // Try to find an exact match first
  for (const locale of browserLocales) {
    if (LOCALE_CONFIGS[locale]) {
      return LOCALE_CONFIGS[locale]
    }
  }

  // Try to find a language match (e.g., 'en' for 'en-NZ')
  for (const locale of browserLocales) {
    const language = locale.split('-')[0]
    const match = Object.values(LOCALE_CONFIGS).find(config => config.language === language)
    if (match) {
      return match
    }
  }

  return DEFAULT_CONFIG
}

/**
 * Gets timezone from browser if available
 */
export function detectTimezone(): string {
  if (typeof window === 'undefined') {
    return DEFAULT_CONFIG.timezone
  }

  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone
  } catch {
    return DEFAULT_CONFIG.timezone
  }
}

/**
 * Gets locale configuration by locale string
 */
export function getLocaleConfig(locale: string): LocaleConfig {
  return LOCALE_CONFIGS[locale] || DEFAULT_CONFIG
}

/**
 * Formats large numbers with abbreviations (K, M, B)
 */
export function formatNumberAbbreviation(amount: number): string {
  // Handle null/undefined values
  if (amount == null || isNaN(amount)) {
    return '0'
  }
  
  const absAmount = Math.abs(amount)
  
  if (absAmount >= 1000000000) {
    return (amount / 1000000000).toFixed(1).replace(/\.0$/, '') + 'B'
  }
  if (absAmount >= 1000000) {
    return (amount / 1000000).toFixed(1).replace(/\.0$/, '') + 'M'
  }
  if (absAmount >= 1000) {
    return (amount / 1000).toFixed(1).replace(/\.0$/, '') + 'K'
  }
  
  return amount.toString()
}

/**
 * Formats currency based on locale with optional abbreviation
 */
export function formatCurrency(amount: number, currency: string, locale: string, abbreviated = false): string {
  try {
    // Handle null/undefined values
    if (amount == null || isNaN(amount)) {
      amount = 0
    }
    
    if (abbreviated) {
      const symbol = getCurrencySymbol(currency, locale)
      return `${symbol}${formatNumberAbbreviation(amount)}`
    }
    
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency
    }).format(amount)
  } catch {
    // Fallback to simple formatting
    const symbol = getCurrencySymbol(currency, locale)
    if (abbreviated) {
      return `${symbol}${formatNumberAbbreviation(amount)}`
    }
    return `${currency} ${amount.toLocaleString()}`
  }
}

/**
 * Gets currency symbol for a given currency and locale
 */
export function getCurrencySymbol(currency: string, locale: string): string {
  try {
    const formatter = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency
    })
    // Extract just the currency symbol
    const parts = formatter.formatToParts(0)
    const currencyPart = parts.find(part => part.type === 'currency')
    return currencyPart?.value || currency
  } catch {
    // Fallback currency symbols
    const symbols: Record<string, string> = {
      'NGN': '₦',
      'USD': '$',
      'GBP': '£',
      'EUR': '€',
      'CAD': 'C$',
      'AUD': 'A$',
      'JPY': '¥',
      'CNY': '¥',
      'INR': '₹',
      'SAR': '﷼',
      'GHS': '₵',
      'KES': 'KSh',
      'ZAR': 'R'
    }
    return symbols[currency] || currency
  }
}

/**
 * Formats date based on locale
 */
export function formatDate(date: Date, locale: string, options?: Intl.DateTimeFormatOptions): string {
  try {
    return new Intl.DateTimeFormat(locale, options).format(date)
  } catch {
    // Fallback to ISO string
    return date.toLocaleDateString()
  }
}

/**
 * Formats number based on locale
 */
export function formatNumber(number: number, locale: string): string {
  try {
    return new Intl.NumberFormat(locale).format(number)
  } catch {
    // Fallback to simple formatting
    return number.toLocaleString()
  }
}

/**
 * Gets all available locales
 */
export function getAvailableLocales(): LocaleConfig[] {
  return Object.values(LOCALE_CONFIGS)
}

/**
 * Gets supported languages (for message files)
 */
export function getSupportedLanguages(): string[] {
  return ['en', 'es', 'fr', 'de', 'it', 'pt', 'ja', 'zh', 'hi', 'ar']
}

/**
 * Gets all supported currencies
 */
export function getSupportedCurrencies(): string[] {
  return ['NGN', 'USD', 'GBP', 'EUR', 'CAD', 'AUD', 'MXN', 'BRL', 'JPY', 'CNY', 'INR', 'SAR', 'GHS', 'KES', 'ZAR']
}