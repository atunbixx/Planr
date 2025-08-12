import { NextRequest } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { cache } from '@/lib/cache'
import { User } from '@supabase/supabase-js'

export interface AuthContext {
  user: User
  userId: string
  email: string
}

export class AuthService {
  private static instance: AuthService
  private readonly cacheKey = 'auth:user:'
  private readonly cacheTTL = 300 // 5 minutes

  private constructor() {}

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService()
    }
    return AuthService.instance
  }

  async getAuthenticatedUser(request?: NextRequest): Promise<AuthContext | null> {
    try {
      const cookieStore = await cookies()
      
      // Create Supabase client with cookie handling
      const supabase = createServerClient(
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
                // Ignore if called from Server Component
              }
            },
            remove(name: string, options: CookieOptions) {
              try {
                cookieStore.set({ name, value: '', ...options })
              } catch (error) {
                // Ignore if called from Server Component
              }
            },
          },
        }
      )

      // Get user from Supabase
      const { data: { user }, error } = await supabase.auth.getUser()
      
      if (error || !user) {
        return null
      }

      // Check cache
      const cacheKey = `${this.cacheKey}${user.id}`
      const cached = await cache.get<AuthContext>(cacheKey)
      if (cached) {
        return cached
      }

      // Create auth context
      const authContext: AuthContext = {
        user,
        userId: user.id,
        email: user.email || ''
      }

      // Cache the result
      await cache.set(cacheKey, authContext, this.cacheTTL)

      return authContext
    } catch (error) {
      console.error('Auth error:', error)
      return null
    }
  }

  async requireAuth(request?: NextRequest): Promise<AuthContext> {
    const authContext = await this.getAuthenticatedUser(request)
    if (!authContext) {
      throw new Error('Unauthorized')
    }
    return authContext
  }

  async clearAuthCache(userId: string): Promise<void> {
    const cacheKey = `${this.cacheKey}${userId}`
    await cache.delete(cacheKey)
  }
}

// Export singleton instance
export const authService = AuthService.getInstance()