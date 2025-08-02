import { NextRequest, NextResponse } from 'next/server'
import { createHash } from 'crypto'

// Generate CSRF token
function generateCSRFToken(sessionId: string, secret: string): string {
  return createHash('sha256')
    .update(`${sessionId}:${secret}`)
    .digest('hex')
}

// Verify CSRF token
function verifyCSRFToken(token: string, sessionId: string, secret: string): boolean {
  const expectedToken = generateCSRFToken(sessionId, secret)
  return token === expectedToken
}

export function csrfProtection(req: NextRequest): NextResponse | null {
  // Skip CSRF for GET requests
  if (req.method === 'GET') {
    return null
  }

  // Get session cookie
  const sessionCookie = req.cookies.get('rsvp_session')
  if (!sessionCookie) {
    return NextResponse.json(
      { error: 'Session required' },
      { status: 401 }
    )
  }

  // Get CSRF token from header
  const csrfToken = req.headers.get('x-csrf-token')
  if (!csrfToken) {
    return NextResponse.json(
      { error: 'CSRF token required' },
      { status: 403 }
    )
  }

  // Verify CSRF token
  const secret = process.env.CSRF_SECRET || 'default-csrf-secret-change-in-production'
  const isValid = verifyCSRFToken(csrfToken, sessionCookie.value, secret)
  
  if (!isValid) {
    return NextResponse.json(
      { error: 'Invalid CSRF token' },
      { status: 403 }
    )
  }

  return null
}

// Helper to generate CSRF token for forms
export function getCSRFToken(sessionId: string): string {
  const secret = process.env.CSRF_SECRET || 'default-csrf-secret-change-in-production'
  return generateCSRFToken(sessionId, secret)
}