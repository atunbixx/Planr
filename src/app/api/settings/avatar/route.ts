import { NextRequest } from 'next/server'
import { createServerClient, requireAuth, createErrorResponse, createSuccessResponse } from '@/lib/supabase-server'

// POST /api/settings/avatar - Handle avatar upload
export async function POST(request: NextRequest) {
  try {
    // Require authentication
    const { user, error: authError } = await requireAuth()
    if (authError) return authError

    // Get form data
    const formData = await request.formData()
    const file = formData.get('avatar') as File

    if (!file) {
      return createErrorResponse('No file provided', 400)
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return createErrorResponse('Invalid file type. Only JPEG, PNG, and WebP images are allowed', 400)
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      return createErrorResponse('File size too large. Maximum size is 5MB', 400)
    }

    const supabase = createServerClient()

    // Generate unique filename
    const timestamp = Date.now()
    const fileExt = file.name.split('.').pop()
    const fileName = `${user!.id}/${timestamp}.${fileExt}`

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(fileName, file, {
        contentType: file.type,
        upsert: false
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return createErrorResponse('Failed to upload avatar', 500)
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(fileName)

    // Delete old avatar if exists
    const { data: { user: currentUser } } = await supabase.auth.getUser()
    const oldAvatarUrl = currentUser?.user_metadata?.avatar_url

    if (oldAvatarUrl && oldAvatarUrl.includes('avatars/')) {
      // Extract path from old URL
      const oldPath = oldAvatarUrl.split('avatars/')[1]
      if (oldPath) {
        // Delete old file (don't fail if this errors)
        await supabase.storage
          .from('avatars')
          .remove([`${user!.id}/${oldPath.split('/').pop()}`])
          .catch(err => console.warn('Failed to delete old avatar:', err))
      }
    }

    // Update user metadata with new avatar URL
    const { error: updateError } = await supabase.auth.updateUser({
      data: {
        avatar_url: publicUrl
      }
    })

    if (updateError) {
      console.error('Error updating user metadata:', updateError)
      // Try to clean up uploaded file
      await supabase.storage.from('avatars').remove([fileName])
      return createErrorResponse('Failed to update profile with new avatar', 500)
    }

    return createSuccessResponse(
      { avatarUrl: publicUrl },
      'Avatar uploaded successfully'
    )
  } catch (error) {
    console.error('Avatar upload error:', error)
    return createErrorResponse('Internal server error', 500)
  }
}

// DELETE /api/settings/avatar - Remove avatar
export async function DELETE(request: NextRequest) {
  try {
    // Require authentication
    const { user, error: authError } = await requireAuth()
    if (authError) return authError

    const supabase = createServerClient()

    // Get current avatar URL
    const { data: { user: currentUser } } = await supabase.auth.getUser()
    const avatarUrl = currentUser?.user_metadata?.avatar_url

    if (avatarUrl && avatarUrl.includes('avatars/')) {
      // Extract path from URL
      const path = avatarUrl.split('avatars/')[1]
      if (path) {
        // Delete file from storage
        const { error: deleteError } = await supabase.storage
          .from('avatars')
          .remove([`${user!.id}/${path.split('/').pop()}`])

        if (deleteError) {
          console.error('Error deleting avatar file:', deleteError)
          // Continue anyway to clear the URL from user metadata
        }
      }
    }

    // Clear avatar URL from user metadata
    const { error: updateError } = await supabase.auth.updateUser({
      data: {
        avatar_url: null
      }
    })

    if (updateError) {
      console.error('Error updating user metadata:', updateError)
      return createErrorResponse('Failed to remove avatar', 500)
    }

    return createSuccessResponse(
      { avatarUrl: null },
      'Avatar removed successfully'
    )
  } catch (error) {
    console.error('Avatar deletion error:', error)
    return createErrorResponse('Internal server error', 500)
  }
}