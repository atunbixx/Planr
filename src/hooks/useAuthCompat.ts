'use client'

import { useUser, useClerk } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'

// Compatibility hook that provides the old useAuth interface using Clerk
export function useAuth() {
  const { user: clerkUser, isLoaded } = useUser()
  const { signOut: clerkSignOut } = useClerk()
  const router = useRouter()

  // Convert Clerk user to the format expected by the old components
  const user = clerkUser ? {
    id: clerkUser.id,
    email: clerkUser.emailAddresses[0]?.emailAddress || '',
    user_metadata: {
      first_name: clerkUser.firstName,
      last_name: clerkUser.lastName,
    }
  } : null

  // Mock couple data for now - in a real app you'd fetch this from your database
  const couple = user ? {
    id: 'temp-couple-id',
    partner1_name: clerkUser?.firstName || 'Partner 1',
    partner2_name: 'Partner 2',
    wedding_date: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(),
    wedding_style: 'modern',
    guest_count_estimate: 100,
    budget_total: 30000,
    venue_name: 'TBD',
    venue_location: 'TBD'
  } : null

  const signOut = async () => {
    await clerkSignOut()
    router.push('/')
  }

  const signIn = async (email: string, password: string) => {
    // Redirect to Clerk sign-in page
    router.push('/sign-in')
    return { error: null }
  }

  const createCouple = async (coupleData: any) => {
    // Mock implementation - in a real app you'd save to your database
    console.log('Creating couple:', coupleData)
    return { error: null }
  }

  const refreshSession = async () => {
    // Clerk handles session refresh automatically
    return { error: null }
  }

  return {
    user,
    couple,
    loading: !isLoaded,
    error: null,
    signIn,
    signOut,
    createCouple,
    refreshSession
  }
}