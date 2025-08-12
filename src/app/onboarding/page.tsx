import { getCurrentUser } from '@/lib/auth/server'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import OnboardingClient from './OnboardingClient'

export default async function OnboardingPage() {
  const user = await getCurrentUser()
  
  if (!user) {
    redirect('/sign-in')
  }

  // Check if user has completed onboarding
  try {
    // First get the user record
    const userRecord = await prisma.user.findUnique({
      where: { supabase_user_id: user.id }
    })
    
    if (!userRecord) {
      // User doesn't exist in database, proceed with onboarding
      return <OnboardingClient />
    }
    
    // Then check for couple record using consistent userId lookup
    const couple = await prisma.couple.findFirst({
      where: { userId: userRecord.id },
      select: { onboardingCompleted: true }
    })

    if (couple?.onboardingCompleted) {
      redirect('/dashboard')
    }
  } catch (error) {
    // If no couple record exists, that's fine - they need to complete onboarding
    console.log('No couple record found for user, proceeding with onboarding')
  }

  // User is authenticated and needs to complete onboarding
  return <OnboardingClient />
}