import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../../lib/prisma'
import { getUser } from '@/lib/auth/server'
import { getLocaleConfig, LOCALE_CONFIGS } from '@/lib/locale'

export async function POST(request: NextRequest) {
  try {
    const supabaseUser = await getUser()
    if (!supabaseUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user already exists
    let user = await prisma.user.findUnique({
      where: { supabaseUserId: supabaseUser.id }
    })

    if (!user) {
      // Detect locale from request headers
      const acceptLanguage = request.headers.get('accept-language')
      const detectedLocale = detectLocaleFromHeader(acceptLanguage)
      const localeConfig = getLocaleConfig(detectedLocale)

      // Create default preferences based on detected locale
      const defaultPreferences = {
        currency: localeConfig.currency,
        alertThreshold: 85,
        emailNotifications: true,
        taskReminders: true,
        budgetAlerts: true,
        vendorUpdates: false,
        timezone: localeConfig.timezone,
        language: localeConfig.language,
        theme: 'default'
      }

      // Create new user with Supabase data and locale preferences
      user = await prisma.user.create({
        data: {
          supabaseUserId: supabaseUser.id,
          email: supabaseUser.email || `${supabaseUser.id}@placeholder.com`,
          firstName: supabaseUser.user_metadata?.first_name || 'User',
          lastName: supabaseUser.user_metadata?.last_name || '',
          phone: supabaseUser.phone || null,
          preferences: defaultPreferences
        }
      })
    }

    // Check if user has completed onboarding (has couple profile)
    let hasCompletedOnboarding = false
    if (user) {
      const couple = await prisma.couple.findFirst({
        where: { userId: user.id }  // Use consistent userId lookup
      })
      hasCompletedOnboarding = !!(couple && couple.onboardingCompleted)
    }

    const response = NextResponse.json({ user, hasCompletedOnboarding })
    
    // Set onboarding cookie if user has completed onboarding
    if (hasCompletedOnboarding) {
      response.cookies.set('onboardingCompleted', 'true', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30, // 30 days
        path: '/'
      })
    }
    
    return response
  } catch (error) {
    console.error('Error initializing user:', error)
    return NextResponse.json(
      { error: 'Failed to initialize user' },
      { status: 500 }
    )
  }
}

/**
 * Detects locale from Accept-Language header
 * Prioritizes Nigerian locale for Nigerian users
 */
function detectLocaleFromHeader(acceptLanguage: string | null): string {
  if (!acceptLanguage) {
    return 'en-US'
  }

  // Parse Accept-Language header (e.g., "en-US,en;q=0.9,es;q=0.8")
  const languages = acceptLanguage
    .split(',')
    .map(lang => {
      const [code, qValue] = lang.trim().split(';')
      return {
        code: code.trim(),
        priority: qValue ? parseFloat(qValue.split('=')[1]) : 1.0
      }
    })
    .sort((a, b) => b.priority - a.priority)

  // Try to find exact match first
  for (const lang of languages) {
    if (LOCALE_CONFIGS[lang.code]) {
      return lang.code
    }
  }

  // Try to find language match (e.g., 'en' for 'en-NZ')
  for (const lang of languages) {
    const languageCode = lang.code.split('-')[0]
    const match = Object.keys(LOCALE_CONFIGS).find(locale => locale.startsWith(languageCode))
    if (match) {
      return match
    }
  }

  // Default fallback - could be Nigeria for Nigerian developers! 🇳🇬
  return 'en-US'
}