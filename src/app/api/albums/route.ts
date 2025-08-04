import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'

// Use service role key for bypassing RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const user = await currentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's couple data
    const { data: userData } = await supabaseAdmin
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

    // Get albums with photo counts
    const { data: albums, error } = await supabaseAdmin
      .from('photo_albums')
      .select(`
        *,
        photos:photos(count),
        cover_photo:cover_photo_id(
          id,
          cloudinary_secure_url,
          title
        )
      `)
      .eq('couple_id', coupleId)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch albums',
        details: error.message
      }, { status: 400 })
    }

    // Transform the data to include photo counts
    const transformedAlbums = albums?.map(album => ({
      ...album,
      photo_count: album.photos?.[0]?.count || 0,
      photos: undefined // Remove the raw count data
    })) || []

    return NextResponse.json({
      success: true,
      data: {
        albums: transformedAlbums
      }
    })

  } catch (error) {
    console.error('Albums fetch API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await currentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, description, is_public, is_featured } = body

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Album name is required' }, { status: 400 })
    }

    // Get user's couple data
    const { data: userData } = await supabaseAdmin
      .from('users')
      .select(`
        couples (id)
      `)
      .eq('clerk_user_id', user.id)
      .single()

    if (!userData?.couples?.[0]) {
      return NextResponse.json({ 
        error: 'No couple data found. Please complete onboarding first.',
        redirect: '/onboarding'
      }, { status: 404 })
    }

    const coupleId = userData.couples[0].id

    // Create new album
    const albumData = {
      couple_id: coupleId,
      name: name.trim(),
      description: description?.trim() || null,
      is_public: Boolean(is_public),
      is_featured: Boolean(is_featured)
    }

    const { data: album, error } = await supabaseAdmin
      .from('photo_albums')
      .insert(albumData)
      .select(`
        *,
        photos:photos(count)
      `)
      .single()

    if (error) {
      console.error('Error creating album:', error)
      return NextResponse.json({
        error: 'Failed to create album',
        details: error.message
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: {
        ...album,
        photo_count: 0
      },
      message: 'Album created successfully!'
    })

  } catch (error) {
    console.error('Album creation API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await currentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { id, name, description, is_public, is_featured, cover_photo_id } = body

    if (!id || !name?.trim()) {
      return NextResponse.json({ error: 'Album ID and name are required' }, { status: 400 })
    }

    // Get user's couple data to verify ownership
    const { data: userData } = await supabaseAdmin
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

    // Update album
    const updateData = {
      name: name.trim(),
      description: description?.trim() || null,
      is_public: Boolean(is_public),
      is_featured: Boolean(is_featured),
      cover_photo_id: cover_photo_id || null
    }

    const { data: album, error } = await supabaseAdmin
      .from('photo_albums')
      .update(updateData)
      .eq('id', id)
      .eq('couple_id', coupleId) // Ensure user owns this album
      .select(`
        *,
        photos:photos(count),
        cover_photo:cover_photo_id(
          id,
          cloudinary_secure_url,
          title
        )
      `)
      .single()

    if (error) {
      console.error('Error updating album:', error)
      return NextResponse.json({
        error: 'Failed to update album',
        details: error.message
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: {
        ...album,
        photo_count: album.photos?.[0]?.count || 0,
        photos: undefined
      },
      message: 'Album updated successfully!'
    })

  } catch (error) {
    console.error('Album update API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await currentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const albumId = searchParams.get('id')

    if (!albumId) {
      return NextResponse.json({ error: 'Album ID is required' }, { status: 400 })
    }

    // Get user's couple data to verify ownership
    const { data: userData } = await supabaseAdmin
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

    // Check if album exists and user owns it
    const { data: album } = await supabaseAdmin
      .from('photo_albums')
      .select('id, name')
      .eq('id', albumId)
      .eq('couple_id', coupleId)
      .single()

    if (!album) {
      return NextResponse.json({ error: 'Album not found' }, { status: 404 })
    }

    // Update photos to remove album association (set album_id to null)
    await supabaseAdmin
      .from('photos')
      .update({ album_id: null })
      .eq('album_id', albumId)

    // Delete the album
    const { error } = await supabaseAdmin
      .from('photo_albums')
      .delete()
      .eq('id', albumId)
      .eq('couple_id', coupleId)

    if (error) {
      console.error('Error deleting album:', error)
      return NextResponse.json({
        error: 'Failed to delete album',
        details: error.message
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: `Album "${album.name}" deleted successfully! Photos have been moved to "Uncategorized".`
    })

  } catch (error) {
    console.error('Album deletion API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}