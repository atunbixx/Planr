import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Create a Supabase client with the service role key for admin operations
// WARNING: This should ONLY be used in development!
export async function POST(request: Request) {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 })
  }

  try {
    const { email, password } = await request.json()

    // For development, we'll create a simple auth bypass
    // In a real scenario, you'd need the service role key to bypass email confirmation
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    // First, try to sign in
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (signInData?.user) {
      return NextResponse.json({ user: signInData.user, session: signInData.session })
    }

    // If sign in failed due to unconfirmed email, we need manual intervention
    if (signInError?.message?.includes('Email not confirmed')) {
      return NextResponse.json({
        error: 'Email not confirmed',
        instructions: [
          '1. Go to your Supabase dashboard: https://supabase.com/dashboard/project/gpfxxbhowailwllpgphe/auth/users',
          '2. Find the user: ' + email,
          '3. Click on the user and confirm their email manually',
          '4. OR disable email confirmations in Authentication > Settings',
        ]
      }, { status: 400 })
    }

    return NextResponse.json({ error: signInError?.message || 'Authentication failed' }, { status: 400 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}