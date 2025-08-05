'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { 
  Heart, 
  Trash2, 
  Move, 
  Download, 
  Share2, 
  Edit,
  Check,
  X,
  Loader2,
  Star
} from 'lucide-react'
import { toast } from 'sonner'
import PhotoEditDialog from './PhotoEditDialog'

interface Photo {
  id: string
  title: string | null
  description: string | null
  alt_text: string | null
  is_favorite: boolean
  album_id: string | null
  tags: string[] | null
  cloudinary_secure_url: string
  created_at: string
  photo_albums?: {
    id: string
    name: string
  } | null
}

interface Album {
  id: string
  name: string
  description: string | null
}

interface PhotoGridProps {
  photos: Photo[]
  albums: Album[]
  onPhotosUpdated: () => void
  selectable?: boolean
}

export default function PhotoGrid({ photos, albums, onPhotosUpdated, selectable = true }: PhotoGridProps) {
  const [selectedPhotos, setSelectedPhotos] = useState<Set<string>>(new Set())
  const [isSelectionMode, setIsSelectionMode] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showMoveDialog, setShowMoveDialog] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [targetAlbumId, setTargetAlbumId] = useState('')

  const togglePhotoSelection = (photoId: string) => {
    const newSelection = new Set(selectedPhotos)
    if (newSelection.has(photoId)) {
      newSelection.delete(photoId)
    } else {
      newSelection.add(photoId)
    }
    setSelectedPhotos(newSelection)
  }

  const selectAllPhotos = () => {
    if (selectedPhotos.size === photos.length) {
      setSelectedPhotos(new Set())
    } else {
      setSelectedPhotos(new Set(photos.map(p => p.id)))
    }
  }

  const clearSelection = () => {
    setSelectedPhotos(new Set())
    setIsSelectionMode(false)
  }

  const handleBulkOperation = async (operation: string, data?: any) => {
    if (selectedPhotos.size === 0) return

    setIsLoading(true)
    try {
      const response = await fetch('/api/photos/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          operation,
          photo_ids: Array.from(selectedPhotos),
          data
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to perform operation')
      }

      const result = await response.json()
      
      if (result.failedCount > 0) {
        toast.warning(`Operation completed with ${result.failedCount} failures`)
      } else {
        toast.success(`Successfully ${operation}d ${result.successCount} photo${result.successCount !== 1 ? 's' : ''}`)
      }

      clearSelection()
      onPhotosUpdated()
    } catch (error) {
      console.error('Bulk operation error:', error)
      toast.error(error instanceof Error ? error.message : 'Operation failed')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteConfirm = () => {
    handleBulkOperation('delete')
    setShowDeleteDialog(false)
  }

  const handleMoveConfirm = () => {
    handleBulkOperation('move_to_album', { album_id: targetAlbumId || null })
    setShowMoveDialog(false)
    setTargetAlbumId('')
  }

  const handleFavoriteToggle = (photo: Photo) => {
    handleBulkOperation('favorite', { is_favorite: !photo.is_favorite })
  }

  const downloadPhoto = async (photo: Photo) => {
    try {
      const response = await fetch(photo.cloudinary_secure_url)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${photo.title || 'photo'}-${photo.id}.jpg`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      toast.success('Photo downloaded')
    } catch (error) {
      console.error('Download error:', error)
      toast.error('Failed to download photo')
    }
  }

  if (photos.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">📷</div>
        <h3 className="text-lg font-semibold mb-2">No photos in this view</h3>
        <p className="text-muted-foreground">
          Upload some photos to get started with your gallery.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Selection Controls */}
      {selectable && (
        <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsSelectionMode(!isSelectionMode)}
            >
              {isSelectionMode ? 'Exit Selection' : 'Select Photos'}
            </Button>
            
            {isSelectionMode && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={selectAllPhotos}
                >
                  {selectedPhotos.size === photos.length ? 'Deselect All' : 'Select All'}
                </Button>
                
                <span className="text-sm text-muted-foreground">
                  {selectedPhotos.size} selected
                </span>
              </>
            )}
          </div>

          {/* Bulk Actions */}
          {selectedPhotos.size > 0 && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkOperation('favorite', { is_favorite: true })}
                disabled={isLoading}
              >
                <Heart className="w-4 h-4 mr-2" />
                Favorite
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowMoveDialog(true)}
                disabled={isLoading}
              >
                <Move className="w-4 h-4 mr-2" />
                Move
              </Button>
              
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setShowDeleteDialog(true)}
                disabled={isLoading}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Photo Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {photos.map((photo) => (
          <div key={photo.id} className="relative group">
            {/* Selection Checkbox */}
            {isSelectionMode && (
              <div className="absolute top-2 left-2 z-10">
                <Checkbox
                  checked={selectedPhotos.has(photo.id)}
                  onCheckedChange={() => togglePhotoSelection(photo.id)}
                  className="bg-white border-2"
                />
              </div>
            )}

            {/* Photo Container */}
            <div className="aspect-square overflow-hidden rounded-lg border bg-gray-100 relative">
              <Image
                src={photo.cloudinary_secure_url}
                alt={photo.alt_text || photo.title || 'Wedding photo'}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-200"
              />

              {/* Favorite Indicator */}
              {photo.is_favorite && (
                <div className="absolute top-2 right-2">
                  <Heart className="w-4 h-4 fill-red-500 text-red-500" />
                </div>
              )}

              {/* Hover Overlay */}
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 flex items-center justify-center">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-2">
                  <PhotoEditDialog
                    photo={photo}
                    albums={albums}
                    onPhotoUpdated={onPhotosUpdated}
                    trigger={
                      <Button variant="secondary" size="sm">
                        <Edit className="w-4 h-4" />
                      </Button>
                    }
                  />
                  
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => downloadPhoto(photo)}
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                  
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setSelectedPhotos(new Set([photo.id]))
                      handleFavoriteToggle(photo)
                    }}
                  >
                    <Heart className={`w-4 h-4 ${photo.is_favorite ? 'fill-current' : ''}`} />
                  </Button>
                </div>
              </div>
            </div>

            {/* Photo Info */}
            <div className="mt-2 space-y-1">
              {photo.title && (
                <p className="text-sm font-medium truncate">{photo.title}</p>
              )}
              
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                {photo.photo_albums && (
                  <Badge variant="outline" className="text-xs">
                    {photo.photo_albums.name}
                  </Badge>
                )}
                
                {photo.tags && photo.tags.length > 0 && (
                  <span className="truncate">
                    {photo.tags.slice(0, 2).join(', ')}
                    {photo.tags.length > 2 && ` +${photo.tags.length - 2}`}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Photos</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedPhotos.size} photo{selectedPhotos.size !== 1 ? 's' : ''}? 
              This action cannot be undone and will permanently remove the photo{selectedPhotos.size !== 1 ? 's' : ''} from both your gallery and Cloudinary storage.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete {selectedPhotos.size} Photo{selectedPhotos.size !== 1 ? 's' : ''}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Move Dialog */}
      <Dialog open={showMoveDialog} onOpenChange={setShowMoveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Move Photos to Album</DialogTitle>
            <DialogDescription>
              Select an album to move {selectedPhotos.size} photo{selectedPhotos.size !== 1 ? 's' : ''} to.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <Select value={targetAlbumId} onValueChange={setTargetAlbumId}>
              <SelectTrigger>
                <SelectValue placeholder="Select destination album" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">No Album (Remove from current album)</SelectItem>
                {albums.map((album) => (
                  <SelectItem key={album.id} value={album.id}>
                    {album.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowMoveDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleMoveConfirm} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Moving...
                </>
              ) : (
                <>
                  <Move className="w-4 h-4 mr-2" />
                  Move Photos
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}