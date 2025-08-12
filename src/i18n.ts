import { notFound } from 'next/navigation'
import { getRequestConfig } from 'next-intl/server'

// Can be imported from a shared config
export const locales = ['en', 'es', 'fr', 'de', 'it', 'pt', 'ja', 'zh', 'ar', 'hi'] as const
export type Locale = (typeof locales)[number]

export const localeNames: Record<Locale, string> = {
  en: 'English',
  es: 'Español',
  fr: 'Français',
  de: 'Deutsch',
  it: 'Italiano',
  pt: 'Português',
  ja: '日本語',
  zh: '中文',
  ar: 'العربية',
  hi: 'हिन्दी'
}

export default getRequestConfig(async ({ locale }) => {
  // Validate that the incoming `locale` parameter is valid
  if (!locales.includes(locale as any)) notFound()

  return {
    messages: (await import(`./messages/${locale}.json`)).default,
    timeZone: 'America/New_York' // Default timezone to prevent ENVIRONMENT_FALLBACK error
  } as any // Type assertion to handle next-intl version compatibility
})