'use client'

interface User {
  id: string
  email: string
  role: string
  onboardingCompleted: boolean
  impersonating?: boolean
  impersonatedBy?: string
}

class AuthClient {
  private static readonly TOKEN_KEY = 'wedding_planner_token'
  private static readonly USER_KEY = 'wedding_planner_user'
  private static readonly ADMIN_BACKUP_TOKEN_KEY = 'wedding_planner_admin_token_backup'
  private static readonly ADMIN_BACKUP_USER_KEY = 'wedding_planner_admin_user_backup'

  static getToken(): string | null {
    if (typeof window === 'undefined') return null
    return localStorage.getItem(this.TOKEN_KEY)
  }

  static setToken(token: string): void {
    if (typeof window === 'undefined') return
    localStorage.setItem(this.TOKEN_KEY, token)
  }

  static backupCurrentSession(): void {
    if (typeof window === 'undefined') return
    const token = this.getToken()
    const user = this.getUser()
    if (token) localStorage.setItem(this.ADMIN_BACKUP_TOKEN_KEY, token)
    if (user) localStorage.setItem(this.ADMIN_BACKUP_USER_KEY, JSON.stringify(user))
  }

  static getBackupSession(): { token: string | null; user: User | null } {
    if (typeof window === 'undefined') return { token: null, user: null }
    const token = localStorage.getItem(this.ADMIN_BACKUP_TOKEN_KEY)
    const userStr = localStorage.getItem(this.ADMIN_BACKUP_USER_KEY)
    return { token, user: userStr ? JSON.parse(userStr) as User : null }
  }

  static clearBackupSession(): void {
    if (typeof window === 'undefined') return
    localStorage.removeItem(this.ADMIN_BACKUP_TOKEN_KEY)
    localStorage.removeItem(this.ADMIN_BACKUP_USER_KEY)
  }

  static removeToken(): void {
    if (typeof window === 'undefined') return
    localStorage.removeItem(this.TOKEN_KEY)
    localStorage.removeItem(this.USER_KEY)
  }

  static getUser(): User | null {
    if (typeof window === 'undefined') return null
    const userStr = localStorage.getItem(this.USER_KEY)
    return userStr ? JSON.parse(userStr) as User : null
  }

  static setUser(user: User): void {
    if (typeof window === 'undefined') return
    localStorage.setItem(this.USER_KEY, JSON.stringify(user))
  }

  static async signup(email: string, password: string, role: string = 'couple'): Promise<{ success: boolean; data?: { user: User; token: string }; error?: { message: string } }> {
    const response = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password, role })
    })

    const data = await response.json()
    
    if (data.success) {
      this.setToken(data.data.token)
      this.setUser(data.data.user)
    }

    return data
  }

  static async signin(email: string, password: string): Promise<{ success: boolean; data?: { user: User; token: string }; error?: { message: string } }> {
    const response = await fetch('/api/auth/signin', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password })
    })

    const data = await response.json()
    
    if (data.success) {
      this.setToken(data.data.token)
      this.setUser(data.data.user)
    }

    return data
  }

  static async getProfile(): Promise<User | null> {
    const token = this.getToken()
    if (!token) {
      console.log('No token found in getProfile')
      return null
    }

    console.log('Making request to /api/auth/me with token:', token.substring(0, 20) + '...')
    const response = await fetch('/api/auth/me', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })

    const data = await response.json()
    console.log('Response from /api/auth/me:', data)
    
    if (data.success) {
      this.setUser(data.data.user)
      return data.data.user as User
    }

    console.log('API response was not successful:', data)
    return null
  }

  static async completeOnboarding(weddingDetails: {
    venue?: string
    weddingDate?: string
    budget?: number
    guestCount?: number
  }): Promise<{ success: boolean; data?: { user: User }; error?: { message: string } }> {
    const token = this.getToken()
    if (!token) throw new Error('No authentication token')

    const response = await fetch('/api/onboarding', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(weddingDetails)
    })

    const data = await response.json()
    
    if (data.success) {
      this.setUser(data.data.user)
    }

    return data
  }

  static signout(): void {
    this.removeToken()
    window.location.href = '/signin'
  }

  static endImpersonation(): void {
    const { token, user } = this.getBackupSession()
    if (token && user) {
      this.setToken(token)
      this.setUser(user)
      this.clearBackupSession()
      window.location.reload()
    } else {
      // Fallback: sign out
      this.signout()
    }
  }

  static isAuthenticated(): boolean {
    return !!this.getToken()
  }
}

export default AuthClient
