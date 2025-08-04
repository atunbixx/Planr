import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET(request: NextRequest) {
  try {
    // Get column information for couples table
    const { data: columns, error: columnsError } = await supabase
      .rpc('get_table_columns', { table_name: 'couples' })
      .select('*')

    // If RPC doesn't exist, try a simple query
    if (columnsError) {
      // Try to get a sample row to see the structure
      const { data: sample, error: sampleError } = await supabase
        .from('couples')
        .select('*')
        .limit(1)

      if (sampleError && sampleError.message.includes('relation "public.couples" does not exist')) {
        return NextResponse.json({
          error: 'Couples table does not exist',
          suggestion: 'Please run the migration SQL in Supabase'
        })
      }

      // Get the columns from the sample or empty object
      const sampleRow = sample?.[0] || {}
      const availableColumns = Object.keys(sampleRow).length > 0 
        ? Object.keys(sampleRow) 
        : 'No rows found, cannot determine columns'

      return NextResponse.json({
        message: 'Database structure check',
        couples_table: {
          exists: !sampleError,
          columns: availableColumns,
          sample_row: sampleRow
        }
      })
    }

    return NextResponse.json({
      columns
    })

  } catch (error) {
    console.error('Debug API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}