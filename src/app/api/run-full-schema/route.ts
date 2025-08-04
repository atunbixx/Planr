import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Use service role key for admin operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST() {
  try {
    console.log('Running full vendor schema setup...')

    // First, let's check current vendors table structure
    const { data: currentColumns, error: columnsError } = await supabaseAdmin
      .rpc('sql', {
        query: `
          SELECT column_name, data_type, is_nullable, column_default
          FROM information_schema.columns 
          WHERE table_name = 'vendors' AND table_schema = 'public'
          ORDER BY ordinal_position;
        `
      })

    console.log('Current vendors table columns:', { currentColumns, columnsError })

    // Now run the full schema creation
    const schemaSQL = `
      -- Create vendor_categories table if it doesn't exist
      CREATE TABLE IF NOT EXISTS vendor_categories (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          name VARCHAR(100) NOT NULL UNIQUE,
          icon VARCHAR(10) DEFAULT '🏢',
          color VARCHAR(7) DEFAULT '#3B82F6',
          description TEXT,
          industry_typical BOOLEAN DEFAULT false,
          display_order INTEGER DEFAULT 0,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Drop existing vendors table to recreate with proper schema
      DROP TABLE IF EXISTS vendors CASCADE;

      -- Create vendors table with proper columns
      CREATE TABLE vendors (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          couple_id UUID NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
          name TEXT NOT NULL,
          contact_name TEXT,
          phone TEXT,
          email TEXT,
          website TEXT,
          address TEXT,
          category_id UUID REFERENCES vendor_categories(id) ON DELETE SET NULL,
          status VARCHAR(20) DEFAULT 'potential' 
              CHECK (status IN ('potential', 'contacted', 'quote_requested', 'in_discussion', 'booked', 'declined', 'cancelled')),
          priority VARCHAR(10) DEFAULT 'medium' 
              CHECK (priority IN ('low', 'medium', 'high', 'critical')),
          rating INTEGER CHECK (rating >= 1 AND rating <= 5),
          estimated_cost DECIMAL(10,2),
          actual_cost DECIMAL(10,2),
          notes TEXT,
          meeting_date DATE,
          contract_signed BOOLEAN DEFAULT false,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Enable Row Level Security
      ALTER TABLE vendor_categories ENABLE ROW LEVEL SECURITY;
      ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;

      -- Drop existing policies to recreate them
      DROP POLICY IF EXISTS "Anyone can view vendor categories" ON vendor_categories;
      DROP POLICY IF EXISTS "Users can view their couple's vendors" ON vendors;
      DROP POLICY IF EXISTS "Users can insert vendors for their couple" ON vendors;
      DROP POLICY IF EXISTS "Users can update their couple's vendors" ON vendors;
      DROP POLICY IF EXISTS "Users can delete their couple's vendors" ON vendors;

      -- RLS Policies for vendor_categories (public read)
      CREATE POLICY "Anyone can view vendor categories" ON vendor_categories
          FOR SELECT USING (true);

      -- RLS Policies for vendors table
      CREATE POLICY "Users can view their couple's vendors" ON vendors
          FOR SELECT USING (
              couple_id IN (
                  SELECT couples.id FROM couples
                  JOIN users ON users.id = couples.user_id
                  WHERE users.clerk_user_id = auth.jwt() ->> 'sub'
              )
          );

      CREATE POLICY "Users can insert vendors for their couple" ON vendors
          FOR INSERT WITH CHECK (
              couple_id IN (
                  SELECT couples.id FROM couples
                  JOIN users ON users.id = couples.user_id
                  WHERE users.clerk_user_id = auth.jwt() ->> 'sub'
              )
          );

      CREATE POLICY "Users can update their couple's vendors" ON vendors
          FOR UPDATE USING (
              couple_id IN (
                  SELECT couples.id FROM couples
                  JOIN users ON users.id = couples.user_id
                  WHERE users.clerk_user_id = auth.jwt() ->> 'sub'
              )
          );

      CREATE POLICY "Users can delete their couple's vendors" ON vendors
          FOR DELETE USING (
              couple_id IN (
                  SELECT couples.id FROM couples
                  JOIN users ON users.id = couples.user_id
                  WHERE users.clerk_user_id = auth.jwt() ->> 'sub'
              )
          );

      -- Create indexes for performance
      CREATE INDEX IF NOT EXISTS idx_vendors_couple_id ON vendors(couple_id);
      CREATE INDEX IF NOT EXISTS idx_vendors_category_id ON vendors(category_id);
      CREATE INDEX IF NOT EXISTS idx_vendors_status ON vendors(status);
      CREATE INDEX IF NOT EXISTS idx_vendors_priority ON vendors(priority);
    `

    console.log('Executing schema SQL...')
    const { error: schemaError } = await supabaseAdmin.rpc('sql', {
      query: schemaSQL
    })

    if (schemaError) {
      console.error('Schema creation error:', schemaError)
      throw schemaError
    }

    // Test the new table structure
    const testVendor = {
      couple_id: '00000000-0000-0000-0000-000000000000',
      name: 'Schema Test Vendor',
      contact_name: 'Test Contact',
      phone: '555-0123',
      email: 'test@example.com',
      status: 'potential',
      priority: 'medium'
    }

    console.log('Testing new vendors table...')
    const { data: vendorTest, error: vendorError } = await supabaseAdmin
      .from('vendors')
      .insert([testVendor])
      .select()

    // Verify final table structure
    const { data: finalColumns, error: finalColumnsError } = await supabaseAdmin
      .rpc('sql', {
        query: `
          SELECT column_name, data_type, is_nullable, column_default
          FROM information_schema.columns 
          WHERE table_name = 'vendors' AND table_schema = 'public'
          ORDER BY ordinal_position;
        `
      })

    return NextResponse.json({
      success: true,
      message: 'Full vendor schema setup completed!',
      before_columns: currentColumns,
      after_columns: finalColumns,
      vendor_test: {
        success: !vendorError,
        error: vendorError?.message,
        error_code: vendorError?.code,
        data: vendorTest
      },
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Full schema error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}