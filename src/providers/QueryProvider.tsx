"use client"

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools, ReactQueryDevtoolsPanel } from '@tanstack/react-query-devtools'
import { PropsWithChildren, useState } from 'react'

export default function QueryProvider({ children }: PropsWithChildren) {
  const [client] = useState(() => new QueryClient())
  const enableDevtools = process.env.NEXT_PUBLIC_RQ_DEVTOOLS === 'true' || process.env.NODE_ENV !== 'production'
  const [devtoolsOpen, setDevtoolsOpen] = useState(false)
  return (
    <QueryClientProvider client={client}>
      {children}
      {enableDevtools && (
        <>
          {/* Tiny toggle button for DevTools (dev only) */}
          <button
            type="button"
            onClick={() => setDevtoolsOpen((v) => !v)}
            className="fixed bottom-4 left-4 z-[9998] rounded-full bg-[hsl(var(--primary))] text-white text-xs px-3 py-2 shadow-md hover:brightness-95"
            aria-label="Toggle React Query DevTools"
          >
            RQ
          </button>
          {devtoolsOpen ? (
            <div className="fixed left-0 right-0 bottom-0 z-[9999] bg-white dark:bg-dark-2 border-t border-[#E5E7EB] dark:border-dark-3">
              <ReactQueryDevtoolsPanel setIsOpen={setDevtoolsOpen as any} style={{ height: '40vh' }} position="bottom" />
            </div>
          ) : (
            <ReactQueryDevtools initialIsOpen={false} />
          )}
        </>
      )}
    </QueryClientProvider>
  )
}
