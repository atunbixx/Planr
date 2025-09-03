"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ToastPayload } from '@/lib/ui/toast-bus'

type ToastAction = { label: string; onClick: () => void }
type Toast = { id: number; title?: string; message: string; variant?: 'default'|'success'|'error'|'warning'; action?: ToastAction };

type ToastContextValue = {
  notify: (message: string, opts?: Partial<Omit<Toast,'id'|'message'>>) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const notify = useCallback((message: string, opts?: Partial<Omit<Toast,'id'|'message'>>) => {
    const id = Date.now() + Math.floor(Math.random() * 1000)
    const toast: Toast = { id, message, title: opts?.title, variant: opts?.variant || 'default', action: opts?.action }
    setToasts(prev => [...prev, toast])
    // auto dismiss after 3.5s
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500)
  }, [])

  const value = useMemo(() => ({ notify }), [notify])

  return (
    <ToastContext.Provider value={value}>
      {children}
      {/* Listen for global toast events */}
      <ToastEventBridge onNotify={notify} />
      {/* Container */}
      <div className="fixed z-[9999] bottom-4 right-4 space-y-2 pointer-events-none">
        {toasts.map(t => (
          <div
            key={t.id}
            className={[
              'pointer-events-auto w-80 rounded-md shadow-lg px-4 py-3 text-sm text-white',
              t.variant === 'success' ? 'bg-emerald-600' :
              t.variant === 'error' ? 'bg-rose-600' :
              t.variant === 'warning' ? 'bg-amber-600' : 'bg-gray-800'
            ].join(' ')}
            role="status"
            aria-live="polite"
          >
            {t.title && <div className="font-semibold mb-0.5">{t.title}</div>}
            <div className="flex items-center justify-between gap-2">
              <div className="pr-2">{t.message}</div>
              {t.action && (
                <button
                  onClick={(e) => { e.stopPropagation(); t.action?.onClick?.() }}
                  className="px-2 py-1 rounded bg-white/20 hover:bg-white/30 text-white text-xs"
                >
                  {t.action.label}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

function ToastEventBridge({ onNotify }: { onNotify: (message: string, opts?: any) => void }) {
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<ToastPayload>).detail
      if (!detail) return
      onNotify(detail.message, { title: detail.title, variant: detail.variant, action: detail.action })
    }
    if (typeof window !== 'undefined') {
      window.addEventListener('app:toast', handler as any)
      return () => window.removeEventListener('app:toast', handler as any)
    }
  }, [onNotify])
  return null
}
