import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const dbUser = await prisma.user.findUnique({
      where: { supabase_user_id: user.id }
    });

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Find the couple associated with this user
    const couple = await prisma.couple.findFirst({
      where: {
        OR: [
          { partner1_user_id: dbUser.id },
          { partner2_user_id: dbUser.id },
          { userId: dbUser.id }
        ]
      }
    });

    const hasCompletedOnboarding = couple?.onboardingCompleted || false;

    return NextResponse.json({ 
      hasCompletedOnboarding,
      hasWeddingProfile: hasCompletedOnboarding 
    });
  } catch (error) {
    console.error('Error checking onboarding status:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}