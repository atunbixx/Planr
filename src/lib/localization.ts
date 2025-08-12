import { format, formatDistance } from 'date-fns'
import { enUS, es, fr, de, it, pt, ja, zhCN, ar, hi } from 'date-fns/locale'

export type LocaleCode = 'en' | 'es' | 'fr' | 'de' | 'it' | 'pt' | 'ja' | 'zh' | 'ar' | 'hi'

const dateLocales = {
  en: enUS,
  es: es,
  fr: fr,
  de: de,
  it: it,
  pt: pt,
  ja: ja,
  zh: zhCN,
  ar: ar,
  hi: hi
}

export function formatDate(date: Date | string, locale: LocaleCode = 'en', formatStr: string = 'PP'): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return format(dateObj, formatStr, { locale: dateLocales[locale] })
}

export function formatRelativeDate(date: Date | string, locale: LocaleCode = 'en'): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return formatDistance(dateObj, new Date(), { 
    addSuffix: true,
    locale: dateLocales[locale] 
  })
}

export function formatCurrency(
  amount: number, 
  currency: string = 'NGN', 
  locale: LocaleCode = 'en'
): string {
  const localeMap: Record<LocaleCode, string> = {
    en: 'en-US',
    es: 'es-ES',
    fr: 'fr-FR',
    de: 'de-DE',
    it: 'it-IT',
    pt: 'pt-PT',
    ja: 'ja-JP',
    zh: 'zh-CN',
    ar: 'ar-SA',
    hi: 'hi-IN'
  }

  return new Intl.NumberFormat(localeMap[locale], {
    style: 'currency',
    currency: currency
  }).format(amount)
}

export function formatNumber(
  number: number,
  locale: LocaleCode = 'en'
): string {
  const localeMap: Record<LocaleCode, string> = {
    en: 'en-US',
    es: 'es-ES',
    fr: 'fr-FR',
    de: 'de-DE',
    it: 'it-IT',
    pt: 'pt-PT',
    ja: 'ja-JP',
    zh: 'zh-CN',
    ar: 'ar-SA',
    hi: 'hi-IN'
  }

  return new Intl.NumberFormat(localeMap[locale]).format(number)
}

export function getCurrencySymbol(currency: string = 'NGN'): string {
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
  
  return symbols[currency] || currency
}

export function isRTL(locale: LocaleCode): boolean {
  return locale === 'ar'
}