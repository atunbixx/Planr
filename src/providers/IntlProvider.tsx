'use client'

import { NextIntlClientProvider } from 'next-intl'
import { ReactNode, useEffect, useState } from 'react'
import { useSupabaseAuth } from '@/lib/auth/client'
import { useLocale } from './LocaleProvider'

interface IntlProviderProps {
  children: ReactNode
  locale?: string
  messages?: any
}

export function IntlProvider({ children, locale: initialLocale = 'en', messages: initialMessages }: IntlProviderProps) {
  const { getUser, getSession } = useSupabaseAuth()
  const { localeConfig } = useLocale()
  const [locale, setLocale] = useState(localeConfig?.language || initialLocale)
  const [messages, setMessages] = useState(initialMessages)
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)
  const [isSignedIn, setIsSignedIn] = useState(false)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const session = await getSession()
        if (session?.user) {
          const currentUser = await getUser()
          setUser(currentUser)
          setIsSignedIn(true)
        } else {
          setUser(null)
          setIsSignedIn(false)
        }
      } catch (error) {
        // AuthSessionMissingError is expected when no user is signed in
        setUser(null)
        setIsSignedIn(false)
      }
    }
    
    checkAuth()
  }, [])

  useEffect(() => {
    const loadMessages = async () => {
      const targetLocale = localeConfig?.language || 'en'
      
      if (targetLocale !== locale) {
        try {
          const messages = await import(`@/messages/${targetLocale}.json`)
          setLocale(targetLocale)
          setMessages(messages.default)
        } catch (importError) {
          console.error(`Error loading messages for locale ${targetLocale}:`, importError)
          // Fallback to English
          setLocale('en')
          setMessages(initialMessages)
        }
      }
      setLoading(false)
    }

    if (localeConfig) {
      loadMessages()
    } else {
      setLoading(false)
    }
  }, [localeConfig, locale, initialMessages])

  // Set loading to false after auth check
  useEffect(() => {
    if (user !== null || !isSignedIn) {
      setLoading(false)
    }
  }, [user, isSignedIn])

  // Always provide the provider, even if loading
  // Use fallback messages if none are loaded
  const fallbackMessages = messages || initialMessages || {}

  return (
    <NextIntlClientProvider locale={locale} messages={fallbackMessages}>
      {children}
    </NextIntlClientProvider>
  )
}