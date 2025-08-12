import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST() {
  // Create client inside the function to avoid build-time errors
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    return NextResponse.json(
      { error: 'Missing required environment variables' },
      { status: 500 }
    )
  }

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)
  try {
    console.log('Running vendor database migration...')

    // Check if vendor_categories already has data
    const { data: existingCategories, error: checkError } = await supabaseAdmin
      .from('vendor_categories')
      .select('id, name')
      .limit(5)

    if (checkError) {
      console.log('vendor_categories table might not exist, will create...')
    } else if (existingCategories && existingCategories.length > 0) {
      console.log(`Found ${existingCategories.length} existing categories, skipping category creation`)
    }

    // Create vendor categories if they don't exist
    if (!existingCategories || existingCategories.length === 0) {
      const defaultCategories = [
        { name: 'Venue', icon: '🏛️', color: '#8B5CF6', description: 'Reception halls, outdoor venues, churches, and ceremony locations', industry_typical: true, display_order: 1 },
        { name: 'Catering', icon: '🍽️', color: '#EF4444', description: 'Food service, bartending, and beverage providers', industry_typical: true, display_order: 2 },
        { name: 'Photography', icon: '📸', color: '#F59E0B', description: 'Wedding photographers and photo booth services', industry_typical: true, display_order: 3 },
        { name: 'Videography', icon: '🎥', color: '#10B981', description: 'Wedding videographers and drone services', industry_typical: true, display_order: 4 },
        { name: 'Music & DJ', icon: '🎵', color: '#3B82F6', description: 'DJs, live bands, and ceremony musicians', industry_typical: true, display_order: 5 },
        { name: 'Flowers', icon: '💐', color: '#EC4899', description: 'Florists, bouquets, and ceremony decorations', industry_typical: true, display_order: 6 },
        { name: 'Transportation', icon: '🚗', color: '#84CC16', description: 'Limos, shuttles, and getaway cars', industry_typical: true, display_order: 7 },
        { name: 'Beauty', icon: '💄', color: '#C2410C', description: 'Hair stylists, makeup artists, and spa services', industry_typical: true, display_order: 8 },
        { name: 'Attire', icon: '👗', color: '#6366F1', description: 'Wedding dresses, suits, and formal wear', industry_typical: true, display_order: 9 },
        { name: 'Cake & Desserts', icon: '🎂', color: '#BE185D', description: 'Wedding cakes, dessert tables, and sweet treats', industry_typical: true, display_order: 10 },
        { name: 'Decorations', icon: '🎊', color: '#F97316', description: 'Event decorators, lighting, and ambiance', industry_typical: true, display_order: 11 },
        { name: 'Stationery', icon: '💌', color: '#06B6D4', description: 'Invitations, programs, and paper goods', industry_typical: true, display_order: 12 },
        { name: 'Jewelry', icon: '💍', color: '#D97706', description: 'Wedding rings, jewelry, and accessories', industry_typical: true, display_order: 13 },
        { name: 'Officiant', icon: '👨‍💼', color: '#6B7280', description: 'Wedding officiants, ministers, and celebrants', industry_typical: true, display_order: 14 },
        { name: 'Planning', icon: '📋', color: '#0891B2', description: 'Wedding planners and coordinators', industry_typical: true, display_order: 15 },
        { name: 'Other', icon: '🏢', color: '#6B7280', description: 'Miscellaneous wedding services', industry_typical: false, display_order: 99 }
      ]

      console.log('Inserting default vendor categories...')
      const { error: insertError } = await supabaseAdmin
        .from('vendor_categories')
        .upsert(defaultCategories, { onConflict: 'name' })

      if (insertError) {
        console.error('Error inserting categories:', insertError)
        throw insertError
      }
    }

    // Verify the setup
    const { data: finalCategories, error: finalError } = await supabaseAdmin
      .from('vendor_categories')
      .select('id, name, icon')
      .order('display_order')

    if (finalError) {
      throw finalError
    }

    // Test vendor insertion as admin to verify table structure
    const testVendor = {
      couple_id: '00000000-0000-0000-0000-000000000000', // This will fail RLS but should show column structure
      name: 'Migration Test Vendor',
      contact_name: 'Test Contact',
      status: 'potential',
      priority: 'medium'
    }

    console.log('Testing vendor table structure...')
    const { data: vendorTest, error: vendorError } = await supabaseAdmin
      .from('vendors')
      .insert([testVendor])
      .select()

    return NextResponse.json({
      success: true,
      categories_count: finalCategories?.length || 0,
      categories: finalCategories,
      vendor_table_test: {
        success: !vendorError,
        error: vendorError?.message,
        error_code: vendorError?.code,
        data: vendorTest
      },
      message: 'Vendor system migration completed successfully!',
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Migration error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}