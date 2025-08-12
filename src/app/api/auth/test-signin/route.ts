import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

export async function POST(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const formData = await request.json()
  const email = formData.email
  const password = formData.password

  const cookieStore = request.cookies
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.set({ name, value: '', ...options })
        },
      },
    }
  )

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 401 }
    )
  }

  // Get the session to ensure cookies are set
  const { data: { session } } = await supabase.auth.getSession()
  
  // Create response
  const response = NextResponse.json(
    { 
      success: true,
      user: data.user,
      session: !!session,
      redirectTo: '/dashboard'
    },
    { status: 200 }
  )

  // Manually set the cookies from the request cookie store to response
  cookieStore.getAll().forEach((cookie) => {
    if (cookie.name.startsWith('sb-')) {
      response.cookies.set(cookie.name, cookie.value, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
      })
    }
  })

  return response
}