"use client"

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { PropsWithChildren, useState } from 'react'

export default function QueryProvider({ children }: PropsWithChildren) {
  const [client] = useState(() => new QueryClient())
  const enableDevtools = process.env.NEXT_PUBLIC_RQ_DEVTOOLS === 'true' || process.env.NODE_ENV !== 'production'
  return (
    <QueryClientProvider client={client}>
      {children}
      {enableDevtools ? <ReactQueryDevtools initialIsOpen={false} /> : null}
    </QueryClientProvider>
  )
}
