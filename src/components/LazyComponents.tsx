import { lazy } from 'react'

// Lazy load heavy components to reduce initial bundle size
export const DatePicker = lazy(() => import('@/components/ui/DatePicker'))

// Add loading fallbacks for lazy components
export const DatePickerWithFallback = (props: any) => (
  <div className="min-h-[200px] flex items-center justify-center bg-gray-50 rounded-lg">
    <div className="text-center">
      <div className="animate-pulse bg-gray-200 h-8 w-32 mx-auto mb-2 rounded"></div>
      <div className="text-sm text-gray-500">Loading calendar...</div>
    </div>
  </div>
)