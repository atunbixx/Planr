import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { tempStorage } from '@/lib/db/temp-storage'
import { PasswordService } from '@/lib/auth/password'
import { JWTService, createAuthResponse, createErrorResponse } from '@/lib/auth/jwt'
import { signupSchema } from '@/lib/validation/auth'
import { checkRateLimit } from '@/lib/security/rate-limit'
import type { User as PrismaUser, UserRole } from '@prisma/client'

export async function POST(request: NextRequest) {
  try {
    const ip = (request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '').split(',')[0].trim()
    const rl = checkRateLimit(`auth:signup:${ip || 'unknown'}`, { windowMs: 10 * 60 * 1000, max: 5 })
    if (!rl.ok) {
      const res = NextResponse.json(createErrorResponse('Too many requests', 429), { status: 429 })
      res.headers.set('X-RateLimit-Limit', String(rl.limit))
      res.headers.set('X-RateLimit-Remaining', String(rl.remaining))
      res.headers.set('X-RateLimit-Reset', String(Math.floor(rl.resetAt / 1000)))
      res.headers.set('Retry-After', String(Math.ceil(rl.retryAfter / 1000)))
      return res
    }
    const body = await request.json()
    
    // Validate input
    const validationResult = signupSchema.safeParse(body)
    if (!validationResult.success) {
      console.log('Signup validation failed:', {
        body,
        error: validationResult.error,
        issues: validationResult.error.issues
      })
      return NextResponse.json(
        createErrorResponse(
          `Validation error: ${validationResult.error.issues?.map(e => `${e.path.join('.')}: ${e.message}`).join(', ') || 'Invalid input'}`
        ),
        { status: 400 }
      )
    }

    const { email, password, role } = validationResult.data

    // Try database first, fallback to temp storage
    let user: PrismaUser | null = null
    try {
      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email }
      })

      if (existingUser) {
        return NextResponse.json(
          createErrorResponse('User with this email already exists'),
          { status: 409 }
        )
      }

      // Hash password
      const hashedPassword = await PasswordService.hashPassword(password)

      // Create user
      user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          role,
          onboardingCompleted: false
        }
      })
    } catch (dbError) {
      console.log('Database not available, using temp storage')
      
      // Check if user already exists in temp storage
      const existingUser = await tempStorage.findUserByEmail(email)
      if (existingUser) {
        return NextResponse.json(
          createErrorResponse('User with this email already exists'),
          { status: 409 }
        )
      }

      // Hash password
      const hashedPassword = await PasswordService.hashPassword(password)

      // Create user in temp storage
      const tempUser = await tempStorage.createUser({
        email,
        password: hashedPassword,
        role,
        onboardingCompleted: false
      })
      // Map temp storage user to Prisma-like shape
      user = {
        id: tempUser.id,
        email: tempUser.email,
        password: tempUser.password,
        role: tempUser.role as UserRole,
        isActive: true,
        onboardingCompleted: Boolean(tempUser.onboardingCompleted),
        createdAt: new Date(tempUser.createdAt),
        updatedAt: new Date(tempUser.updatedAt)
      }
    }

    // Generate JWT token
    const token = JWTService.generateToken(user as PrismaUser)

    // Return success response
    const res = NextResponse.json(createAuthResponse(user as PrismaUser, token), { status: 201 })
    res.headers.set('X-RateLimit-Limit', String(rl.limit))
    res.headers.set('X-RateLimit-Remaining', String(rl.remaining))
    res.headers.set('X-RateLimit-Reset', String(Math.floor(rl.resetAt / 1000)))
    return res

  } catch (error) {
    console.error('Signup error:', error)
    return NextResponse.json(
      createErrorResponse('Internal server error'),
      { status: 500 }
    )
  }
}
