import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'
import cloudinary from '@/lib/cloudinary'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET single photo
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await currentUser()
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's couple data using admin client
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select(`
        id,
        couples (id)
      `)
      .eq('clerk_user_id', user.id)
      .single()

    if (userError || !userData?.couples?.[0]) {
      return NextResponse.json({ error: 'User not found or not part of a couple' }, { status: 404 })
    }

    const coupleId = userData.couples[0].id

    // Get photo with album information
    const { data: photo, error: photoError } = await supabaseAdmin
      .from('photos')
      .select(`
        *,
        photo_albums (
          id,
          name,
          description
        )
      `)
      .eq('id', params.id)
      .eq('couple_id', coupleId)
      .single()

    if (photoError || !photo) {
      return NextResponse.json({ error: 'Photo not found' }, { status: 404 })
    }

    return NextResponse.json({ photo })
  } catch (error) {
    console.error('Get photo error:', error)
    return NextResponse.json({ error: 'Failed to get photo' }, { status: 500 })
  }
}

// PUT update photo metadata
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await currentUser()
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's couple data using admin client
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select(`
        id,
        couples (id)
      `)
      .eq('clerk_user_id', user.id)
      .single()

    if (userError || !userData?.couples?.[0]) {
      return NextResponse.json({ error: 'User not found or not part of a couple' }, { status: 404 })
    }

    const coupleId = userData.couples[0].id
    const body = await request.json()
    const { title, description, alt_text, is_favorite, album_id, tags } = body

    // Verify photo belongs to this couple
    const { data: existingPhoto, error: checkError } = await supabaseAdmin
      .from('photos')
      .select('id')
      .eq('id', params.id)
      .eq('couple_id', coupleId)
      .single()

    if (checkError || !existingPhoto) {
      return NextResponse.json({ error: 'Photo not found' }, { status: 404 })
    }

    // Update photo metadata
    const { data: updatedPhoto, error: updateError } = await supabaseAdmin
      .from('photos')
      .update({
        title,
        description,
        alt_text,
        is_favorite,
        album_id,
        tags,
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)
      .eq('couple_id', coupleId)
      .select(`
        *,
        photo_albums (
          id,
          name,
          description
        )
      `)
      .single()

    if (updateError) {
      console.error('Update photo error:', updateError)
      return NextResponse.json({ error: 'Failed to update photo' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      photo: updatedPhoto 
    })
  } catch (error) {
    console.error('Update photo error:', error)
    return NextResponse.json({ error: 'Failed to update photo' }, { status: 500 })
  }
}

// DELETE photo
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await currentUser()
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's couple data using admin client
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select(`
        id,
        couples (id)
      `)
      .eq('clerk_user_id', user.id)
      .single()

    if (userError || !userData?.couples?.[0]) {
      return NextResponse.json({ error: 'User not found or not part of a couple' }, { status: 404 })
    }

    const coupleId = userData.couples[0].id

    // Get photo data before deletion (for Cloudinary cleanup)
    const { data: photo, error: photoError } = await supabaseAdmin
      .from('photos')
      .select('cloudinary_public_id, cloudinary_secure_url')
      .eq('id', params.id)
      .eq('couple_id', coupleId)
      .single()

    if (photoError || !photo) {
      return NextResponse.json({ error: 'Photo not found' }, { status: 404 })
    }

    // Delete from Cloudinary first
    if (photo.cloudinary_public_id) {
      try {
        await cloudinary.uploader.destroy(photo.cloudinary_public_id)
      } catch (cloudinaryError) {
        console.error('Cloudinary deletion error:', cloudinaryError)
        // Continue with database deletion even if Cloudinary fails
      }
    }

    // Delete related records first (comments, reactions, shares)
    await supabaseAdmin
      .from('photo_comments')
      .delete()
      .eq('photo_id', params.id)

    await supabaseAdmin
      .from('photo_reactions')
      .delete()
      .eq('photo_id', params.id)

    await supabaseAdmin
      .from('photo_shares')
      .delete()
      .eq('photo_id', params.id)

    // Delete the photo from database
    const { error: deleteError } = await supabaseAdmin
      .from('photos')
      .delete()
      .eq('id', params.id)
      .eq('couple_id', coupleId)

    if (deleteError) {
      console.error('Delete photo error:', deleteError)
      return NextResponse.json({ error: 'Failed to delete photo' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Photo deleted successfully' 
    })
  } catch (error) {
    console.error('Delete photo error:', error)
    return NextResponse.json({ error: 'Failed to delete photo' }, { status: 500 })
  }
}