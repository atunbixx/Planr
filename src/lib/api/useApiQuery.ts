"use client"

import { useEffect, useRef, useState } from 'react'
import { api } from './fetcher'

type QueryState<T> = { data?: T; error?: Error; isLoading: boolean }

const cache = new Map<string, any>()

export function useApiQuery<T = any>(key: string, fetcher: () => Promise<T>) {
  const [state, setState] = useState<QueryState<T>>({ isLoading: true })
  const mounted = useRef(true)

  useEffect(() => {
    mounted.current = true
    async function run() {
      try {
        if (cache.has(key)) {
          setState({ data: cache.get(key), isLoading: false })
          return
        }
        const data = await fetcher()
        cache.set(key, data)
        if (mounted.current) setState({ data, isLoading: false })
      } catch (e: any) {
        if (mounted.current) setState({ error: e, isLoading: false })
      }
    }
    run()
    return () => { mounted.current = false }
  }, [key])

  const refetch = async () => {
    try {
      setState(s => ({ ...s, isLoading: true }))
      const data = await fetcher()
      cache.set(key, data)
      if (mounted.current) setState({ data, isLoading: false })
    } catch (e: any) {
      if (mounted.current) setState({ error: e, isLoading: false })
    }
  }

  return { ...state, refetch }
}

export { api }

