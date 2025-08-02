import { NextRequest } from 'next/server'
import { createServerClient, requireAuth, createErrorResponse, createSuccessResponse } from '@/lib/supabase-server'
import { UserSettings } from '@/types/settings'

// GET /api/settings - Fetch user settings
export async function GET(request: NextRequest) {
  try {
    // Require authentication
    const { user, error: authError } = await requireAuth()
    if (authError) return authError

    const supabase = createServerClient()

    // Get user settings from database
    const { data: settings, error: settingsError } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', user!.id)
      .single()

    if (settingsError && settingsError.code !== 'PGRST116') {
      console.error('Error fetching settings:', settingsError)
      return createErrorResponse('Failed to fetch settings', 500)
    }

    // If no settings exist, initialize them
    if (!settings) {
      const { data: newSettings, error: initError } = await supabase
        .rpc('initialize_user_settings', {
          p_user_id: user!.id,
          p_country_code: 'US' // Default to US, could be detected from IP
        })

      if (initError) {
        console.error('Error initializing settings:', initError)
        return createErrorResponse('Failed to initialize settings', 500)
      }

      // Fetch the newly created settings
      const { data: freshSettings, error: fetchError } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user!.id)
        .single()

      if (fetchError) {
        return createErrorResponse('Failed to fetch initialized settings', 500)
      }

      return createSuccessResponse(transformSettingsResponse(freshSettings))
    }

    // Get user profile information
    const { data: userProfile } = await supabase.auth.getUser()

    // Transform database settings to match frontend expectations
    const userSettings: UserSettings = transformSettingsResponse(settings, userProfile.user)

    return createSuccessResponse(userSettings)
  } catch (error) {
    console.error('Settings API error:', error)
    return createErrorResponse('Internal server error', 500)
  }
}

// Transform database settings to frontend format
function transformSettingsResponse(dbSettings: any, authUser?: any): UserSettings {
  return {
    profile: {
      fullName: authUser?.user_metadata?.full_name || '',
      email: authUser?.email || '',
      weddingDate: dbSettings.wedding_date || undefined,
      partnerName: dbSettings.partner_name || undefined,
      venue: dbSettings.venue || undefined,
      guestCount: dbSettings.guest_count_estimate?.toString() || undefined,
      avatarUrl: authUser?.user_metadata?.avatar_url || undefined
    },
    notifications: {
      emailUpdates: dbSettings.email_notifications ?? true,
      taskReminders: dbSettings.notify_task_deadlines ?? true,
      vendorMessages: dbSettings.notify_vendor_messages ?? true,
      guestRsvpAlerts: dbSettings.notify_rsvp_updates ?? true,
      budgetAlerts: dbSettings.notify_payment_reminders ?? true,
      dailyDigest: dbSettings.email_frequency === 'daily',
      weeklyReport: dbSettings.email_frequency === 'weekly'
    },
    theme: {
      colorScheme: mapThemeToColorScheme(dbSettings.theme || 'light'),
      fontSize: dbSettings.font_size || 'medium',
      compactMode: dbSettings.compact_mode ?? false
    },
    privacy: {
      profileVisibility: dbSettings.profile_visibility || 'private',
      shareWithVendors: dbSettings.show_budget_to_vendors ?? false,
      allowGuestUploads: dbSettings.allow_guest_photos ?? true,
      dataExport: dbSettings.export_format ? true : false
    }
  }
}

// Map database theme to frontend color scheme
function mapThemeToColorScheme(theme: string): 'wedding-blush' | 'wedding-sage' | 'wedding-cream' | 'wedding-navy' {
  const themeMap: Record<string, 'wedding-blush' | 'wedding-sage' | 'wedding-cream' | 'wedding-navy'> = {
    'rose': 'wedding-blush',
    'sage': 'wedding-sage',
    'light': 'wedding-cream',
    'dark': 'wedding-navy',
    'lavender': 'wedding-blush',
    'coral': 'wedding-blush'
  }
  
  return themeMap[theme] || 'wedding-cream'
}