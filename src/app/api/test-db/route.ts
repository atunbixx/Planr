import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET() {
  try {
    console.log('Testing database connection...')
    
    // Test basic connection
    const { data: connection, error: connectionError } = await supabase
      .from('users')
      .select('id')
      .limit(1)

    if (connectionError) {
      console.log('Connection error:', connectionError)
      return NextResponse.json({
        success: false,
        error: 'Database connection failed',
        details: connectionError.message
      }, { status: 500 })
    }

    // Check if vendor_categories table exists
    const { data: categoriesData, error: categoriesError } = await supabase
      .from('vendor_categories')
      .select('id, name')
      .limit(5)

    // Check if vendors table exists
    const { data: vendorsData, error: vendorsError } = await supabase
      .from('vendors')
      .select('id, name')
      .limit(5)

    return NextResponse.json({
      success: true,
      connection: 'OK',
      tables: {
        vendor_categories: {
          exists: !categoriesError,
          error: categoriesError?.message,
          sample_data: categoriesData || [],
          count: categoriesData?.length || 0
        },
        vendors: {
          exists: !vendorsError,
          error: vendorsError?.message,
          sample_data: vendorsData || [], 
          count: vendorsData?.length || 0
        }
      },
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Database test error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}