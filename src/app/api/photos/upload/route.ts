import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import cloudinary, { CLOUDINARY_FOLDER } from '@/lib/cloudinary'
import { auth } from '@clerk/nextjs/server'

// Use service role key for bypassing RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's couple data using admin client
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select(`
        id,
        couples (id)
      `)
      .eq('clerk_user_id', userId)
      .single()

    if (userError || !userData?.couples?.[0]) {
      return NextResponse.json({ 
        error: 'No couple data found. Please complete onboarding first.',
        redirect: '/onboarding'
      }, { status: 404 })
    }

    const coupleId = userData.couples[0].id

    // Parse form data
    const formData = await request.formData()
    const files = formData.getAll('files') as File[]
    const albumId = formData.get('albumId') as string
    const eventType = formData.get('eventType') as string
    const photoDate = formData.get('photoDate') as string
    const location = formData.get('location') as string
    const photographer = formData.get('photographer') as string

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 })
    }

    const uploadResults = []

    for (const file of files) {
      try {
        // Convert file to buffer
        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)

        // Upload to Cloudinary
        const uploadResult = await new Promise((resolve, reject) => {
          cloudinary.uploader.upload_stream(
            {
              folder: `${CLOUDINARY_FOLDER}/${coupleId}`,
              transformation: [
                { width: 1920, height: 1080, crop: 'limit' },
                { quality: 'auto' },
                { format: 'webp' }
              ],
              tags: [eventType, 'wedding', coupleId].filter(Boolean),
              context: {
                couple_id: coupleId,
                event_type: eventType || 'general',
                uploaded_by: userId
              }
            },
            (error, result) => {
              if (error) reject(error)
              else resolve(result)
            }
          ).end(buffer)
        })

        const cloudResult = uploadResult as any

        // Save photo metadata to database
        const photoData = {
          couple_id: coupleId,
          album_id: albumId || null,
          title: file.name.replace(/\.[^/.]+$/, ''), // Remove extension
          cloudinary_public_id: cloudResult.public_id,
          cloudinary_url: cloudResult.url,
          cloudinary_secure_url: cloudResult.secure_url,
          original_filename: file.name,
          file_size: cloudResult.bytes,
          width: cloudResult.width,
          height: cloudResult.height,
          format: cloudResult.format,
          photo_date: photoDate ? new Date(photoDate).toISOString().split('T')[0] : null,
          location: location || null,
          photographer: photographer || null,
          event_type: eventType || 'general',
          tags: [eventType, location, photographer].filter(Boolean)
        }

        const { data: photo, error: photoError } = await supabaseAdmin
          .from('photos')
          .insert(photoData)
          .select(`
            *,
            photo_albums (
              id,
              name
            )
          `)
          .single()

        if (photoError) {
          console.error('Error saving photo to database:', photoError)
          // Delete from Cloudinary if database save fails
          await cloudinary.uploader.destroy(cloudResult.public_id)
          throw new Error(`Failed to save photo: ${photoError.message}`)
        }

        uploadResults.push({
          success: true,
          photo,
          cloudinary: {
            public_id: cloudResult.public_id,
            url: cloudResult.secure_url
          }
        })

      } catch (error) {
        console.error('Error uploading file:', file.name, error)
        uploadResults.push({
          success: false,
          filename: file.name,
          error: error instanceof Error ? error.message : 'Upload failed'
        })
      }
    }

    const successCount = uploadResults.filter(r => r.success).length
    const failCount = uploadResults.filter(r => !r.success).length

    return NextResponse.json({
      success: true,
      message: `Uploaded ${successCount} photo${successCount !== 1 ? 's' : ''}${failCount > 0 ? ` (${failCount} failed)` : ''}`,
      results: uploadResults,
      stats: {
        total: files.length,
        success: successCount,
        failed: failCount
      }
    })

  } catch (error) {
    console.error('Photo upload API error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to upload photos',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Get photos endpoint
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's couple data
    const { data: userData } = await supabaseAdmin
      .from('users')
      .select(`
        couples (id)
      `)
      .eq('clerk_user_id', userId)
      .single()

    if (!userData?.couples?.[0]) {
      return NextResponse.json({ error: 'No couple data found' }, { status: 404 })
    }

    const coupleId = userData.couples[0].id
    const { searchParams } = new URL(request.url)
    const albumId = searchParams.get('albumId')
    const eventType = searchParams.get('eventType')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build query
    let query = supabaseAdmin
      .from('photos')
      .select(`
        *,
        photo_albums (
          id,
          name,
          description
        )
      `)
      .eq('couple_id', coupleId)

    if (albumId && albumId !== 'all') {
      query = query.eq('album_id', albumId)
    }

    if (eventType && eventType !== 'all') {
      query = query.eq('event_type', eventType)
    }

    const { data: photos, error } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch photos',
        details: error.message
      }, { status: 400 })
    }

    // Get photo statistics
    const { data: stats } = await supabaseAdmin
      .rpc('get_photo_stats', { p_couple_id: coupleId })

    return NextResponse.json({
      success: true,
      data: {
        photos: photos || [],
        stats: stats?.[0] || {
          total_photos: 0,
          total_albums: 0,
          favorite_photos: 0,
          shared_photos: 0,
          total_comments: 0,
          total_reactions: 0,
          storage_used: 0
        },
        pagination: {
          offset,
          limit,
          hasMore: photos && photos.length === limit
        }
      }
    })

  } catch (error) {
    console.error('Photo fetch API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}