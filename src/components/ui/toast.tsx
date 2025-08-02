'use client'

import { cn } from '@/utils/cn'
import { Toast } from '@/hooks/useToast'

interface ToastComponentProps {
  toast: Toast
  onRemove: () => void
}

export function ToastComponent({ toast, onRemove }: ToastComponentProps) {
  const typeStyles = {
    default: 'bg-white border-gray-200',
    success: 'bg-green-50 border-green-200',
    error: 'bg-red-50 border-red-200',
    warning: 'bg-yellow-50 border-yellow-200',
    info: 'bg-blue-50 border-blue-200'
  }

  const iconMap = {
    default: '📝',
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️'
  }

  return (
    <div
      className={cn(
        'pointer-events-auto w-full max-w-sm rounded-lg border shadow-lg p-4 pr-8',
        typeStyles[toast.type || 'default'],
        'animate-in slide-in-from-top-2 fade-in duration-300'
      )}
    >
      <div className="flex items-start gap-3">
        <span className="text-xl flex-shrink-0">
          {iconMap[toast.type || 'default']}
        </span>
        
        <div className="flex-1">
          <p className={cn(
            'text-sm font-semibold',
            toast.type === 'error' ? 'text-red-900' :
            toast.type === 'warning' ? 'text-yellow-900' :
            toast.type === 'success' ? 'text-green-900' :
            toast.type === 'info' ? 'text-blue-900' :
            'text-gray-900'
          )}>
            {toast.title}
          </p>
          
          {toast.description && (
            <p className={cn(
              'mt-1 text-sm',
              toast.type === 'error' ? 'text-red-700' :
              toast.type === 'warning' ? 'text-yellow-700' :
              toast.type === 'success' ? 'text-green-700' :
              toast.type === 'info' ? 'text-blue-700' :
              'text-gray-600'
            )}>
              {toast.description}
            </p>
          )}
          
          {toast.action && (
            <button
              onClick={toast.action.onClick}
              className={cn(
                'mt-2 text-sm font-medium underline-offset-2 hover:underline',
                toast.type === 'error' ? 'text-red-700' :
                toast.type === 'warning' ? 'text-yellow-700' :
                toast.type === 'success' ? 'text-green-700' :
                toast.type === 'info' ? 'text-blue-700' :
                'text-accent'
              )}
            >
              {toast.action.label}
            </button>
          )}
        </div>
        
        <button
          onClick={onRemove}
          className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  )
}

interface ToastContainerProps {
  toasts: Toast[]
  removeToast: (id: string) => void
}

export function ToastContainer({ toasts, removeToast }: ToastContainerProps) {
  return (
    <div className="fixed bottom-0 right-0 z-50 p-4 space-y-4 pointer-events-none">
      {toasts.map(toast => (
        <ToastComponent
          key={toast.id}
          toast={toast}
          onRemove={() => removeToast(toast.id)}
        />
      ))}
    </div>
  )
}