'use client'

interface User {
  id: string
  email: string
  role: string
  onboardingCompleted: boolean
}

interface AuthState {
  user: User | null
  token: string | null
  isLoading: boolean
}

class AuthClient {
  private static readonly TOKEN_KEY = 'wedding_planner_token'
  private static readonly USER_KEY = 'wedding_planner_user'

  static getToken(): string | null {
    if (typeof window === 'undefined') return null
    return localStorage.getItem(this.TOKEN_KEY)
  }

  static setToken(token: string): void {
    if (typeof window === 'undefined') return
    localStorage.setItem(this.TOKEN_KEY, token)
  }

  static removeToken(): void {
    if (typeof window === 'undefined') return
    localStorage.removeItem(this.TOKEN_KEY)
    localStorage.removeItem(this.USER_KEY)
  }

  static getUser(): User | null {
    if (typeof window === 'undefined') return null
    const userStr = localStorage.getItem(this.USER_KEY)
    return userStr ? JSON.parse(userStr) : null
  }

  static setUser(user: User): void {
    if (typeof window === 'undefined') return
    localStorage.setItem(this.USER_KEY, JSON.stringify(user))
  }

  static async signup(email: string, password: string, role: string = 'couple') {
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

  static async signin(email: string, password: string) {
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

  static async getProfile() {
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
      return data.data.user
    }

    console.log('API response was not successful:', data)
    return null
  }

  static async completeOnboarding(weddingDetails: {
    venue?: string
    weddingDate?: string
    budget?: number
    guestCount?: number
  }) {
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

  static isAuthenticated(): boolean {
    return !!this.getToken()
  }
}

export default AuthClient