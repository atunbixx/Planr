import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { withSessionLock } from '@/lib/utils/session-lock'
import { createLogger } from '@/lib/utils/logger'

const log = createLogger('auth-server')

// Session cache to prevent race conditions
const sessionCache = new Map<string, { session: any, timestamp: number, userId?: string }>()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

// Helper to clear session cache for specific user or all
export const clearSessionCache = (userId?: string) => {
  if (userId) {
    // Clear specific user's session
    for (const [key, value] of sessionCache.entries()) {
      if (value.userId === userId) {
        sessionCache.delete(key)
      }
    }
  } else {
    // Clear all cache
    sessionCache.clear()
  }
}

export const createClient = async () => {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            // Enhanced cookie settings with proper configuration
            const cookieOptions = {
              ...options,
              path: options.path || '/',
              sameSite: (options.sameSite as 'lax' | 'strict' | 'none') || 'lax',
              secure: process.env.NODE_ENV === 'production',
              httpOnly: options.httpOnly !== false, // Default to true unless explicitly false
              maxAge: options.maxAge || 60 * 60 * 24 * 7, // 7 days default
            }
            // Don't set domain in development to avoid issues
            if (process.env.NODE_ENV === 'production' && options.domain) {
              cookieOptions.domain = options.domain
            }
            cookieStore.set({ name, value, ...cookieOptions })
          } catch (error) {
            // The `set` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
            log.debug('Failed to set cookie on server', { error: String(error) })
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            const removeOptions = {
              ...options,
              path: options.path || '/',
              sameSite: (options.sameSite as 'lax' | 'strict' | 'none') || 'lax',
              secure: process.env.NODE_ENV === 'production',
              maxAge: 0,
              expires: new Date(0)
            }
            // Don't set domain in development to avoid issues
            if (process.env.NODE_ENV === 'production' && options.domain) {
              removeOptions.domain = options.domain
            }
            cookieStore.set({ 
              name, 
              value: '', 
              ...removeOptions
            })
          } catch (error) {
            // The `delete` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
            log.debug('Failed to remove cookie on server', { error: String(error) })
          }
        },
      },
    }
  )
}

// Helper function to get the current user on the server with retry logic
export const getUser = async (retryCount = 0): Promise<any> => {
  const maxRetries = 2
  const retryDelay = 100 * Math.pow(2, retryCount) // Exponential backoff
  
  try {
    const supabase = await createClient()
    
    // First try to get the user
    let { data: { user }, error } = await supabase.auth.getUser()
    
    // Handle JWT errors with intelligent retry
    if (error && (error.message.includes('signature is invalid') || 
                  error.message.includes('invalid JWT') ||
                  error.message.includes('JWT expired'))) {
      
      log.debug('JWT error detected, attempting refresh')
      
      // Attempt to refresh the session
      const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession()
      
      if (refreshError) {
        // If refresh fails and we have retries left, try again
        if (retryCount < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, retryDelay))
          return getUser(retryCount + 1)
        }
        
        log.warn('Session refresh failed after retries', refreshError)
        return null
      }
      
      // Try to get user again after successful refresh
      const { data: { user: refreshedUser }, error: retryError } = await supabase.auth.getUser()
      
      if (retryError) {
        log.warn('User fetch failed after refresh', retryError)
        return null
      }
      
      return refreshedUser
    }
    
    // Handle other errors with retry
    if (error && retryCount < maxRetries) {
      await new Promise(resolve => setTimeout(resolve, retryDelay))
      return getUser(retryCount + 1)
    }
    
    if (error) {
      log.error('Error getting user', error)
      return null
    }
    
    return user
  } catch (err) {
    log.error('Unexpected error in getUser', err)
    return null
  }
}

// Helper function to get the current session on the server with caching and locking
export const getSession = async (useCache = true) => {
  const sessionKey = 'global-session';
  
  return withSessionLock(sessionKey, async () => {
    try {
      // Check cache first if enabled
      if (useCache) {
        const cachedEntry = sessionCache.get('session')
        if (cachedEntry && Date.now() - cachedEntry.timestamp < CACHE_TTL) {
          return cachedEntry.session
        }
      }
      
      const supabase = await createClient()
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error) {
        log.error('Error getting session', error)
        
        // Try to refresh if we get a session error
        if (error.message.includes('refresh_token') || error.message.includes('expired')) {
          const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession()
          if (!refreshError && refreshData?.session) {
            // Cache the refreshed session
            sessionCache.set('session', {
              session: refreshData.session,
              timestamp: Date.now(),
              userId: refreshData.session.user?.id
            })
            return refreshData.session
          }
        }
        
        return null
      }
      
      // Cache the session
      if (session) {
        sessionCache.set('session', {
          session,
          timestamp: Date.now(),
          userId: session.user?.id
        })
      }
      
      return session
    } catch (err) {
      log.error('Unexpected error in getSession', err)
      return null
    }
  })
}

// Helper function to check if user is authenticated
export const isAuthenticated = async (): Promise<boolean> => {
  const user = await getUser()
  return !!user
}

