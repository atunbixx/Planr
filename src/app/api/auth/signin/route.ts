import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { tempStorage } from '@/lib/db/temp-storage'
import { PasswordService } from '@/lib/auth/password'
import { JWTService, createAuthResponse, createErrorResponse } from '@/lib/auth/jwt'
import { signinSchema } from '@/lib/validation/auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate input
    const validationResult = signinSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        createErrorResponse(
          `Validation error: ${validationResult.error.errors?.map(e => e.message).join(', ') || 'Invalid input'}`
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
      user = await tempStorage.findUserByEmail(email)
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
    return NextResponse.json(createAuthResponse(user, token))

  } catch (error) {
    console.error('Signin error:', error)
    return NextResponse.json(
      createErrorResponse('Internal server error'),
      { status: 500 }
    )
  }
}