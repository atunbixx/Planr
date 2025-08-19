import jwt from 'jsonwebtoken'
import { User } from '@prisma/client'

export interface JWTPayload {
  userId: string
  email: string
  role: string
}

export interface AuthUser {
  id: string
  email: string
  role: string
  onboardingCompleted: boolean
}

export class JWTService {
  private static readonly secret = process.env.JWT_SECRET!
  private static readonly expiresIn = '7d'

  static generateToken(user: User): string {
    if (!this.secret) {
      throw new Error('JWT_SECRET environment variable is required')
    }

    const payload: JWTPayload = {
      userId: user.id,
      email: user.email,
      role: user.role
    }

    return jwt.sign(payload, this.secret, { expiresIn: this.expiresIn })
  }

  static verifyToken(token: string): JWTPayload {
    if (!this.secret) {
      throw new Error('JWT_SECRET environment variable is required')
    }

    try {
      const decoded = jwt.verify(token, this.secret) as JWTPayload
      return decoded
    } catch (_) {
      throw new Error('Invalid or expired token')
    }
  }

  static extractTokenFromHeader(authHeader: string | null): string | null {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null
    }
    return authHeader.substring(7)
  }
}

export function createAuthResponse(user: User, token: string) {
  return {
    success: true,
    data: {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        onboardingCompleted: user.onboardingCompleted
      },
      token
    }
  }
}

export function createErrorResponse(message: string, statusCode: number = 400) {
  return {
    success: false,
    error: {
      message,
      statusCode
    }
  }
}