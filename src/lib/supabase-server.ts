import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { Database } from '@/types/database'
import { NextResponse } from 'next/server'

// Create a Supabase client for server-side operations
export function createServerClient() {
  const cookieStore = cookies()
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  return createClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value
      },
    },
  })
}

// Auth middleware for API routes
export async function requireAuth() {
  const supabase = createServerClient()
  
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    return {
      user: null,
      error: NextResponse.json(
        { error: 'Unauthorized - Please sign in' },
        { status: 401 }
      )
    }
  }
  
  return { user, error: null }
}

// Get authenticated user's couple information
export async function getAuthenticatedCouple() {
  const { user, error: authError } = await requireAuth()
  
  if (authError) {
    return { couple: null, error: authError }
  }
  
  const supabase = createServerClient()
  
  const { data: couple, error } = await supabase
    .from('couples')
    .select('*')
    .or(`partner1_user_id.eq.${user!.id},partner2_user_id.eq.${user!.id}`)
    .single()
  
  if (error && error.code !== 'PGRST116') {
    return {
      couple: null,
      error: NextResponse.json(
        { error: 'Failed to fetch couple information' },
        { status: 500 }
      )
    }
  }
  
  return { couple, error: null }
}

// Standard error response helper
export function createErrorResponse(message: string, status: number = 400) {
  return NextResponse.json({ error: message }, { status })
}

// Standard success response helper
export function createSuccessResponse<T>(data: T, message?: string) {
  return NextResponse.json({
    success: true,
    message,
    data
  })
}