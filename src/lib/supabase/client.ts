import { createBrowserClient } from '@supabase/ssr'
import { Database } from '@/types/database'

// Create a singleton instance to prevent multiple clients
let browserClient: ReturnType<typeof createBrowserClient<Database>> | null = null

export const createClient = () => {
  if (browserClient) return browserClient
  
  // Check if we're in a browser environment
  const isBrowser = typeof window !== 'undefined' && typeof document !== 'undefined'
  
  browserClient = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      // Enhanced auth configuration for better session management
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: 'pkce'
      },
      // Cookie configuration for browser client
      cookies: {
        get(name: string) {
          if (!isBrowser) return undefined
          
          const cookies = document.cookie.split(';')
          const cookie = cookies.find(c => c.trim().startsWith(`${name}=`))
          if (cookie) {
            return decodeURIComponent(cookie.split('=')[1])
          }
          return undefined
        },
        set(name: string, value: string, options?: any) {
          if (!isBrowser) return
          
          let cookieString = `${name}=${encodeURIComponent(value)}`
          
          // Set defaults for auth cookies
          const path = options?.path || '/'
          const sameSite = options?.sameSite || 'lax'
          const maxAge = options?.maxAge || 60 * 60 * 24 * 7 // 7 days default
          
          cookieString += `; Path=${path}`
          cookieString += `; SameSite=${sameSite}`
          cookieString += `; Max-Age=${maxAge}`
          
          if (options?.expires) {
            cookieString += `; Expires=${options.expires.toUTCString()}`
          }
          
          // Only set domain in production and when explicitly provided
          if (process.env.NODE_ENV === 'production' && options?.domain) {
            cookieString += `; Domain=${options.domain}`
          }
          
          // Set secure flag in production
          if (process.env.NODE_ENV === 'production' || options?.secure) {
            cookieString += '; Secure'
          }
          
          document.cookie = cookieString
        },
        remove(name: string, options?: any) {
          if (!isBrowser) return
          
          const path = options?.path || '/'
          const sameSite = options?.sameSite || 'lax'
          
          let cookieString = `${name}=; Max-Age=0; Path=${path}; SameSite=${sameSite}`
          
          // Only set domain in production and when explicitly provided
          if (process.env.NODE_ENV === 'production' && options?.domain) {
            cookieString += `; Domain=${options.domain}`
          }
          
          // Set secure flag in production
          if (process.env.NODE_ENV === 'production' || options?.secure) {
            cookieString += '; Secure'
          }
          
          document.cookie = cookieString
        }
      }
    }
  )
  
  return browserClient
}

// Helper function to get the current user on the client with retry
export const getUser = async (retryCount = 0): Promise<any> => {
  const maxRetries = 2
  const retryDelay = 100 * Math.pow(2, retryCount)
  
  try {
    const supabase = createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error) {
      // Handle JWT errors by attempting refresh
      if (error.message.includes('JWT') || error.message.includes('signature')) {
        const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession()
        
        if (!refreshError && refreshData?.session) {
          // Retry getting user after refresh
          const { data: { user: refreshedUser } } = await supabase.auth.getUser()
          return refreshedUser
        }
      }
      
      // Retry on other errors
      if (retryCount < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, retryDelay))
        return getUser(retryCount + 1)
      }
      
      if (process.env.NODE_ENV === 'development') {
        console.error('[Auth Client] Error getting user:', error)
      }
      return null
    }
    
    return user
  } catch (err) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[Auth Client] Unexpected error:', err)
    }
    return null
  }
}

// Helper function to get the current session on the client
export const getSession = async () => {
  try {
    const supabase = createClient()
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error) {
      // Try to refresh on session errors
      if (error.message.includes('refresh') || error.message.includes('expired')) {
        const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession()
        if (!refreshError && refreshData?.session) {
          return refreshData.session
        }
      }
      
      if (process.env.NODE_ENV === 'development') {
        console.error('[Auth Client] Error getting session:', error)
      }
      return null
    }
    
    return session
  } catch (err) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[Auth Client] Unexpected error:', err)
    }
    return null
  }
}

// Helper function to sign out
export const signOut = async () => {
  const supabase = createClient()
  const { error } = await supabase.auth.signOut()
  
  if (error) {
    console.error('Error signing out:', error)
    throw error
  }
}

// Helper function to sign in with email and password
export const signInWithPassword = async (email: string, password: string) => {
  const supabase = createClient()
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  
  if (error) {
    console.error('Error signing in:', error)
    throw error
  }
  
  return data
}

// Helper function to sign up with email and password
export const signUpWithPassword = async (email: string, password: string) => {
  const supabase = createClient()
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  })
  
  if (error) {
    console.error('Error signing up:', error)
    throw error
  }
  
  return data
}

// Helper function to sign in with Google OAuth
export const signInWithGoogle = async () => {
  const supabase = createClient()
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  })
  
  if (error) {
    console.error('Error signing in with Google:', error)
    throw error
  }
  
  return data
}