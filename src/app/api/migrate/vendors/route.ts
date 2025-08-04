import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST() {
  try {
    console.log('Starting vendor database setup...')

    // First, let's check what tables exist
    const { data: existingTables, error: tableCheckError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', ['vendor_categories', 'vendors'])

    console.log('Existing tables:', existingTables)

    // Try to insert vendor categories (this will tell us if the table exists)
    const categories = [
      { name: 'Venue', icon: '🏛️', color: '#8B5CF6', description: 'Reception halls, outdoor venues, churches, and ceremony locations', industry_typical: true, display_order: 1 },
      { name: 'Catering', icon: '🍽️', color: '#EF4444', description: 'Food service, bartending, and beverage providers', industry_typical: true, display_order: 2 },
      { name: 'Photography', icon: '📸', color: '#F59E0B', description: 'Wedding photographers and photo booth services', industry_typical: true, display_order: 3 },
      { name: 'Other', icon: '🏢', color: '#6B7280', description: 'Miscellaneous wedding services', industry_typical: false, display_order: 99 }
    ]

    console.log('Attempting to insert vendor categories...')
    const { data: categoryData, error: categoryError } = await supabase
      .from('vendor_categories')
      .upsert(categories, { onConflict: 'name', ignoreDuplicates: true })
      .select()

    if (categoryError) {
      console.log('Vendor categories table error:', categoryError)
    } else {
      console.log('Vendor categories inserted successfully:', categoryData)
    }

    // Try to check if vendors table exists by querying it
    console.log('Checking vendors table...')
    const { data: vendorData, error: vendorError } = await supabase
      .from('vendors')
      .select('id')
      .limit(1)

    if (vendorError) {
      console.log('Vendors table error:', vendorError)
    } else {
      console.log('Vendors table exists, found records:', vendorData?.length || 0)
    }

    return NextResponse.json({
      success: true,
      message: 'Database check completed',
      existingTables: existingTables?.map(t => t.table_name) || [],
      categoryError: categoryError?.message,
      vendorError: vendorError?.message,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Database check error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}