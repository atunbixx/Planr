/**
 * Request Tracking Middleware
 * Provides request ID generation and tracking for debugging and monitoring
 */

import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { logger } from '@/lib/utils/logger';

const log = logger.child({ module: 'request-tracking' });

/**
 * Request tracking configuration
 */
interface RequestTrackingConfig {
  headerName?: string;
  generateId?: () => string;
  logRequests?: boolean;
  includeInResponse?: boolean;
  trackPerformance?: boolean;
}

/**
 * Request metadata storage
 */
const requestMetadata = new Map<string, {
  startTime: number;
  method: string;
  path: string;
  userAgent?: string;
  ip?: string;
  userId?: string;
}>();

/**
 * Generate a unique request ID
 */
function generateRequestId(): string {
  return `req_${Date.now()}_${randomUUID().substring(0, 8)}`;
}

/**
 * Extract client IP from request
 */
function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const real = request.headers.get('x-real-ip');
  return forwarded?.split(',')[0] || real || 'unknown';
}

/**
 * Request tracking middleware
 */
export function requestTracking(config: RequestTrackingConfig = {}) {
  const {
    headerName = 'X-Request-ID',
    generateId = generateRequestId,
    logRequests = true,
    includeInResponse = true,
    trackPerformance = true,
  } = config;
  
  return function requestTrackingMiddleware(
    request: NextRequest,
    response: NextResponse
  ): NextResponse {
    // Get or generate request ID
    let requestId = request.headers.get(headerName);
    if (!requestId) {
      requestId = generateId();
    }
    
    // Store request metadata
    if (trackPerformance) {
      requestMetadata.set(requestId, {
        startTime: Date.now(),
        method: request.method,
        path: request.nextUrl.pathname,
        userAgent: request.headers.get('user-agent') || undefined,
        ip: getClientIp(request),
        userId: request.headers.get('x-user-id') || undefined,
      });
      
      // Clean up old metadata (older than 5 minutes)
      const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
      for (const [id, metadata] of requestMetadata.entries()) {
        if (metadata.startTime < fiveMinutesAgo) {
          requestMetadata.delete(id);
        }
      }
    }
    
    // Log request if enabled
    if (logRequests) {
      log.info('Incoming request', {
        requestId,
        method: request.method,
        path: request.nextUrl.pathname,
        query: Object.fromEntries(request.nextUrl.searchParams),
        ip: getClientIp(request),
        userAgent: request.headers.get('user-agent'),
      });
    }
    
    // Add request ID to response headers
    if (includeInResponse) {
      response.headers.set(headerName, requestId);
      response.headers.set('X-Response-Time', Date.now().toString());
    }
    
    // Track response performance
    if (trackPerformance) {
      const metadata = requestMetadata.get(requestId);
      if (metadata) {
        const duration = Date.now() - metadata.startTime;
        
        // Log performance metrics
        log.info('Request completed', {
          requestId,
          duration,
          method: metadata.method,
          path: metadata.path,
          status: response.status,
        });
        
        // Add performance headers
        response.headers.set('X-Response-Duration', duration.toString());
        
        // Log slow requests
        if (duration > 1000) {
          log.warn('Slow request detected', {
            requestId,
            duration,
            method: metadata.method,
            path: metadata.path,
          });
        }
        
        // Clean up metadata after logging
        requestMetadata.delete(requestId);
      }
    }
    
    return response;
  };
}

/**
 * Get request ID from headers or context
 */
export function getRequestId(request: NextRequest): string | null {
  return request.headers.get('X-Request-ID') || 
         request.headers.get('x-request-id') ||
         null;
}

/**
 * Create a contextual logger with request ID
 */
export function createRequestLogger(request: NextRequest) {
  const requestId = getRequestId(request);
  const userId = request.headers.get('x-user-id');
  
  return logger.child({
    requestId,
    userId,
    path: request.nextUrl.pathname,
    method: request.method,
  });
}

/**
 * Apply request tracking to a response
 */
export function withRequestTracking(
  request: NextRequest,
  response: NextResponse = NextResponse.next()
): NextResponse {
  const middleware = requestTracking();
  return middleware(request, response);
}

/**
 * Request context for async operations
 */
class RequestContext {
  private static instance: RequestContext;
  private context = new Map<string, any>();
  
  static getInstance(): RequestContext {
    if (!RequestContext.instance) {
      RequestContext.instance = new RequestContext();
    }
    return RequestContext.instance;
  }
  
  set(requestId: string, key: string, value: any): void {
    const contextKey = `${requestId}:${key}`;
    this.context.set(contextKey, value);
  }
  
  get(requestId: string, key: string): any {
    const contextKey = `${requestId}:${key}`;
    return this.context.get(contextKey);
  }
  
  clear(requestId: string): void {
    // Clear all context for a request
    for (const key of this.context.keys()) {
      if (key.startsWith(`${requestId}:`)) {
        this.context.delete(key);
      }
    }
  }
  
  // Clean up old context entries
  cleanup(): void {
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
    for (const [key, value] of this.context.entries()) {
      if (value && typeof value === 'object' && value.timestamp < fiveMinutesAgo) {
        this.context.delete(key);
      }
    }
  }
}

export const requestContext = RequestContext.getInstance();

/**
 * Middleware to add request context
 */
export function withRequestContext<T>(
  requestId: string,
  handler: () => Promise<T>
): Promise<T> {
  return new Promise(async (resolve, reject) => {
    try {
      // Set up context
      requestContext.set(requestId, 'startTime', Date.now());
      
      // Execute handler
      const result = await handler();
      
      // Clean up context
      requestContext.clear(requestId);
      
      resolve(result);
    } catch (error) {
      // Log error with context
      log.error('Request handler error', error, { requestId });
      
      // Clean up context
      requestContext.clear(requestId);
      
      reject(error);
    }
  });
}