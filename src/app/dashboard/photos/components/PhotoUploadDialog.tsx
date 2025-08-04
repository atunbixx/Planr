'use client'

import React, { useState, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Upload, X, Image, Plus, Check, AlertCircle } from 'lucide-react'
import { useUser } from '@clerk/nextjs'

interface Album {
  id: string
  name: string
}

interface PhotoUploadDialogProps {
  albums: Album[]
  variant?: 'default' | 'outline' | 'secondary'
  defaultAlbumId?: string
  trigger?: React.ReactNode
}

interface FileWithPreview extends File {
  preview?: string
  id: string
}

export default function PhotoUploadDialog({ albums, variant = 'default', defaultAlbumId, trigger }: PhotoUploadDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [files, setFiles] = useState<FileWithPreview[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [uploadResults, setUploadResults] = useState<any>(null)
  const { user } = useUser()
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dropRef = useRef<HTMLDivElement>(null)

  const [formData, setFormData] = useState({
    albumId: defaultAlbumId || '',
    eventType: 'general',
    photoDate: '',
    location: '',
    photographer: ''
  })

  const eventTypes = [
    { value: 'general', label: 'General' },
    { value: 'engagement', label: 'Engagement' },
    { value: 'ceremony', label: 'Wedding Ceremony' },
    { value: 'reception', label: 'Reception' },
    { value: 'venue_visit', label: 'Venue Visit' },
    { value: 'dress_shopping', label: 'Dress Shopping' },
    { value: 'cake_tasting', label: 'Cake Tasting' },
    { value: 'flowers_decor', label: 'Flowers & Decor' },
    { value: 'inspiration', label: 'Inspiration' }
  ]

  const resetForm = () => {
    setFiles([])
    setFormData({
      albumId: '',
      eventType: 'general',
      photoDate: '',
      location: '',
      photographer: ''
    })
    setUploadProgress(0)
    setError(null)
    setUploadResults(null)
  }

  const handleClose = () => {
    setIsOpen(false)
    resetForm()
  }

  const handleFileSelect = useCallback((selectedFiles: FileList | null) => {
    if (!selectedFiles) return

    const newFiles: FileWithPreview[] = Array.from(selectedFiles)
      .filter(file => file.type.startsWith('image/'))
      .map(file => {
        const fileWithId = Object.assign(file, {
          id: Math.random().toString(36).substr(2, 9),
          preview: URL.createObjectURL(file)
        })
        return fileWithId
      })

    setFiles(prev => [...prev, ...newFiles])
  }, [])

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    handleFileSelect(e.dataTransfer.files)
  }, [handleFileSelect])

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
  }, [])

  const removeFile = (fileId: string) => {
    setFiles(prev => {
      const updatedFiles = prev.filter(f => f.id !== fileId)
      // Revoke object URL to prevent memory leaks
      const fileToRemove = prev.find(f => f.id === fileId)
      if (fileToRemove?.preview) {
        URL.revokeObjectURL(fileToRemove.preview)
      }
      return updatedFiles
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.id) {
      setError('You must be logged in to upload photos')
      return
    }

    if (files.length === 0) {
      setError('Please select at least one photo to upload')
      return
    }

    setIsUploading(true)
    setError(null)
    setUploadProgress(0)

    try {
      const formDataObj = new FormData()
      
      // Add all files
      files.forEach(file => {
        formDataObj.append('files', file)
      })

      // Add metadata
      if (formData.albumId) formDataObj.append('albumId', formData.albumId)
      formDataObj.append('eventType', formData.eventType)
      if (formData.photoDate) formDataObj.append('photoDate', formData.photoDate)
      if (formData.location) formDataObj.append('location', formData.location)
      if (formData.photographer) formDataObj.append('photographer', formData.photographer)

      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90))
      }, 200)

      const response = await fetch('/api/photos/upload', {
        method: 'POST',
        body: formDataObj
      })

      clearInterval(progressInterval)
      setUploadProgress(100)

      const result = await response.json()

      if (!response.ok || !result.success) {
        if (result.redirect) {
          window.location.href = result.redirect
          return
        }
        throw new Error(result.error || result.details || 'Failed to upload photos')
      }

      setUploadResults(result)
      
      // Auto-close after 3 seconds if all uploads were successful
      if (result.stats.failed === 0) {
        setTimeout(() => {
          handleClose()
          // Refresh the page to show new photos
          window.location.reload()
        }, 3000)
      }

    } catch (error: any) {
      console.error('Error uploading photos:', error)
      setError(error.message || 'Failed to upload photos. Please try again.')
      setUploadProgress(0)
    } finally {
      setIsUploading(false)
    }
  }

  // Cleanup object URLs on unmount
  React.useEffect(() => {
    return () => {
      files.forEach(file => {
        if (file.preview) {
          URL.revokeObjectURL(file.preview)
        }
      })
    }
  }, [files])

  const defaultTrigger = (
    <Button onClick={() => setIsOpen(true)} variant={variant}>
      <Plus className="h-4 w-4 mr-2" />
      Upload Photos
    </Button>
  )

  if (!isOpen) {
    return trigger ? (
      <div onClick={() => setIsOpen(true)}>
        {trigger}
      </div>
    ) : defaultTrigger
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Upload Photos</CardTitle>
              <CardDescription>Add photos to your wedding gallery</CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              disabled={isUploading}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {uploadResults ? (
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-6xl mb-4">
                  {uploadResults.stats.failed === 0 ? '✅' : '⚠️'}
                </div>
                <h3 className="text-lg font-semibold mb-2">Upload Complete!</h3>
                <p className="text-muted-foreground mb-4">
                  {uploadResults.message}
                </p>
                
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-green-600">
                      {uploadResults.stats.success}
                    </div>
                    <p className="text-sm text-muted-foreground">Successful</p>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-red-600">
                      {uploadResults.stats.failed}
                    </div>
                    <p className="text-sm text-muted-foreground">Failed</p>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">
                      {uploadResults.stats.total}
                    </div>
                    <p className="text-sm text-muted-foreground">Total</p>
                  </div>
                </div>

                {uploadResults.stats.failed === 0 && (
                  <p className="text-sm text-muted-foreground mt-4">
                    Redirecting to gallery in 3 seconds...
                  </p>
                )}
              </div>

              <div className="flex justify-center gap-2">
                <Button onClick={handleClose}>
                  Close
                </Button>
                {uploadResults.stats.failed > 0 && (
                  <Button variant="outline" onClick={() => setUploadResults(null)}>
                    Try Again
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  {error}
                </div>
              )}

              {/* File Upload Area */}
              <div
                ref={dropRef}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Drop photos here or click to browse</h3>
                <p className="text-muted-foreground mb-4">
                  Support for JPG, PNG, WebP. Max 10MB per file.
                </p>
                <Button type="button" variant="outline">
                  <Image className="h-4 w-4 mr-2" />
                  Select Photos
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => handleFileSelect(e.target.files)}
                  className="hidden"
                />
              </div>

              {/* Selected Files Preview */}
              {files.length > 0 && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="font-semibold">Selected Photos</h4>
                    <Badge variant="outline">{files.length} file{files.length !== 1 ? 's' : ''}</Badge>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-h-48 overflow-y-auto">
                    {files.map((file) => (
                      <div key={file.id} className="relative group">
                        <div className="aspect-square rounded-lg overflow-hidden border bg-gray-100">
                          <img
                            src={file.preview}
                            alt={file.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFile(file.id)}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-3 w-3" />
                        </button>
                        <p className="text-xs text-muted-foreground mt-1 truncate">
                          {file.name}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Upload Progress */}
              {isUploading && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Uploading photos...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <Progress value={uploadProgress} className="w-full" />
                </div>
              )}

              {/* Photo Metadata */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="album">Album (Optional)</Label>
                  <Select value={formData.albumId} onValueChange={(value) => setFormData(prev => ({ ...prev, albumId: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select album" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">No Album</SelectItem>
                      {albums.map((album) => (
                        <SelectItem key={album.id} value={album.id}>
                          {album.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="eventType">Event Type</Label>
                  <Select value={formData.eventType} onValueChange={(value) => setFormData(prev => ({ ...prev, eventType: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {eventTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="photoDate">Photo Date (Optional)</Label>
                  <Input
                    id="photoDate"
                    type="date"
                    value={formData.photoDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, photoDate: e.target.value }))}
                  />
                </div>

                <div>
                  <Label htmlFor="location">Location (Optional)</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                    placeholder="e.g., Central Park, NYC"
                  />
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="photographer">Photographer (Optional)</Label>
                  <Input
                    id="photographer"
                    value={formData.photographer}
                    onChange={(e) => setFormData(prev => ({ ...prev, photographer: e.target.value }))}
                    placeholder="e.g., John Smith Photography"
                  />
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  disabled={isUploading}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={isUploading || files.length === 0}
                >
                  {isUploading ? 'Uploading...' : `Upload ${files.length} Photo${files.length !== 1 ? 's' : ''}`}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}