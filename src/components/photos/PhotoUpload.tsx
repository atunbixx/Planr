'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Upload, X, Image as ImageIcon, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { useToast } from '@/hooks/useToast'
import { cn } from '@/utils/cn'

interface PhotoUploadProps {
  coupleId: string
  onUploadComplete?: (urls: string[]) => void
  maxFiles?: number
  acceptedFormats?: string[]
  maxSizeInMB?: number
}

interface UploadingFile {
  file: File
  progress: number
  url?: string
  error?: string
}

export function PhotoUpload({ 
  coupleId, 
  onUploadComplete,
  maxFiles = 10,
  acceptedFormats = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'],
  maxSizeInMB = 10
}: PhotoUploadProps) {
  const [uploadingFiles, setUploadingFiles] = useState<Map<string, UploadingFile>>(new Map())
  const [isUploading, setIsUploading] = useState(false)
  const supabase = createClientComponentClient()
  const { addToast } = useToast()

  // Image optimization function
  const optimizeImage = async (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      
      reader.onload = (e) => {
        const img = new Image()
        img.onload = () => {
          const canvas = document.createElement('canvas')
          const ctx = canvas.getContext('2d')
          if (!ctx) {
            reject(new Error('Failed to get canvas context'))
            return
          }

          // Calculate new dimensions (max 2048px on longest side)
          const maxDimension = 2048
          let width = img.width
          let height = img.height

          if (width > height && width > maxDimension) {
            height = (height / width) * maxDimension
            width = maxDimension
          } else if (height > maxDimension) {
            width = (width / height) * maxDimension
            height = maxDimension
          }

          canvas.width = width
          canvas.height = height

          // Draw and compress image
          ctx.drawImage(img, 0, 0, width, height)

          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('Failed to compress image'))
                return
              }

              // Create new file with the compressed blob
              const compressedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now()
              })

              resolve(compressedFile)
            },
            'image/jpeg',
            0.85 // 85% quality
          )
        }

        img.onerror = () => reject(new Error('Failed to load image'))
        img.src = e.target?.result as string
      }

      reader.onerror = () => reject(new Error('Failed to read file'))
      reader.readAsDataURL(file)
    })
  }

  const uploadFile = async (file: File): Promise<string | null> => {
    try {
      // Update progress - starting
      setUploadingFiles(prev => {
        const newMap = new Map(prev)
        newMap.set(file.name, { file, progress: 10 })
        return newMap
      })

      // Optimize image if it's larger than 2MB
      let fileToUpload = file
      if (file.size > 2 * 1024 * 1024) {
        try {
          fileToUpload = await optimizeImage(file)
          
          // Update progress - optimized
          setUploadingFiles(prev => {
            const newMap = new Map(prev)
            newMap.set(file.name, { file, progress: 25 })
            return newMap
          })
        } catch (error) {
          console.warn('Image optimization failed, uploading original', error)
        }
      }

      // Create unique file name
      const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg'
      const fileName = `${coupleId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`

      // Update progress - uploading
      setUploadingFiles(prev => {
        const newMap = new Map(prev)
        newMap.set(file.name, { file, progress: 40 })
        return newMap
      })

      // Upload to Supabase storage
      const { data, error } = await supabase.storage
        .from('wedding-photos')
        .upload(fileName, fileToUpload, {
          cacheControl: '3600',
          upsert: false
        })

      if (error) {
        console.error('Storage upload error:', error)
        throw new Error(error.message || 'Failed to upload to storage')
      }

      // Update progress - getting URL
      setUploadingFiles(prev => {
        const newMap = new Map(prev)
        newMap.set(file.name, { file, progress: 70 })
        return newMap
      })

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('wedding-photos')
        .getPublicUrl(data.path)

      // Save to database
      const { error: dbError } = await supabase
        .from('photos')
        .insert({
          couple_id: coupleId,
          image_url: publicUrl,
          caption: null,
          tags: [],
          photo_date: new Date().toISOString(),
          photographer: null,
          location: null
        })

      if (dbError) {
        console.error('Database insert error:', dbError)
        
        // Try to clean up the uploaded file
        try {
          await supabase.storage
            .from('wedding-photos')
            .remove([data.path])
        } catch (cleanupError) {
          console.error('Failed to cleanup file after DB error:', cleanupError)
        }
        
        throw new Error(dbError.message || 'Failed to save photo to database')
      }

      // Update progress - complete
      setUploadingFiles(prev => {
        const newMap = new Map(prev)
        newMap.set(file.name, { file, progress: 100, url: publicUrl })
        return newMap
      })

      return publicUrl
    } catch (error: any) {
      console.error('Upload error:', error)
      
      // Update with error
      setUploadingFiles(prev => {
        const newMap = new Map(prev)
        newMap.set(file.name, { 
          file, 
          progress: 0, 
          error: error.message || 'Upload failed' 
        })
        return newMap
      })
      
      return null
    }
  }

  const onDrop = useCallback(async (acceptedFiles: File[], rejectedFiles: any[]) => {
    // Handle rejected files
    if (rejectedFiles.length > 0) {
      const errors = rejectedFiles.map(rejection => {
        if (rejection.errors[0]?.code === 'file-too-large') {
          return `${rejection.file.name} is too large (max ${maxSizeInMB}MB)`
        }
        if (rejection.errors[0]?.code === 'file-invalid-type') {
          return `${rejection.file.name} has invalid format`
        }
        return `${rejection.file.name} was rejected`
      })
      
      addToast({
        title: 'Some files were rejected',
        description: errors.join(', '),
        type: 'error'
      })
    }

    if (acceptedFiles.length === 0) return

    setIsUploading(true)
    const uploadedUrls: string[] = []

    // Initialize uploading state for all files
    const newUploadingFiles = new Map<string, UploadingFile>()
    acceptedFiles.forEach(file => {
      newUploadingFiles.set(file.name, { file, progress: 0 })
    })
    setUploadingFiles(newUploadingFiles)

    // Upload files in parallel (but limit concurrent uploads)
    const maxConcurrent = 3
    for (let i = 0; i < acceptedFiles.length; i += maxConcurrent) {
      const batch = acceptedFiles.slice(i, i + maxConcurrent)
      const uploadPromises = batch.map(file => uploadFile(file))
      const results = await Promise.all(uploadPromises)

      // Collect successful uploads
      results.forEach(url => {
        if (url) uploadedUrls.push(url)
      })
    }

    // Show completion toast
    if (uploadedUrls.length > 0) {
      addToast({
        title: 'Photos uploaded!',
        description: `Successfully uploaded ${uploadedUrls.length} photo${uploadedUrls.length > 1 ? 's' : ''}`,
        type: 'success'
      })

      if (onUploadComplete) {
        onUploadComplete(uploadedUrls)
      }
    }

    const failedCount = acceptedFiles.length - uploadedUrls.length
    if (failedCount > 0) {
      addToast({
        title: 'Some uploads failed',
        description: `${failedCount} photo${failedCount > 1 ? 's' : ''} failed to upload`,
        type: 'error'
      })
    }

    // Clean up after delay
    setTimeout(() => {
      setUploadingFiles(new Map())
      setIsUploading(false)
    }, 2000)
  }, [coupleId, onUploadComplete, addToast, maxSizeInMB])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptedFormats.reduce((acc, format) => {
      acc[format] = []
      return acc
    }, {} as Record<string, string[]>),
    maxFiles,
    maxSize: maxSizeInMB * 1024 * 1024,
    multiple: true
  })

  const removeFile = (fileName: string) => {
    setUploadingFiles(prev => {
      const newMap = new Map(prev)
      newMap.delete(fileName)
      return newMap
    })
  }

  const retryUpload = async (fileName: string) => {
    const uploadInfo = uploadingFiles.get(fileName)
    if (!uploadInfo) return

    const url = await uploadFile(uploadInfo.file)
    if (url && onUploadComplete) {
      onUploadComplete([url])
    }
  }

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        {...getRootProps()}
        className={cn(
          "relative cursor-pointer rounded-lg border-2 border-dashed p-8 text-center transition-colors",
          isDragActive 
            ? "border-accent bg-accent/5" 
            : "border-gray-300 hover:border-gray-400",
          isUploading && "pointer-events-none opacity-60"
        )}
      >
        <input {...getInputProps()} />
        
        <div className="flex flex-col items-center gap-4">
          {isDragActive ? (
            <>
              <Upload className="h-12 w-12 text-accent animate-bounce" />
              <p className="text-lg font-medium text-accent">Drop your photos here!</p>
            </>
          ) : (
            <>
              <ImageIcon className="h-12 w-12 text-gray-400" />
              <div>
                <p className="text-lg font-medium">Drag & drop photos here</p>
                <p className="text-sm text-gray-500">or click to browse</p>
              </div>
              <p className="text-xs text-gray-400">
                Supports JPEG, PNG, WebP • Max {maxFiles} files at once • Max {maxSizeInMB}MB per file
              </p>
            </>
          )}
        </div>
      </div>

      {/* Uploading files */}
      {uploadingFiles.size > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Uploading photos...</h4>
          {Array.from(uploadingFiles.entries()).map(([fileName, uploadInfo]) => (
            <div key={fileName} className="flex items-center gap-3 rounded-lg bg-gray-50 p-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{fileName}</p>
                {uploadInfo.error ? (
                  <div className="flex items-center gap-1 mt-1">
                    <AlertCircle className="h-3 w-3 text-red-600" />
                    <p className="text-xs text-red-600">{uploadInfo.error}</p>
                  </div>
                ) : uploadInfo.progress < 100 ? (
                  <Progress value={uploadInfo.progress} className="mt-1 h-1" />
                ) : (
                  <p className="text-xs text-green-600">Upload complete!</p>
                )}
              </div>
              {uploadInfo.error ? (
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => retryUpload(fileName)}
                    className="p-1 text-xs"
                  >
                    Retry
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => removeFile(fileName)}
                    className="p-1"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                uploadInfo.progress < 100 && (
                  <span className="text-xs text-gray-500">{uploadInfo.progress}%</span>
                )
              )}
            </div>
          ))}
        </div>
      )}

      {/* Help text */}
      <div className="rounded-lg bg-blue-50 border border-blue-200 p-3">
        <p className="text-sm text-blue-800">
          <strong>Tip:</strong> For best results, upload high-quality photos. Large images will be automatically optimized for web viewing while preserving quality.
        </p>
      </div>
    </div>
  )
}