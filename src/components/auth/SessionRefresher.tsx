'use client'

import { useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'

export function SessionRefresher() {
  const { refreshSession } = useAuth()

  useEffect(() => {
    // Refresh session on mount
    refreshSession()

    // Set up interval to refresh session every 30 minutes
    const interval = setInterval(() => {
      refreshSession()
    }, 30 * 60 * 1000) // 30 minutes

    // Also refresh on window focus
    const handleFocus = () => {
      refreshSession()
    }

    window.addEventListener('focus', handleFocus)

    return () => {
      clearInterval(interval)
      window.removeEventListener('focus', handleFocus)
    }
  }, [refreshSession])

  return null
}