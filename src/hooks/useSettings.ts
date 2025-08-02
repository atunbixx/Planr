'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { useToastContext } from '@/contexts/ToastContext'

export interface UserSettings {
  id?: string
  user_id: string
  couple_id?: string
  
  // Localization
  country_code: string
  region?: string
  timezone: string
  language: string
  currency: string
  date_format: string
  time_format: string
  
  // Display
  theme: string
  accent_color: string
  font_size: string
  compact_mode: boolean
  animations_enabled: boolean
  
  // Notifications
  email_notifications: boolean
  email_frequency: string
  push_notifications: boolean
  sms_notifications: boolean
  notify_rsvp_updates: boolean
  notify_payment_reminders: boolean
  notify_task_deadlines: boolean
  notify_vendor_messages: boolean
  notify_guest_messages: boolean
  notify_milestone_reminders: boolean
  
  // Privacy
  profile_visibility: string
  show_budget_to_vendors: boolean
  allow_guest_photos: boolean
  allow_vendor_contact: boolean
  
  // Wedding preferences
  wedding_style?: string
  wedding_season?: string
  guest_count_estimate?: number
  budget_visibility: string
  
  // Data and export
  auto_backup: boolean
  backup_frequency: string
  export_format: string
  
  // Accessibility
  high_contrast: boolean
  reduce_motion: boolean
  screen_reader_optimized: boolean
  keyboard_shortcuts: boolean
  
  // Advanced
  developer_mode: boolean
  beta_features: boolean
  analytics_enabled: boolean
  crash_reporting: boolean
  
  // Metadata
  onboarding_completed: boolean
  onboarding_step: number
  last_updated?: string
  created_at?: string
}

export interface RegionDefaults {
  country_code: string
  country_name: string
  currency: string
  date_format: string
  time_format: string
  week_starts_on: string
  default_timezone: string
  phone_format?: string
  address_format?: any
  common_languages?: string[]
  wedding_seasons?: string[]
  popular_traditions?: string[]
  vendor_categories?: string[]
}

export interface ThemeDefinition {
  theme_name: string
  display_name: string
  description?: string
  is_premium: boolean
  colors: {
    primary: string
    secondary: string
    accent: string
    background: string
    surface: string
  }
  fonts?: any
  preview_image_url?: string
}

export const AVAILABLE_LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'it', name: 'Italiano', flag: '🇮🇹' },
  { code: 'pt', name: 'Português', flag: '🇵🇹' },
  { code: 'ja', name: '日本語', flag: '🇯🇵' },
  { code: 'zh', name: '中文', flag: '🇨🇳' },
  { code: 'ko', name: '한국어', flag: '🇰🇷' },
  { code: 'ar', name: 'العربية', flag: '🇸🇦' },
  { code: 'hi', name: 'हिंदी', flag: '🇮🇳' },
  { code: 'ru', name: 'Русский', flag: '🇷🇺' }
]

export const CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'BRL', symbol: 'R$', name: 'Brazilian Real' },
  { code: 'MXN', symbol: '$', name: 'Mexican Peso' },
  { code: 'ZAR', symbol: 'R', name: 'South African Rand' },
  { code: 'NGN', symbol: '₦', name: 'Nigerian Naira' },
  { code: 'KES', symbol: 'KSh', name: 'Kenyan Shilling' },
  { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar' },
  { code: 'NZD', symbol: 'NZ$', name: 'New Zealand Dollar' }
]

