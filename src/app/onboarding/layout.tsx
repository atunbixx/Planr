import { redirect } from 'next/navigation'
import { getAuthUser } from '@/lib/auth'
import { getOnboardingState, trackOnboardingEvent } from '@/lib/onboarding'

export default async function OnboardingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getAuthUser()
  
  if (!user) {
    redirect('/sign-in?next=/onboarding')
  }
  
  // Get onboarding state
  const state = await getOnboardingState(user.id)
  
  // If onboarding is complete, redirect to dashboard
  if (state.done) {
    redirect('/dashboard')
  }
  
  // Track that user is in onboarding
  trackOnboardingEvent('ob_resumed', {
    userId: user.id,
    lastStep: state.lastStep,
    stepsCompleted: state.stepsCompleted.length
  })
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 to-purple-50">
      {children}
    </div>
  )
}