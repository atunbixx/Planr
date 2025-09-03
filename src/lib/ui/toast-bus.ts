"use client"

export type ToastPayload = {
  message: string
  title?: string
  variant?: 'default' | 'success' | 'error' | 'warning'
  action?: { label: string; onClick: () => void }
}

export function emitToast(payload: ToastPayload) {
  if (typeof window === 'undefined') return
  const event = new CustomEvent('app:toast', { detail: payload })
  window.dispatchEvent(event)
}

