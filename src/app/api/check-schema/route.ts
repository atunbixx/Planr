import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET() {
  try {
    console.log('Checking actual database schema...')
    
    // Check the actual columns in the vendors table
    const { data: vendorColumns, error: vendorColumnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable, column_default')
      .eq('table_name', 'vendors')
      .eq('table_schema', 'public')
      .order('ordinal_position')

    if (vendorColumnsError) {
      console.log('Error checking vendor columns:', vendorColumnsError)
    }

    // Check the actual columns in the vendor_categories table  
    const { data: categoryColumns, error: categoryColumnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable, column_default')
      .eq('table_name', 'vendor_categories')
      .eq('table_schema', 'public')
      .order('ordinal_position')

    if (categoryColumnsError) {
      console.log('Error checking category columns:', categoryColumnsError)
    }

    // Also test a simple insert to see what happens
    const testVendor = {
      couple_id: '00000000-0000-0000-0000-000000000000', // Dummy UUID for testing
      name: 'Test Vendor',
      contact_name: 'Test Contact',
      phone: '555-0123',
      email: 'test@example.com'
    }

    console.log('Testing vendor insert with data:', testVendor)
    const { data: insertTest, error: insertError } = await supabase
      .from('vendors')
      .insert([testVendor])
      .select()

    return NextResponse.json({
      success: true,
      vendor_columns: vendorColumns || [],
      category_columns: categoryColumns || [],
      insert_test: {
        success: !insertError,
        error: insertError?.message,
        data: insertTest
      },
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Schema check error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}