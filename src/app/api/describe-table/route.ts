import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET() {
  try {
    console.log('Describing vendors table structure...')
    
    // Try to select from vendors with limit 0 to see column names
    const { data: vendorsData, error: vendorsError } = await supabase
      .from('vendors')
      .select('*')
      .limit(0)

    console.log('Vendors query result:', { data: vendorsData, error: vendorsError })

    // Try to select from vendor_categories
    const { data: categoriesData, error: categoriesError } = await supabase
      .from('vendor_categories')
      .select('*')
      .limit(0)

    console.log('Categories query result:', { data: categoriesData, error: categoriesError })

    // Try to insert with minimal data to see what columns are required/available
    const minimalVendor = {
      name: 'Test Vendor'
    }

    console.log('Testing minimal vendor insert...')
    const { data: minimalInsert, error: minimalError } = await supabase
      .from('vendors')
      .insert([minimalVendor])
      .select()

    console.log('Minimal insert result:', { data: minimalInsert, error: minimalError })

    return NextResponse.json({
      success: true,
      vendors_query: {
        data: vendorsData,
        error: vendorsError?.message,
        error_code: vendorsError?.code,
        error_details: vendorsError?.details
      },
      categories_query: {
        data: categoriesData,
        error: categoriesError?.message,
        error_code: categoriesError?.code,
        error_details: categoriesError?.details
      },
      minimal_insert: {
        data: minimalInsert,
        error: minimalError?.message,
        error_code: minimalError?.code,
        error_details: minimalError?.details
      },
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Table description error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}