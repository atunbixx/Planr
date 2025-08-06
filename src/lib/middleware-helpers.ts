import { prisma } from '@/lib/prisma'

export async function checkUserOnboardingStatus(clerkUserId: string): Promise<boolean> {
  try {
    const user = await prisma.user.findUnique({
      where: { clerk_user_id: clerkUserId },
      include: {
        couple: true
      }
    })

    // User has completed onboarding if they have a couple profile
    return !!(user?.couple)
  } catch (error) {
    console.error('Error checking onboarding status:', error)
    // On error, assume they haven't onboarded to be safe
    return false
  }
}