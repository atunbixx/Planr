'use client'

import { useState, useCallback, useEffect } from 'react'

export interface Toast {
  id: string
  title: string
  description?: string
  type?: 'default' | 'success' | 'error' | 'warning' | 'info'
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
}

interface ToastContextValue {
  toasts: Toast[]
  addToast: (toast: Omit<Toast, 'id'>) => string
  removeToast: (id: string) => void
  clearToasts: () => void
}

const DEFAULT_DURATION = 4000

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([])

  // Auto-remove toasts after duration
  useEffect(() => {
    const timers = toasts.map(toast => {
      if (toast.duration !== 0) {
        return setTimeout(() => {
          removeToast(toast.id)
        }, toast.duration || DEFAULT_DURATION)
      }
      return null
    })

    return () => {
      timers.forEach(timer => {
        if (timer) clearTimeout(timer)
      })
    }
  }, [toasts])

  const addToast = useCallback((toast: Omit<Toast, 'id'>): string => {
    const id = Math.random().toString(36).substring(2, 9)
    const newToast: Toast = {
      ...toast,
      id,
      duration: toast.duration !== undefined ? toast.duration : DEFAULT_DURATION
    }

    setToasts(prev => [...prev, newToast])
    return id
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }, [])

  const clearToasts = useCallback(() => {
    setToasts([])
  }, [])

  return {
    toasts,
    addToast,
    removeToast,
    clearToasts
  }
}

// Helper functions for common toast types
export const toast = {
  success: (title: string, description?: string) => ({
    title,
    description,
    type: 'success' as const
  }),
  error: (title: string, description?: string) => ({
    title,
    description,
    type: 'error' as const
  }),
  warning: (title: string, description?: string) => ({
    title,
    description,
    type: 'warning' as const
  }),
  info: (title: string, description?: string) => ({
    title,
    description,
    type: 'info' as const
  })
}