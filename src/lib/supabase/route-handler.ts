import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'

export const createRouteHandlerClient = (request: NextRequest, response: NextResponse) => {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          // Set cookie on the response
          response.cookies.set({
            name,
            value,
            ...options,
            // Ensure proper cookie settings for auth
            sameSite: 'lax' as const,
            path: '/',
            secure: process.env.NODE_ENV === 'production',
          })
        },
        remove(name: string, options: CookieOptions) {
          // Remove cookie on the response
          response.cookies.set({
            name,
            value: '',
            ...options,
            maxAge: 0,
          })
        },
      },
    }
  )
}