export const DATE_FORMATS = [
  { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY (12/31/2024)' },
  { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY (31/12/2024)' },
  { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD (2024-12-31)' },
  { value: 'DD.MM.YYYY', label: 'DD.MM.YYYY (31.12.2024)' },
  { value: 'YYYY/MM/DD', label: 'YYYY/MM/DD (2024/12/31)' }
]

export const TIME_FORMATS = [
  { value: '12h', label: '12-hour (3:30 PM)' },
  { value: '24h', label: '24-hour (15:30)' }
]

export const FONT_SIZES = [
  { value: 'small', label: 'Small' },
  { value: 'medium', label: 'Medium' },
  { value: 'large', label: 'Large' },
  { value: 'extra-large', label: 'Extra Large' }
]

export function useSettings() {
  const { user, couple } = useAuth()
  const { addToast } = useToastContext()
  const [settings, setSettings] = useState<UserSettings | null>(null)
  const [regionDefaults, setRegionDefaults] = useState<RegionDefaults[]>([])
  const [themes, setThemes] = useState<ThemeDefinition[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Detect user's location based on timezone
  const detectUserLocation = useCallback(() => {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
    const locale = navigator.language || 'en-US'
    
    // Map common timezones to country codes
    const timezoneToCountry: Record<string, string> = {
      'America/New_York': 'US',
      'America/Chicago': 'US',
      'America/Los_Angeles': 'US',
      'Europe/London': 'GB',
      'Europe/Paris': 'FR',
      'Europe/Berlin': 'DE',
      'Europe/Madrid': 'ES',
      'Europe/Rome': 'IT',
      'Asia/Tokyo': 'JP',
      'Asia/Shanghai': 'CN',
      'Asia/Kolkata': 'IN',
      'America/Toronto': 'CA',
      'America/Mexico_City': 'MX',
      'America/Sao_Paulo': 'BR',
      'Australia/Sydney': 'AU',
      'Africa/Johannesburg': 'ZA',
      'Africa/Lagos': 'NG',
      'Africa/Nairobi': 'KE',
      'Asia/Dubai': 'AE',
      'Asia/Singapore': 'SG',
      'Pacific/Auckland': 'NZ',
      'Europe/Dublin': 'IE'
    }

    // Extract country code from locale (e.g., en-US -> US)
    const localeCountry = locale.split('-')[1]?.toUpperCase()
    
    // Try timezone mapping first, then locale, then default to US
    const detectedCountry = timezoneToCountry[timezone] || localeCountry || 'US'
    
    return { timezone, locale, country: detectedCountry }
  }, [])

  // Load settings and defaults
  const loadSettings = useCallback(async () => {
    if (!user?.id) return

    try {
      setLoading(true)

      // Load user settings
      const { data: settingsData, error: settingsError } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (settingsError && settingsError.code !== 'PGRST116') {
        throw settingsError
      }

      // If no settings exist, create them with detected location
      if (!settingsData) {
        const detected = detectUserLocation()
        const { data: newSettings, error: createError } = await supabase
          .rpc('initialize_user_settings', {
            p_user_id: user.id,
            p_country_code: detected.country
          })

        if (createError) throw createError

        // Fetch the newly created settings
        const { data: createdSettings, error: fetchError } = await supabase
          .from('user_settings')
          .select('*')
          .eq('user_id', user.id)
          .single()

        if (fetchError) throw fetchError
        
        // If we have a couple, get the wedding preferences
        let weddingData = {}
        if (couple?.id) {
          const { data: coupleData, error: coupleError } = await supabase
            .from('couples')
            .select('wedding_style, guest_count')
            .eq('id', couple.id)
            .single()
          
          if (!coupleError && coupleData) {
            weddingData = {
              wedding_style: coupleData.wedding_style,
              guest_count_estimate: coupleData.guest_count
            }
          }
        }
        
        setSettings({
          ...createdSettings,
          ...weddingData,
          timezone: detected.timezone, // Use detected timezone
          couple_id: couple?.id
        })
      } else {
        // Settings exist, check if we need to sync couple data
        let weddingData = {}
        if (couple?.id && (!settingsData.couple_id || settingsData.couple_id !== couple.id)) {
          const { data: coupleData, error: coupleError } = await supabase
            .from('couples')
            .select('wedding_style, guest_count')
            .eq('id', couple.id)
            .single()
          
          if (!coupleError && coupleData) {
            weddingData = {
              wedding_style: coupleData.wedding_style,
              guest_count_estimate: coupleData.guest_count,
              couple_id: couple.id
            }
            
            // Update settings with couple data
            await supabase
              .from('user_settings')
              .update(weddingData)
              .eq('user_id', user.id)
          }
        }
        
        setSettings({
          ...settingsData,
          ...weddingData,
          couple_id: couple?.id
        })
      }

      // Load region defaults
      const { data: regionsData, error: regionsError } = await supabase
        .from('region_defaults')
        .select('*')
        .order('country_name')

      if (regionsError) throw regionsError
      setRegionDefaults(regionsData || [])

      // Load theme definitions
      const { data: themesData, error: themesError } = await supabase
        .from('theme_definitions')
        .select('*')
        .order('display_name')

      if (themesError) throw themesError
      setThemes(themesData || [])

    } catch (error: any) {
      console.error('Error loading settings:', error)
      addToast({
        title: 'Error',
        description: 'Failed to load settings',
        type: 'error'
      })
    } finally {
      setLoading(false)
    }
  }, [user?.id, couple?.id, detectUserLocation, addToast])

  // Load settings on mount
  useEffect(() => {
    loadSettings()
  }, [loadSettings])

  // Update settings
  const updateSettings = useCallback(async (updates: Partial<UserSettings>) => {
    if (!user?.id || !settings) return

    setSaving(true)
    try {
      const { error } = await supabase
        .from('user_settings')
        .update({
          ...updates,
          last_updated: new Date().toISOString()
        })
        .eq('user_id', user.id)

      if (error) throw error

      setSettings(prev => prev ? { ...prev, ...updates } : prev)
      
      addToast({
        title: 'Success',
        description: 'Settings updated successfully',
        type: 'success'
      })

      // Apply theme if it was changed
      if (updates.theme) {
        applyTheme(updates.theme)
      }

    } catch (error: any) {
      console.error('Error updating settings:', error)
      addToast({
        title: 'Error',
        description: 'Failed to update settings',
        type: 'error'
      })
    } finally {
      setSaving(false)
    }
  }, [user?.id, settings, addToast])

  // Apply theme to the document
  const applyTheme = useCallback((themeName: string) => {
    const theme = themes.find(t => t.theme_name === themeName)
    if (!theme) return

    const root = document.documentElement
    root.setAttribute('data-theme', themeName)
    
    // Apply theme colors as CSS variables
    Object.entries(theme.colors).forEach(([key, value]) => {
      root.style.setProperty(`--color-${key}`, value)
    })
  }, [themes])

  // Apply settings on load
  useEffect(() => {
    if (settings) {
      // Apply theme
      applyTheme(settings.theme)
      
      // Apply font size
      document.documentElement.setAttribute('data-font-size', settings.font_size)
      
      // Apply other visual settings
      if (settings.high_contrast) {
        document.documentElement.classList.add('high-contrast')
      }
      if (settings.reduce_motion) {
        document.documentElement.classList.add('reduce-motion')
      }
      if (settings.compact_mode) {
        document.documentElement.classList.add('compact-mode')
      }
    }
  }, [settings, applyTheme])

  // Format date according to user's preference
  const formatDate = useCallback((date: Date | string) => {
    if (!settings) return new Date(date).toLocaleDateString()
    
    const d = new Date(date)
    const formats: Record<string, string> = {
      'MM/DD/YYYY': `${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getDate().toString().padStart(2, '0')}/${d.getFullYear()}`,
      'DD/MM/YYYY': `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`,
      'YYYY-MM-DD': `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`,
      'DD.MM.YYYY': `${d.getDate().toString().padStart(2, '0')}.${(d.getMonth() + 1).toString().padStart(2, '0')}.${d.getFullYear()}`,
      'YYYY/MM/DD': `${d.getFullYear()}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getDate().toString().padStart(2, '0')}`
    }
    
    return formats[settings.date_format] || d.toLocaleDateString()
  }, [settings])

  // Format time according to user's preference
  const formatTime = useCallback((date: Date | string) => {
    if (!settings) return new Date(date).toLocaleTimeString()
    
    const d = new Date(date)
    if (settings.time_format === '24h') {
      return d.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' })
    } else {
      return d.toLocaleTimeString('en-US', { hour12: true, hour: 'numeric', minute: '2-digit' })
    }
  }, [settings])

  // Format currency according to user's preference
  const formatCurrency = useCallback((amount: number) => {
    if (!settings) return `$${amount.toFixed(2)}`
    
    const currency = CURRENCIES.find(c => c.code === settings.currency)
    if (!currency) return `$${amount.toFixed(2)}`
    
    return `${currency.symbol}${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }, [settings])

  return {
    settings,
    regionDefaults,
    themes,
    loading,
    saving,
    updateSettings,
    formatDate,
    formatTime,
    formatCurrency,
    detectUserLocation,
    refresh: loadSettings
  }
}