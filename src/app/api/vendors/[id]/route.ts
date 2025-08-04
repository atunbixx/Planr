import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await currentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const vendorId = params.id
    const body = await request.json()

    // Get user's couple data first to verify ownership
    const { data: userData } = await supabase
      .from('users')
      .select(`
        couples (id)
      `)
      .eq('clerk_user_id', user.id)
      .single()

    if (!userData?.couples?.[0]) {
      return NextResponse.json({ error: 'No couple data found' }, { status: 404 })
    }

    const coupleId = userData.couples[0].id

    // Verify vendor belongs to this couple
    const { data: existingVendor } = await supabase
      .from('vendors')
      .select('id, couple_id')
      .eq('id', vendorId)
      .eq('couple_id', coupleId)
      .single()

    if (!existingVendor) {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 })
    }

    // Convert numeric fields
    const updateData = { ...body }
    if (updateData.estimated_cost) {
      updateData.estimated_cost = Number(updateData.estimated_cost)
    }
    if (updateData.actual_cost) {
      updateData.actual_cost = Number(updateData.actual_cost)
    }
    if (updateData.rating) {
      updateData.rating = Number(updateData.rating)
    }

    // Update vendor
    const { data: vendor, error } = await supabase
      .from('vendors')
      .update(updateData)
      .eq('id', vendorId)
      .select(`
        *,
        vendor_categories (
          id,
          name,
          icon,
          color
        )
      `)
      .single()

    if (error) {
      console.error('Error updating vendor:', error)
      return NextResponse.json(
        { error: 'Failed to update vendor', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: vendor
    })

  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await currentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const vendorId = params.id

    // Get user's couple data first to verify ownership
    const { data: userData } = await supabase
      .from('users')
      .select(`
        couples (id)
      `)
      .eq('clerk_user_id', user.id)
      .single()

    if (!userData?.couples?.[0]) {
      return NextResponse.json({ error: 'No couple data found' }, { status: 404 })
    }

    const coupleId = userData.couples[0].id

    // Delete vendor (this will cascade delete related documents and expenses)
    const { error } = await supabase
      .from('vendors')
      .delete()
      .eq('id', vendorId)
      .eq('couple_id', coupleId)

    if (error) {
      console.error('Error deleting vendor:', error)
      return NextResponse.json(
        { error: 'Failed to delete vendor', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Vendor deleted successfully'
    })

  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}