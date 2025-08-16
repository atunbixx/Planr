/**
 * Security Headers Middleware
 * Implements comprehensive security headers for the application
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateCSPNonce } from '@/lib/validation/sanitize';

interface SecurityHeadersConfig {
  enableCSP?: boolean;
  enableHSTS?: boolean;
  enableXFrame?: boolean;
  enableXContent?: boolean;
  enableReferrer?: boolean;
  enablePermissions?: boolean;
  cspDirectives?: Record<string, string[]>;
  corsOrigins?: string[];
  isDevelopment?: boolean;
}

/**
 * Generate Content Security Policy header
 */
function generateCSP(nonce: string, config: SecurityHeadersConfig): string {
  const { cspDirectives = {}, isDevelopment = false } = config;
  
  const defaultDirectives: Record<string, string[]> = {
    'default-src': ["'self'"],
    'script-src': [
      "'self'",
      `'nonce-${nonce}'`,
      isDevelopment ? "'unsafe-eval'" : '', // Allow eval in development only
      'https://cdn.jsdelivr.net', // For any CDN scripts
    ].filter(Boolean),
    'style-src': [
      "'self'",
      "'unsafe-inline'", // Required for inline styles
      'https://fonts.googleapis.com',
    ],
    'img-src': [
      "'self'",
      'data:',
      'blob:',
      'https://*.supabase.co', // Supabase storage
      'https://res.cloudinary.com', // Cloudinary images
      'https://images.unsplash.com', // Unsplash images
    ],
    'font-src': [
      "'self'",
      'https://fonts.gstatic.com',
    ],
    'connect-src': [
      "'self'",
      'https://*.supabase.co', // Supabase API
      'wss://*.supabase.co', // Supabase realtime
      isDevelopment ? 'ws://localhost:*' : '', // WebSocket in development
      'https://api.openweathermap.org', // Weather API
    ].filter(Boolean),
    'media-src': ["'self'", 'blob:'],
    'object-src': ["'none'"],
    'frame-src': ["'self'"],
    'frame-ancestors': ["'self'"],
    'form-action': ["'self'"],
    'base-uri': ["'self'"],
    'manifest-src': ["'self'"],
    'worker-src': ["'self'", 'blob:'],
  };
  
  // Merge with custom directives
  const mergedDirectives = { ...defaultDirectives };
  for (const [key, values] of Object.entries(cspDirectives)) {
    if (mergedDirectives[key]) {
      mergedDirectives[key] = [...new Set([...mergedDirectives[key], ...values])];
    } else {
      mergedDirectives[key] = values;
    }
  }
  
  // Build CSP string
  return Object.entries(mergedDirectives)
    .map(([directive, values]) => `${directive} ${values.join(' ')}`)
    .join('; ');
}

/**
 * Apply CORS headers
 */
function applyCORSHeaders(
  response: NextResponse,
  request: NextRequest,
  allowedOrigins: string[]
): void {
  const origin = request.headers.get('origin');
  
  // Check if origin is allowed
  if (origin && (allowedOrigins.includes('*') || allowedOrigins.includes(origin))) {
    response.headers.set('Access-Control-Allow-Origin', origin);
    response.headers.set('Access-Control-Allow-Credentials', 'true');
  } else if (allowedOrigins.includes('*')) {
    response.headers.set('Access-Control-Allow-Origin', '*');
  }
  
  // Set other CORS headers
  response.headers.set(
    'Access-Control-Allow-Methods',
    'GET, POST, PUT, DELETE, PATCH, OPTIONS'
  );
  response.headers.set(
    'Access-Control-Allow-Headers',
    'X-Requested-With, Content-Type, Authorization, X-CSRF-Token, X-User-Id'
  );
  response.headers.set('Access-Control-Max-Age', '86400'); // 24 hours
}

/**
 * Security headers middleware
 */
export function securityHeaders(config: SecurityHeadersConfig = {}) {
  const {
    enableCSP = true,
    enableHSTS = true,
    enableXFrame = true,
    enableXContent = true,
    enableReferrer = true,
    enablePermissions = true,
    corsOrigins = [],
    isDevelopment = process.env.NODE_ENV === 'development',
  } = config;
  
  return function securityHeadersMiddleware(
    request: NextRequest,
    response: NextResponse
  ): NextResponse {
    // Generate CSP nonce for this request
    const nonce = generateCSPNonce();
    
    // Content Security Policy
    if (enableCSP) {
      const csp = generateCSP(nonce, config);
      response.headers.set('Content-Security-Policy', csp);
      
      // Store nonce for use in the application
      response.headers.set('X-CSP-Nonce', nonce);
    }
    
    // Strict Transport Security (HSTS)
    if (enableHSTS && !isDevelopment) {
      response.headers.set(
        'Strict-Transport-Security',
        'max-age=31536000; includeSubDomains; preload'
      );
    }
    
    // X-Frame-Options - Prevent clickjacking
    if (enableXFrame) {
      response.headers.set('X-Frame-Options', 'SAMEORIGIN');
    }
    
    // X-Content-Type-Options - Prevent MIME sniffing
    if (enableXContent) {
      response.headers.set('X-Content-Type-Options', 'nosniff');
    }
    
    // Referrer Policy
    if (enableReferrer) {
      response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    }
    
    // Permissions Policy (formerly Feature Policy)
    if (enablePermissions) {
      response.headers.set(
        'Permissions-Policy',
        'camera=(), microphone=(), geolocation=(self), payment=()'
      );
    }
    
    // Additional security headers
    response.headers.set('X-XSS-Protection', '1; mode=block');
    response.headers.set('X-DNS-Prefetch-Control', 'on');
    response.headers.set('X-Download-Options', 'noopen');
    response.headers.set('X-Permitted-Cross-Domain-Policies', 'none');
    
    // CORS headers if origins are specified
    if (corsOrigins.length > 0) {
      applyCORSHeaders(response, request, corsOrigins);
    }
    
    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      return new NextResponse(null, { status: 200, headers: response.headers });
    }
    
    return response;
  };
}

/**
 * Pre-configured security headers for different environments
 */
export const securityHeadersPresets = {
  // Development environment - more permissive
  development: securityHeaders({
    enableCSP: false, // Disable CSP in development for hot reload
    enableHSTS: false,
    corsOrigins: ['http://localhost:3000', 'http://localhost:4000'],
    isDevelopment: true,
  }),
  
  // Production environment - strict security
  production: securityHeaders({
    enableCSP: true,
    enableHSTS: true,
    enableXFrame: true,
    enableXContent: true,
    enableReferrer: true,
    enablePermissions: true,
    corsOrigins: [process.env.NEXT_PUBLIC_APP_URL || ''],
    isDevelopment: false,
  }),
  
  // API-only configuration
  api: securityHeaders({
    enableCSP: false, // CSP not needed for API
    enableHSTS: true,
    enableXFrame: true,
    enableXContent: true,
    corsOrigins: [process.env.NEXT_PUBLIC_APP_URL || ''],
    isDevelopment: false,
  }),
};

/**
 * Apply security headers to a response
 */
export function withSecurityHeaders(
  request: NextRequest,
  response: NextResponse = NextResponse.next()
): NextResponse {
  const isDevelopment = process.env.NODE_ENV === 'development';
  const preset = isDevelopment 
    ? securityHeadersPresets.development 
    : securityHeadersPresets.production;
  
  return preset(request, response);
}