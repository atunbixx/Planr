import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  // Get all cookies from the request
  const allCookies = request.cookies.getAll()
  
  console.log('🍪 Debug Cookies Endpoint - All cookies received:', {
    total: allCookies.length,
    cookies: allCookies.map(c => ({
      name: c.name,
      hasValue: !!c.value,
      valueLength: c.value?.length || 0,
      value: c.name.includes('supabase') ? c.value.substring(0, 50) + '...' : c.value
    }))
  })
  
  const supabaseCookies = allCookies.filter(c => 
    c.name.includes('supabase') || c.name.includes('sb-')
  )
  
  return NextResponse.json({
    endpoint: '/api/debug-cookies',
    timestamp: new Date().toISOString(),
    headers: {
      userAgent: request.headers.get('user-agent')?.substring(0, 50) + '...',
      origin: request.headers.get('origin'),
      referer: request.headers.get('referer'),
      cookie: request.headers.get('cookie') ? 'present' : 'missing'
    },
    cookies: {
      total: allCookies.length,
      supabaseCount: supabaseCookies.length,
      all: allCookies.map(c => ({
        name: c.name,
        hasValue: !!c.value,
        length: c.value?.length || 0
      })),
      supabase: supabaseCookies.map(c => ({
        name: c.name,
        hasValue: !!c.value,
        length: c.value?.length || 0,
        preview: c.value?.substring(0, 30) + '...'
      }))
    }
  })
}