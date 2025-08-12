import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  console.log('🔐 Debug Sign In Started')
  
  const { email, password } = await request.json()
  const cookieStore = await cookies()
  
  // Log initial state
  console.log('Initial cookies:', cookieStore.getAll().map(c => c.name))
  
  try {
    // Create Supabase client
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            const value = cookieStore.get(name)?.value
            console.log(`[GET] Cookie ${name}: ${value ? 'exists' : 'missing'}`)
            return value
          },
          set(name: string, value: string, options: any) {
            console.log(`[SET] Cookie ${name} with options:`, options)
            cookieStore.set({ name, value, ...options })
          },
          remove(name: string, options: any) {
            console.log(`[REMOVE] Cookie ${name}`)
            cookieStore.set({ name, value: '', maxAge: 0, ...options })
          },
        },
      }
    )
    
    // Sign in
    console.log('Attempting sign in for:', email)
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    
    if (error) {
      console.error('Sign in error:', error)
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    
    console.log('Sign in successful, user:', data.user?.id)
    
    // Get session to ensure it's set
    const { data: { session } } = await supabase.auth.getSession()
    console.log('Session after sign in:', session ? 'exists' : 'missing')
    
    // Check what cookies were set
    const finalCookies = cookieStore.getAll()
    console.log('Final cookies:', finalCookies.map(c => ({ 
      name: c.name, 
      hasValue: !!c.value,
      length: c.value?.length 
    })))
    
    // Create response
    const response = NextResponse.json({
      success: true,
      user: data.user,
      session: !!session,
      cookies: finalCookies.filter(c => c.name.includes('sb-')).map(c => c.name)
    })
    
    // Manually set cookies on response
    finalCookies.forEach(cookie => {
      if (cookie.name.includes('sb-')) {
        console.log(`Setting cookie on response: ${cookie.name}`)
        response.cookies.set({
          name: cookie.name,
          value: cookie.value,
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          path: '/',
          maxAge: 60 * 60 * 24 * 365 // 1 year
        })
      }
    })
    
    return response
    
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}