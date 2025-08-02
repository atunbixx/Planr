import { createServerClient } from './supabase-server'

/**
 * Ensures user settings exist in the database
 * Creates default settings if they don't exist
 */
export async function ensureUserSettings(userId: string) {
  const supabase = createServerClient()
  
  // Check if settings exist
  const { data: existingSettings, error: checkError } = await supabase
    .from('user_settings')
    .select('id')
    .eq('user_id', userId)
    .single()

  if (checkError && checkError.code !== 'PGRST116') {
    throw new Error('Failed to check user settings')
  }

  // If settings don't exist, create them
  if (!existingSettings) {
    const { error: createError } = await supabase
      .rpc('initialize_user_settings', {
        p_user_id: userId,
        p_country_code: 'US'
      })

    if (createError) {
      throw new Error('Failed to initialize user settings')
    }
  }

  return true
}

/**
 * Updates user settings with automatic creation if needed
 */
export async function updateUserSettings(userId: string, updates: Record<string, any>) {
  const supabase = createServerClient()
  
  // Ensure settings exist
  await ensureUserSettings(userId)

  // Add timestamp
  const settingsUpdate = {
    ...updates,
    last_updated: new Date().toISOString()
  }

  // Update settings
  const { error: updateError } = await supabase
    .from('user_settings')
    .update(settingsUpdate)
    .eq('user_id', userId)

  if (updateError) {
    throw new Error('Failed to update user settings')
  }

  return true
}

/**
 * Validates file upload constraints
 */
export function validateFileUpload(file: File, options: {
  maxSize?: number
  allowedTypes?: string[]
} = {}) {
  const {
    maxSize = 5 * 1024 * 1024, // 5MB default
    allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
  } = options

  const errors: string[] = []

  // Check file type
  if (!allowedTypes.includes(file.type)) {
    errors.push(`Invalid file type. Allowed types: ${allowedTypes.join(', ')}`)
  }

  // Check file size
  if (file.size > maxSize) {
    const maxSizeMB = maxSize / (1024 * 1024)
    errors.push(`File size too large. Maximum size is ${maxSizeMB}MB`)
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Sanitizes file name for storage
 */
export function sanitizeFileName(fileName: string): string {
  return fileName
    .toLowerCase()
    .replace(/[^a-z0-9.-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}