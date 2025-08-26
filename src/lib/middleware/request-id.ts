import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logging/logger'
import { randomBytes } from 'crypto'

/**
 * Request ID middleware
 * Generates unique request IDs for correlation across logs and monitoring
 */
export function withRequestId(handler: (request: NextRequest) => Promise<NextResponse>) {
  return async (request: NextRequest): Promise<NextResponse> => {
    // Generate or extract request ID
    const requestId = request.headers.get('x-request-id') || 
                     request.headers.get('x-correlation-id') ||
                     generateRequestId()

    // Set request ID in logger context
    logger.setRequestId(requestId)

    try {
      // Add request ID to request headers for downstream use
      const requestWithId = new NextRequest(request, {
        headers: {
          ...Object.fromEntries(request.headers.entries()),
          'x-request-id': requestId,
        },
      })

      // Call the handler
      const response = await handler(requestWithId)

      // Add request ID to response headers
      response.headers.set('x-request-id', requestId)

      return response
    } finally {
      // Clear request ID from logger context
      logger.clearRequestId()
    }
  }
}

/**
 * Generate a unique request ID
 */
function generateRequestId(): string {
  const timestamp = Date.now().toString(36)
  const random = randomBytes(6).toString('hex')
  return `req_${timestamp}_${random}`
}

/**
 * Extract request ID from request headers
 */
export function getRequestId(request: NextRequest): string | null {
  return request.headers.get('x-request-id') || 
         request.headers.get('x-correlation-id') ||
         null
}

/**
 * Higher-order function to wrap API routes with request ID tracking
 */
export function withRequestIdTracking<T extends any[]>(
  handler: (...args: T) => Promise<NextResponse>
) {
  return async (...args: T): Promise<NextResponse> => {
    const request = args[0] as NextRequest
    const requestId = getRequestId(request) || generateRequestId()
    
    logger.setRequestId(requestId)
    
    try {
      const response = await handler(...args)
      response.headers.set('x-request-id', requestId)
      return response
    } finally {
      logger.clearRequestId()
    }
  }
}