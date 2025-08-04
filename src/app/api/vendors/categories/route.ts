import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET(request: NextRequest) {
  try {
    // Get all vendor categories (public data)
    const { data: categories, error } = await supabase
      .from('vendor_categories')
      .select('*')
      .order('display_order')

    if (error) {
      console.error('Error fetching vendor categories:', error)
      return NextResponse.json(
        { error: 'Failed to fetch vendor categories', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: categories || []
    })

  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}