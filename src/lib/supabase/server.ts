import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

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
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            // The `set` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch (error) {
            // The `delete` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}

// Helper function to get the current user on the server
export const getUser = async () => {
  const supabase = await createClient()
  
  // First try to get the user
  let { data: { user }, error } = await supabase.auth.getUser()
  
  // If we get a JWT signature error, try to refresh the session
  if (error && (error.message.includes('signature is invalid') || error.message.includes('invalid JWT'))) {
    console.log('🔄 JWT signature invalid, attempting to refresh session...')
    
    try {
      const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession()
      
      if (refreshError) {
        console.error('❌ Session refresh failed:', refreshError)
        return null
      }
      
      // Try to get user again after refresh
      const { data: { user: refreshedUser }, error: retryError } = await supabase.auth.getUser()
      
      if (retryError) {
        console.error('❌ User fetch failed after refresh:', retryError)
        return null
      }
      
      console.log('✅ Session refreshed successfully, user retrieved')
      return refreshedUser
      
    } catch (refreshErr) {
      console.error('❌ Session refresh attempt failed:', refreshErr)
      return null
    }
  }
  
  if (error) {
    console.error('❌ Error getting user:', error)
    return null
  }
  
  return user
}

// Helper function to get the current session on the server
export const getSession = async () => {
  const supabase = await createClient()
  const { data: { session }, error } = await supabase.auth.getSession()
  
  if (error) {
    console.error('Error getting session:', error)
    return null
  }
  
  return session
}

// Helper function to check if user is authenticated
export const isAuthenticated = async (): Promise<boolean> => {
  const user = await getUser()
  return !!user
}