"use client"

import { useEffect, useRef, useState } from 'react'

export type ApiQueryState<T> = {
  data?: T
  error?: string
  loading: boolean
  refetch: () => void
}

export function useApiQuery<T>(key: string, fetcher: () => Promise<T>): ApiQueryState<T> & { isLoading: boolean } {
  const [data, setData] = useState<T | undefined>(undefined)
  const [error, setError] = useState<string | undefined>(undefined)
  const [loading, setLoading] = useState<boolean>(true)
  const ref = useRef(0)

  const load = async () => {
    const seq = ++ref.current
    setLoading(true)
    setError(undefined)
    try {
      const result = await fetcher()
      // drop outdated responses
      if (seq === ref.current) {
        setData(result)
      }
    } catch (e: any) {
      if (seq === ref.current) {
        setError(e?.message || 'Request failed')
      }
    } finally {
      if (seq === ref.current) setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  return { data, error, loading, isLoading: loading, refetch: load }
}
