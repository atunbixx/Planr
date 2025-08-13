import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { CoupleRepository } from '@/lib/repositories/CoupleRepository'
import { getOnboardingState } from '@/lib/onboarding'

const coupleRepository = new CoupleRepository()

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check onboarding progress
    const onboardingState = await getOnboardingState(user.id)
    
    // Find the couple associated with this user using repository
    const couple = await coupleRepository.findByUserId(user.id);

    const hasCompletedOnboarding = onboardingState.done && (couple?.onboardingCompleted || false);

    return NextResponse.json({ 
      hasCompletedOnboarding,
      hasWeddingProfile: hasCompletedOnboarding,
      onboardingProgress: {
        done: onboardingState.done,
        lastStep: onboardingState.lastStep,
        stepsCompleted: onboardingState.stepsCompleted
      }
    });
  } catch (error) {
    console.error('Error checking onboarding status:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}