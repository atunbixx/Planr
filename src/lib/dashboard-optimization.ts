import { cache } from 'react'
import { useState, useEffect } from 'react'

// Prefetch dashboard data on the server
export const prefetchDashboardData = cache(async (userId: string) => {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/dashboard/stats`, {
      headers: {
        'x-user-id': userId,
      },
      next: {
        revalidate: 300, // Cache for 5 minutes
        tags: [`dashboard-${userId}`],
      },
    })

    if (!response.ok) {
      return null
    }

    return response.json()
  } catch (error) {
    console.error('Failed to prefetch dashboard data:', error)
    return null
  }
})

// Use React Suspense to handle loading states
export const useDashboardData = (userId: string) => {
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false

    async function fetchData() {
      try {
        const response = await fetch('/api/dashboard/stats')
        if (!response.ok) {
          throw new Error('Failed to fetch dashboard stats')
        }

        const result = await response.json()
        if (!cancelled) {
          setData(result.data)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err)
        }
      }
    }

    fetchData()

    return () => {
      cancelled = true
    }
  }, [userId])

  return { data, error }
}

// Optimize image loading with lazy loading
export const optimizeImageLoading = (imageUrl: string, options?: {
  width?: number
  height?: number
  quality?: number
}) => {
  const params = new URLSearchParams()
  
  if (options?.width) params.append('w', options.width.toString())
  if (options?.height) params.append('h', options.height.toString())
  if (options?.quality) params.append('q', options.quality.toString())
  
  // If using Cloudinary or similar, append transformation params
  if (imageUrl.includes('cloudinary.com')) {
    const transformations = []
    if (options?.width) transformations.push(`w_${options.width}`)
    if (options?.height) transformations.push(`h_${options.height}`)
    if (options?.quality) transformations.push(`q_${options.quality}`)
    
    const parts = imageUrl.split('/upload/')
    if (parts.length === 2) {
      return `${parts[0]}/upload/${transformations.join(',')}/f_auto/${parts[1]}`
    }
  }
  
  return imageUrl
}

// Debounce function for search and filtering
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null
      func(...args)
    }
    
    if (timeout) {
      clearTimeout(timeout)
    }
    
    timeout = setTimeout(later, wait)
  }
}

// Throttle function for scroll events
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false
  
  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => {
        inThrottle = false
      }, limit)
    }
  }
}

// Virtual scrolling helper for large lists
export const useVirtualScroll = (items: any[], itemHeight: number, containerHeight: number) => {
  const [scrollTop, setScrollTop] = useState(0)
  
  const startIndex = Math.floor(scrollTop / itemHeight)
  const endIndex = Math.min(
    items.length - 1,
    Math.floor((scrollTop + containerHeight) / itemHeight)
  )
  
  const visibleItems = items.slice(startIndex, endIndex + 1)
  
  const totalHeight = items.length * itemHeight
  const offsetY = startIndex * itemHeight
  
  return {
    visibleItems,
    totalHeight,
    offsetY,
    onScroll: (e: React.UIEvent<HTMLDivElement>) => {
      setScrollTop(e.currentTarget.scrollTop)
    },
  }
}

// Batch API calls for better performance
export class BatchAPIClient {
  private queue: Map<string, { resolve: Function; reject: Function }[]> = new Map()
  private timer: NodeJS.Timeout | null = null
  private batchDelay = 50 // ms

  async fetch(endpoint: string): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.queue.has(endpoint)) {
        this.queue.set(endpoint, [])
      }
      
      this.queue.get(endpoint)!.push({ resolve, reject })
      
      if (!this.timer) {
        this.timer = setTimeout(() => this.flush(), this.batchDelay)
      }
    })
  }

  private async flush() {
    const batch = Array.from(this.queue.entries())
    this.queue.clear()
    this.timer = null

    try {
      const responses = await Promise.all(
        batch.map(([endpoint]) => 
          fetch(endpoint).then(res => res.json())
        )
      )

      batch.forEach(([endpoint, callbacks], index) => {
        callbacks.forEach(({ resolve }) => resolve(responses[index]))
      })
    } catch (error) {
      batch.forEach(([_, callbacks]) => {
        callbacks.forEach(({ reject }) => reject(error))
      })
    }
  }
}

// Export a singleton instance
export const batchAPI = new BatchAPIClient()