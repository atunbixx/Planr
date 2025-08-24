import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { tempStorage } from '@/lib/db/temp-storage'
import { PasswordService } from '@/lib/auth/password'
import { JWTService, createAuthResponse, createErrorResponse } from '@/lib/auth/jwt'
import { signinSchema } from '@/lib/validation/auth'
import { checkRateLimit } from '@/lib/security/rate-limit'

export async function POST(request: NextRequest) {
  try {
    const ip = (request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '').split(',')[0].trim()
    const rl = checkRateLimit(`auth:signin:${ip || 'unknown'}`, { windowMs: 60000, max: 20 })
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
    const validationResult = signinSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        createErrorResponse(
          `Validation error: ${validationResult.error.issues?.map(e => e.message).join(', ') || 'Invalid input'}`
        ),
        { status: 400 }
      )
    }

    const { email, password } = validationResult.data

    // Try database first, fallback to temp storage
    let user
    try {
      // Find user by email
      user = await prisma.user.findUnique({
        where: { email }
      })
    } catch (dbError) {
      console.log('Database not available, using temp storage')
      const tempUser = await tempStorage.findUserByEmail(email)
      if (tempUser) {
        // Map temp storage user to Prisma-like shape
        user = {
          ...tempUser,
          // keep role as string since our app treats it as string elsewhere
          createdAt: new Date(tempUser.createdAt),
          updatedAt: new Date(tempUser.updatedAt)
        } as typeof user
      }
    }

    if (!user) {
      return NextResponse.json(
        createErrorResponse('Invalid credentials'),
        { status: 401 }
      )
    }

    // Verify password
    const isValidPassword = await PasswordService.verifyPassword(password, user.password)
    if (!isValidPassword) {
      return NextResponse.json(
        createErrorResponse('Invalid credentials'),
        { status: 401 }
      )
    }

    // Generate JWT token
    const token = JWTService.generateToken(user)

    // Return success response
    const res = NextResponse.json(createAuthResponse(user, token))
    res.headers.set('X-RateLimit-Limit', String(rl.limit))
    res.headers.set('X-RateLimit-Remaining', String(rl.remaining))
    res.headers.set('X-RateLimit-Reset', String(Math.floor(rl.resetAt / 1000)))
    return res

  } catch (error) {
    console.error('Signin error:', error)
    return NextResponse.json(
      createErrorResponse('Internal server error'),
      { status: 500 }
    )
  }
}
