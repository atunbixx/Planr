'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { X, Plus, Heart, Edit, Save, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface Photo {
  id: string
  title: string | null
  description: string | null
  alt_text: string | null
  is_favorite: boolean
  album_id: string | null
  tags: string[] | null
  cloudinary_secure_url: string
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

interface PhotoEditDialogProps {
  photo: Photo
  albums: Album[]
  onPhotoUpdated: (updatedPhoto: Photo) => void
  trigger?: React.ReactNode
}

export default function PhotoEditDialog({ photo, albums, onPhotoUpdated, trigger }: PhotoEditDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: photo.title || '',
    description: photo.description || '',
    alt_text: photo.alt_text || '',
    is_favorite: photo.is_favorite || false,
    album_id: photo.album_id || '',
    tags: photo.tags || []
  })
  const [newTag, setNewTag] = useState('')

  // Reset form when photo changes
  useEffect(() => {
    setFormData({
      title: photo.title || '',
      description: photo.description || '',
      alt_text: photo.alt_text || '',
      is_favorite: photo.is_favorite || false,
      album_id: photo.album_id || '',
      tags: photo.tags || []
    })
  }, [photo])

  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }))
      setNewTag('')
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch(`/api/photos/${photo.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: formData.title.trim() || null,
          description: formData.description.trim() || null,
          alt_text: formData.alt_text.trim() || null,
          is_favorite: formData.is_favorite,
          album_id: formData.album_id || null,
          tags: formData.tags
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update photo')
      }

      const { photo: updatedPhoto } = await response.json()
      onPhotoUpdated(updatedPhoto)
      setIsOpen(false)
      toast.success('Photo updated successfully')
    } catch (error) {
      console.error('Update photo error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to update photo')
    } finally {
      setIsLoading(false)
    }
  }

  const defaultTrigger = (
    <Button variant="outline" size="sm">
      <Edit className="w-4 h-4 mr-2" />
      Edit
    </Button>
  )

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Photo</DialogTitle>
          <DialogDescription>
            Update photo information and organize your memories
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Photo Preview */}
          <div className="flex gap-4">
            <div className="w-32 h-32 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
              <img
                src={photo.cloudinary_secure_url}
                alt={photo.title || 'Photo'}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 space-y-4">
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter photo title..."
                />
              </div>

              {/* Favorite Toggle */}
              <div className="flex items-center space-x-2">
                <Switch
                  id="favorite"
                  checked={formData.is_favorite}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_favorite: checked }))}
                />
                <Label htmlFor="favorite" className="flex items-center gap-2">
                  <Heart className={`w-4 h-4 ${formData.is_favorite ? 'fill-red-500 text-red-500' : ''}`} />
                  Mark as favorite
                </Label>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe this photo..."
              rows={3}
            />
          </div>

          {/* Alt Text */}
          <div className="space-y-2">
            <Label htmlFor="alt_text">Alt Text (for accessibility)</Label>
            <Input
              id="alt_text"
              value={formData.alt_text}
              onChange={(e) => setFormData(prev => ({ ...prev, alt_text: e.target.value }))}
              placeholder="Describe what's in the photo for screen readers..."
            />
          </div>

          {/* Album Selection */}
          <div className="space-y-2">
            <Label htmlFor="album">Album</Label>
            <Select
              value={formData.album_id}
              onValueChange={(value) => setFormData(prev => ({ ...prev, album_id: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select an album (optional)" />
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

          {/* Tags */}
          <div className="space-y-2">
            <Label htmlFor="tags">Tags</Label>
            <div className="flex gap-2 mb-2">
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="Add a tag..."
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleAddTag()
                  }
                }}
              />
              <Button type="button" onClick={handleAddTag} size="sm" variant="outline">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.tags.map((tag, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-1">
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-1 hover:text-red-500"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}