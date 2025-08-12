import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

export async function GET(request: NextRequest) {
  // Log all cookies
  console.log('All cookies:', request.cookies.getAll())
  
  // Create Supabase client with proper cookie handling
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          const value = request.cookies.get(name)?.value
          console.log(`Getting cookie ${name}:`, value)
          return value
        },
        set(name: string, value: string, options: CookieOptions) {
          console.log(`Setting cookie ${name}:`, value, options)
        },
        remove(name: string, options: CookieOptions) {
          console.log(`Removing cookie ${name}:`, options)
        },
      },
    }
  )
  
  // Try to get the user
  const { data: { user }, error } = await supabase.auth.getUser()
  
  console.log('User result:', { user, error })
  
  // Try to get the session
  const { data: { session }, error: sessionError } = await supabase.auth.getSession()
  
  console.log('Session result:', { session, sessionError })
  
  return NextResponse.json({
    cookies: request.cookies.getAll(),
    user: user ? { id: user.id, email: user.email } : null,
    session: session ? { expires: session.expires_at } : null,
    error: error?.message || sessionError?.message,
    env: {
      hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    }
  })
}