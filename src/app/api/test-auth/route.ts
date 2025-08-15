import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get all cookies to see what is available
    const allCookies = request.cookies.getAll()
    console.log("🍪 All cookies:", allCookies.map(c => ({ name: c.name, hasValue: !!c.value })))
    
    // Try to get session
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
    console.log("📊 Server session state:", {
      sessionExists: !!sessionData?.session,
      hasAccessToken: !!sessionData?.session?.access_token,
      hasRefreshToken: !!sessionData?.session?.refresh_token,
      userId: sessionData?.session?.user?.id,
      email: sessionData?.session?.user?.email,
      expiresAt: sessionData?.session?.expires_at,
      sessionError: sessionError?.message
    })
    
    // Try to get user directly
    const { data: userData, error: userError } = await supabase.auth.getUser()
    console.log("👤 Server user state:", {
      userExists: !!userData?.user,
      userId: userData?.user?.id,
      email: userData?.user?.email,
      userError: userError?.message
    })
    
    return NextResponse.json({
      cookies: {
        total: allCookies.length,
        supabase: allCookies.filter(c => c.name.includes("supabase") || c.name.includes("sb-")),
        all: allCookies.map(c => ({ name: c.name, hasValue: !!c.value }))
      },
      server: {
        session: {
          exists: !!sessionData?.session,
          hasAccessToken: !!sessionData?.session?.access_token,
          hasRefreshToken: !!sessionData?.session?.refresh_token,
          userId: sessionData?.session?.user?.id,
          email: sessionData?.session?.user?.email,
          expiresAt: sessionData?.session?.expires_at
        },
        user: {
          exists: !!userData?.user,
          userId: userData?.user?.id,
          email: userData?.user?.email
        },
        errors: {
          session: sessionError?.message,
          user: userError?.message
        }
      }
    })
  } catch (error) {
    console.error("❌ Test auth error:", error)
    return NextResponse.json({
      error: "Test failed",
      message: error.message
    }, { status: 500 })
  }
}
