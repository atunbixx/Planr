import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, requireAuth, createErrorResponse, createSuccessResponse } from '@/lib/supabase-server'

// POST /api/messages/upload - Handle file uploads for messages
export async function POST(request: NextRequest) {
  try {
    // Require authentication
    const { user, error: authError } = await requireAuth()
    if (authError) return authError

    const formData = await request.formData()
    const file = formData.get('file') as File
    const vendorId = formData.get('vendorId') as string
    const messageId = formData.get('messageId') as string | null

    if (!file) {
      return createErrorResponse('No file provided')
    }

    if (!vendorId) {
      return createErrorResponse('Vendor ID is required')
    }

    const supabase = createServerClient()

    // Get the couple ID for the authenticated user
    const { data: couple, error: coupleError } = await supabase
      .from('couples')
      .select('id')
      .or(`partner1_user_id.eq.${user.id},partner2_user_id.eq.${user.id}`)
      .single()

    if (coupleError || !couple) {
      return createErrorResponse('Couple not found', 404)
    }

    // Verify vendor belongs to couple
    const { data: vendor, error: vendorError } = await supabase
      .from('vendors')
      .select('id')
      .eq('id', vendorId)
      .eq('couple_id', couple.id)
      .single()

    if (vendorError || !vendor) {
      return createErrorResponse('Vendor not found', 404)
    }

    // Validate file type and size
    const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
    const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    const ALLOWED_DOC_TYPES = ['application/pdf', 'application/msword', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel', 
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']

    if (file.size > MAX_FILE_SIZE) {
      return createErrorResponse('File size exceeds 10MB limit')
    }

    const fileType = file.type
    const isImage = ALLOWED_IMAGE_TYPES.includes(fileType)
    const isDocument = ALLOWED_DOC_TYPES.includes(fileType)

    if (!isImage && !isDocument) {
      return createErrorResponse('Invalid file type. Only images and documents are allowed.')
    }

    // Generate unique file path
    const fileExt = file.name.split('.').pop()
    const fileName = `${couple.id}/${vendorId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
    const storagePath = `message-attachments/${fileName}`

    // Upload file to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('wedding-files')
      .upload(storagePath, file, {
        contentType: file.type,
        upsert: false
      })

    if (uploadError) {
      console.error('Error uploading file:', uploadError)
      return createErrorResponse('Failed to upload file', 500)
    }

    // Get public URL for the uploaded file
    const { data: { publicUrl } } = supabase.storage
      .from('wedding-files')
      .getPublicUrl(storagePath)

    // If messageId is provided, add to message_media table
    if (messageId) {
      const { error: mediaError } = await supabase
        .rpc('add_message_media', {
          p_message_id: messageId,
          p_media_type: isImage ? 'image' : 'document',
          p_file_name: file.name,
          p_file_size: file.size,
          p_storage_path: storagePath,
          p_mime_type: file.type,
          p_uploaded_by: user.id
        })

      if (mediaError) {
        console.error('Error adding media to message:', mediaError)
        // Don't fail the upload, just log the error
      }
    }

    return createSuccessResponse({
      url: publicUrl,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      storagePath: storagePath,
      isImage,
      isDocument
    }, 'File uploaded successfully')

  } catch (error) {
    console.error('File upload API error:', error)
    return createErrorResponse('Internal server error', 500)
  }
}