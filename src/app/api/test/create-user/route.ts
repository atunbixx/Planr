import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { createSuccessResponse, createErrorResponse } from '@/lib/api/response'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

/**
 * POST /api/test/create-user
 * Create test user for E2E testing
 * Only available in development/test environments
 */
export async function POST(request: NextRequest) {
  // Only allow in development/test environments
  if (process.env.NODE_ENV === 'production') {
    return createErrorResponse('Not available in production', 403, 'FORBIDDEN')
  }

  try {
    const { email, password, role = 'couple' } = await request.json()

    if (!email || !password) {
      return createErrorResponse('Email and password are required', 400, 'VALIDATION_ERROR')
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role: role as any,
        onboardingCompleted: true,
        isActive: true
      }
    })

    // Create JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '24h' }
    )

    // Create initial credit balance
    await prisma.creditBalance.create({
      data: {
        userId: user.id,
        credits: 100
      }
    })

    return createSuccessResponse({
      userId: user.id,
      email: user.email,
      token
    }, 'Test user created successfully')

  } catch (error) {
    console.error('Failed to create test user:', error)
    return createErrorResponse('Failed to create test user', 500, 'SETUP_ERROR')
  }
}