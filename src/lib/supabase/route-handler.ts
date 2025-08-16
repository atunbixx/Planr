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
          const cookieOptions = {
            ...options,
            path: options.path || '/',
            sameSite: (options.sameSite as 'lax' | 'strict' | 'none') || 'lax',
            secure: process.env.NODE_ENV === 'production',
            httpOnly: options.httpOnly !== false, // Default to true unless explicitly false
            maxAge: options.maxAge || 60 * 60 * 24 * 7, // 1 week default
          }
          
          // Don't set domain in development to avoid issues
          if (process.env.NODE_ENV === 'production' && options.domain) {
            cookieOptions.domain = options.domain
          }
          
          if (process.env.NODE_ENV === 'development') {
            console.log('[Route Handler] Setting cookie:', name, 'with options:', cookieOptions)
          }
          
          // Set cookie on the response with proper auth settings
          response.cookies.set({
            name,
            value,
            ...cookieOptions,
          })
        },
        remove(name: string, options: CookieOptions) {
          const removeOptions = {
            ...options,
            path: options.path || '/',
            sameSite: (options.sameSite as 'lax' | 'strict' | 'none') || 'lax',
            secure: process.env.NODE_ENV === 'production',
            maxAge: 0,
            expires: new Date(0),
          }
          
          // Don't set domain in development to avoid issues
          if (process.env.NODE_ENV === 'production' && options.domain) {
            removeOptions.domain = options.domain
          }
          
          if (process.env.NODE_ENV === 'development') {
            console.log('[Route Handler] Removing cookie:', name)
          }
          
          // Remove cookie on the response
          response.cookies.set({
            name,
            value: '',
            ...removeOptions,
          })
        },
      },
    }
  )
}