import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { tempStorage } from '@/lib/db/temp-storage'
import { PasswordService } from '@/lib/auth/password'
import { JWTService, createAuthResponse, createErrorResponse } from '@/lib/auth/jwt'
import { signupSchema } from '@/lib/validation/auth'

export async function POST(request: NextRequest) {
  try {
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
    let user
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
        ...tempUser,
        createdAt: new Date(tempUser.createdAt),
        updatedAt: new Date(tempUser.updatedAt)
      } as typeof user
    }

    // Generate JWT token
    const token = JWTService.generateToken(user)

    // Return success response
    return NextResponse.json(
      createAuthResponse(user, token),
      { status: 201 }
    )

  } catch (error) {
    console.error('Signup error:', error)
    return NextResponse.json(
      createErrorResponse('Internal server error'),
      { status: 500 }
    )
  }
}