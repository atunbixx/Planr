import { getCurrentUser } from '@/lib/auth/server'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public details?: any
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export class ApiResponse {
  static success<T>(data: T, message?: string) {
    return NextResponse.json({
      success: true,
      message,
      data
    })
  }

  static error(message: string, status: number, details?: any) {
    return NextResponse.json({
      success: false,
      error: message,
      details
    }, { status })
  }
}

/**
 * Ensures the request is authenticated and returns the user and couple data
 * @throws {ApiError} If user is not authenticated or couple not found
 */
export async function requireAuthenticatedCouple() {
  const currentUser = await getCurrentUser()
  if (!currentUser) {
    throw new ApiError('Unauthorized - Please sign in', 401)
  }

  const user = await prisma.user.findUnique({
    where: { id: currentUser.id },
    include: {
      couples: {
        include: {
          _count: {
            select: {
              guests: true,
              vendors: true,
              budgetCategories: true,
              photos: true
            }
          }
        }
      }
    }
  })

  if (!user) {
    throw new ApiError('User not found', 404)
  }

  const couple = user.couples[0]
  if (!couple) {
    throw new ApiError('Couple profile not found', 404)
  }

  return { user, couple }
}

/**
 * Wraps an API handler with error handling
 */
export function withErrorHandler(
  handler: (req: Request) => Promise<NextResponse>
) {
  return async (req: Request) => {
    try {
      return await handler(req)
    } catch (error) {
      console.error('API Error:', error)
      
      if (error instanceof ApiError) {
        return ApiResponse.error(error.message, error.statusCode, error.details)
      }
      
      return ApiResponse.error(
        'Internal server error',
        500,
        process.env.NODE_ENV === 'development' ? error : undefined
      )
    }
  }
}