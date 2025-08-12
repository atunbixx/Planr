import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase-admin-transformed'
import cloudinary, { CLOUDINARY_FOLDER } from '@/lib/cloudinary'
import { getCurrentUser } from '@/lib/auth/server'
import { transformToCamelCase } from '@/lib/db/field-mappings'

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's couple data using transformed admin client
    const supabase = getAdminClient()
    
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('supabaseUserId', user.id)
      .single()

    if (userError || !userData) {
      return NextResponse.json({ 
        error: 'User not found',
        redirect: '/sign-in'
      }, { status: 404 })
    }

    // Get couple data from wedding_couples table - now we can use camelCase!
    const { data: coupleData, error: coupleError } = await supabase
      .from('wedding_couples')
      .select('id')
      .or(`partner1UserId.eq.${userData.id},partner2UserId.eq.${userData.id}`)
      .single()

    if (coupleError || !coupleData) {
      return NextResponse.json({ 
        error: 'No couple data found. Please complete onboarding first.',
        redirect: '/onboarding'
      }, { status: 404 })
    }

    const coupleId = coupleData.id

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
                coupleId: coupleId,
                eventType: eventType || 'general',
                uploadedBy: user.id
              }
            },
            (error, result) => {
              if (error) reject(error)
              else resolve(result)
            }
          ).end(buffer)
        })

        const cloudResult = uploadResult as any

        // Save photo metadata to database - now using camelCase!
        const photoData = {
          coupleId: coupleId,
          albumId: albumId || null,
          title: file.name.replace(/\.[^/.]+$/, ''), // Remove extension
          cloudinaryPublicId: cloudResult.public_id,
          cloudinaryUrl: cloudResult.url,
          cloudinarySecureUrl: cloudResult.secure_url,
          originalFilename: file.name,
          fileSize: cloudResult.bytes,
          width: cloudResult.width,
          height: cloudResult.height,
          format: cloudResult.format,
          photoDate: photoDate ? new Date(photoDate).toISOString().split('T')[0] : null,
          location: location || null,
          photographer: photographer || null,
          eventType: eventType || 'general',
          tags: [eventType, location, photographer].filter(Boolean),
          imageUrl: cloudResult.secure_url // This is required field
        }

        const { data: photo, error: photoError } = await supabase
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
    
    // More detailed error logging
    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      })
    }
    
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
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's couple data using transformed admin client
    const supabase = getAdminClient()
    
    const { data: userData } = await supabase
      .from('users')
      .select('id')
      .eq('supabaseUserId', user.id)
      .single()

    if (!userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get couple data from wedding_couples table - now we can use camelCase!
    const { data: coupleData } = await supabase
      .from('wedding_couples')
      .select('id')
      .or(`partner1UserId.eq.${userData.id},partner2UserId.eq.${userData.id}`)
      .single()

    if (!coupleData) {
      return NextResponse.json({ error: 'No couple data found' }, { status: 404 })
    }

    const coupleId = coupleData.id
    const { searchParams } = new URL(request.url)
    const albumId = searchParams.get('albumId')
    const eventType = searchParams.get('eventType')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build query - now using camelCase fields!
    let query = supabase
      .from('photos')
      .select(`
        *,
        photo_albums (
          id,
          name,
          description
        )
      `)
      .eq('coupleId', coupleId)

    if (albumId && albumId !== 'all') {
      query = query.eq('albumId', albumId)
    }

    if (eventType && eventType !== 'all') {
      query = query.eq('eventType', eventType)
    }

    const { data: photos, error } = await query
      .order('createdAt', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch photos',
        details: error.message
      }, { status: 400 })
    }

    // Get photo statistics - using camelCase parameter
    const { data: stats } = await supabase
      .rpc('get_photo_stats', { pCoupleId: coupleId })

    return NextResponse.json({
      success: true,
      data: {
        photos: photos || [],
        stats: stats?.[0] || {
          totalPhotos: 0,
          totalAlbums: 0,
          favoritePhotos: 0,
          privatePhotos: 0,
          totalComments: 0,
          totalReactions: 0,
          storageUsed: 0
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