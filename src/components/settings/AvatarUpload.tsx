'use client'

import React, { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase'
import { cn } from '@/utils/cn'

interface AvatarUploadProps {
  currentAvatarUrl?: string
  userId: string
  onUploadComplete?: (url: string) => void
  size?: 'sm' | 'md' | 'lg'
}

export function AvatarUpload({ 
  currentAvatarUrl, 
  userId, 
  onUploadComplete,
  size = 'md' 
}: AvatarUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentAvatarUrl || null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-32 h-32'
  }

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file (JPG, PNG, or GIF)",
        variant: "destructive"
      })
      return
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image smaller than 5MB",
        variant: "destructive"
      })
      return
    }

    // Create preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string)
    }
    reader.readAsDataURL(file)

    // Upload to Supabase Storage
    setUploading(true)
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${userId}-${Date.now()}.${fileExt}`
      const filePath = `avatars/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          upsert: true
        })

      if (uploadError) throw uploadError

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      // Update user profile
      const { error: updateError } = await supabase.auth.updateUser({
        data: { avatar_url: publicUrl }
      })

      if (updateError) throw updateError

      toast({
        title: "Avatar uploaded",
        description: "Your profile photo has been updated successfully"
      })

      onUploadComplete?.(publicUrl)
    } catch (error) {
      console.error('Avatar upload error:', error)
      toast({
        title: "Upload failed",
        description: "Failed to upload avatar. Please try again.",
        variant: "destructive"
      })
      setPreviewUrl(currentAvatarUrl || null)
    } finally {
      setUploading(false)
    }
  }

  const handleRemoveAvatar = async () => {
    setUploading(true)
    try {
      const { error } = await supabase.auth.updateUser({
        data: { avatar_url: null }
      })

      if (error) throw error

      setPreviewUrl(null)
      toast({
        title: "Avatar removed",
        description: "Your profile photo has been removed"
      })

      onUploadComplete?.('')
    } catch (error) {
      console.error('Avatar removal error:', error)
      toast({
        title: "Removal failed",
        description: "Failed to remove avatar. Please try again.",
        variant: "destructive"
      })
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="flex items-center space-x-6">
      <motion.div 
        className={cn(
          "relative rounded-full overflow-hidden bg-gray-200",
          sizeClasses[size]
        )}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <AnimatePresence mode="wait">
          {previewUrl ? (
            <motion.img
              key="avatar"
              src={previewUrl}
              alt="Profile avatar"
              className="w-full h-full object-cover"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            />
          ) : (
            <motion.div
              key="placeholder"
              className="w-full h-full flex items-center justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <i className="fas fa-user text-gray-400 text-3xl"></i>
            </motion.div>
          )}
        </AnimatePresence>

        {uploading && (
          <motion.div
            className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          </motion.div>
        )}
      </motion.div>

      <div className="space-y-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
          disabled={uploading}
        />
        
        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            <i className="fas fa-upload mr-2"></i>
            {previewUrl ? 'Change' : 'Upload'} Photo
          </Button>

          {previewUrl && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
            >
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRemoveAvatar}
                disabled={uploading}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <i className="fas fa-trash"></i>
              </Button>
            </motion.div>
          )}
        </div>

        <p className="text-sm text-gray-500">
          JPG, PNG or GIF. Max size 5MB.
        </p>
      </div>
    </div>
  )
}