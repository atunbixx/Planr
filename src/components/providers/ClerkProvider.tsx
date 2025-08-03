'use client'

import { ClerkProvider as BaseClerkProvider } from '@clerk/nextjs'
import { ReactNode } from 'react'

interface ClerkProviderProps {
  children: ReactNode
}

export function ClerkProvider({ children }: ClerkProviderProps) {
  return (
    <BaseClerkProvider
      publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY!}
      appearance={{
        baseTheme: undefined,
        variables: {
          colorPrimary: '#8B5CF6',
          colorBackground: '#ffffff',
          colorInputBackground: '#ffffff',
          colorInputText: '#1f2937',
        },
        elements: {
          formButtonPrimary: 'bg-purple-600 hover:bg-purple-700 text-white',
          card: 'shadow-lg',
          headerTitle: 'text-purple-600',
          headerSubtitle: 'text-gray-600',
        }
      }}
    >
      {children}
    </BaseClerkProvider>
  )
}