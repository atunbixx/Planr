import React, { useEffect, useState } from 'react'

/**
 * Hook to handle hydration-safe rendering
 * Prevents hydration mismatches caused by browser extensions
 * that inject DOM attributes during SSR/CSR
 */
export function useHydrationSafe() {
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    // Set hydrated state after component mounts on client
    setIsHydrated(true)
  }, [])

  return isHydrated
}

/**
 * Component wrapper to safely handle hydration
 * Use this for components that might have hydration issues
 */
export function HydrationSafeWrapper({ 
  children, 
  fallback = null 
}: { 
  children: React.ReactNode
  fallback?: React.ReactNode 
}) {
  const isHydrated = useHydrationSafe()

  if (!isHydrated) {
    return fallback
  }

  return <>{children}</>
}