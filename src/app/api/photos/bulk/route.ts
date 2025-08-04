import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'
import cloudinary from '@/lib/cloudinary'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// POST bulk operations on photos
export async function POST(request: NextRequest) {
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
    const { operation, photo_ids, data } = body

    if (!operation || !photo_ids || !Array.isArray(photo_ids) || photo_ids.length === 0) {
      return NextResponse.json({ error: 'Invalid request parameters' }, { status: 400 })
    }

    // Verify all photos belong to this couple
    const { data: photos, error: photosError } = await supabaseAdmin
      .from('photos')
      .select('id, cloudinary_public_id')
      .eq('couple_id', coupleId)
      .in('id', photo_ids)

    if (photosError || !photos || photos.length !== photo_ids.length) {
      return NextResponse.json({ error: 'Some photos not found or not accessible' }, { status: 404 })
    }

    let results = []

    switch (operation) {
      case 'delete':
        // Delete from Cloudinary first
        for (const photo of photos) {
          if (photo.cloudinary_public_id) {
            try {
              await cloudinary.uploader.destroy(photo.cloudinary_public_id)
            } catch (cloudinaryError) {
              console.error('Cloudinary deletion error:', cloudinaryError)
            }
          }
        }

        // Delete related records first
        await supabaseAdmin
          .from('photo_comments')
          .delete()
          .in('photo_id', photo_ids)

        await supabaseAdmin
          .from('photo_reactions')
          .delete()
          .in('photo_id', photo_ids)

        await supabaseAdmin
          .from('photo_shares')
          .delete()
          .in('photo_id', photo_ids)

        // Delete photos from database
        const { error: deleteError } = await supabaseAdmin
          .from('photos')
          .delete()
          .eq('couple_id', coupleId)
          .in('id', photo_ids)

        if (deleteError) {
          return NextResponse.json({ error: 'Failed to delete photos' }, { status: 500 })
        }

        results = photo_ids.map(id => ({ id, success: true }))
        break

      case 'favorite':
        const { is_favorite } = data
        if (typeof is_favorite !== 'boolean') {
          return NextResponse.json({ error: 'is_favorite must be a boolean' }, { status: 400 })
        }

        const { error: favoriteError } = await supabaseAdmin
          .from('photos')
          .update({ 
            is_favorite,
            updated_at: new Date().toISOString()
          })
          .eq('couple_id', coupleId)
          .in('id', photo_ids)

        if (favoriteError) {
          return NextResponse.json({ error: 'Failed to update favorite status' }, { status: 500 })
        }

        results = photo_ids.map(id => ({ id, success: true, is_favorite }))
        break

      case 'move_to_album':
        const { album_id } = data
        
        // Verify album belongs to this couple if album_id is provided
        if (album_id) {
          const { data: album, error: albumError } = await supabaseAdmin
            .from('photo_albums')
            .select('id')
            .eq('id', album_id)
            .eq('couple_id', coupleId)
            .single()

          if (albumError || !album) {
            return NextResponse.json({ error: 'Album not found' }, { status: 404 })
          }
        }

        const { error: moveError } = await supabaseAdmin
          .from('photos')
          .update({ 
            album_id: album_id || null,
            updated_at: new Date().toISOString()
          })
          .eq('couple_id', coupleId)
          .in('id', photo_ids)

        if (moveError) {
          return NextResponse.json({ error: 'Failed to move photos to album' }, { status: 500 })
        }

        results = photo_ids.map(id => ({ id, success: true, album_id }))
        break

      case 'add_tags':
        const { tags } = data
        if (!Array.isArray(tags)) {
          return NextResponse.json({ error: 'tags must be an array' }, { status: 400 })
        }

        // Get current photos with their tags
        const { data: currentPhotos, error: currentError } = await supabaseAdmin
          .from('photos')
          .select('id, tags')
          .eq('couple_id', coupleId)
          .in('id', photo_ids)

        if (currentError) {
          return NextResponse.json({ error: 'Failed to get current photos' }, { status: 500 })
        }

        // Update each photo with merged tags
        for (const photo of currentPhotos) {
          const currentTags = photo.tags || []
          const mergedTags = currentTags.concat(tags)
          const newTags = Array.from(new Set(mergedTags)) // Merge and deduplicate

          const { error: tagError } = await supabaseAdmin
            .from('photos')
            .update({ 
              tags: newTags,
              updated_at: new Date().toISOString()
            })
            .eq('id', photo.id)

          if (tagError) {
            console.error('Tag update error for photo', photo.id, tagError)
            results.push({ id: photo.id, success: false, error: tagError.message })
          } else {
            results.push({ id: photo.id, success: true, tags: newTags })
          }
        }
        break

      default:
        return NextResponse.json({ error: 'Unsupported operation' }, { status: 400 })
    }

    const successCount = results.filter(r => r.success).length
    const failedCount = results.length - successCount

    return NextResponse.json({
      success: true,
      operation,
      total: photo_ids.length,
      successCount,
      failedCount,
      results
    })
  } catch (error) {
    console.error('Bulk photo operation error:', error)
    return NextResponse.json({ error: 'Failed to perform bulk operation' }, { status: 500 })
  }
}