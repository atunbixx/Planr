'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  Calendar, 
  Tag, 
  Download, 
  Trash2, 
  Edit2, 
  X,
  Search,
  Filter,
  Grid,
  List
} from 'lucide-react'
import { useToast } from '@/hooks/useToast'
import { cn } from '@/utils/cn'
import Image from 'next/image'
import { format } from 'date-fns'

interface Photo {
  id: string
  image_url: string
  caption: string | null
  tags: string[] | null
  photo_date: string | null
  photographer: string | null
  location: string | null
  created_at: string | null
}

interface PhotoGalleryProps {
  coupleId: string
}

export function PhotoGallery({ coupleId }: PhotoGalleryProps) {
  const [photos, setPhotos] = useState<Photo[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [editingPhoto, setEditingPhoto] = useState<Photo | null>(null)
  const [editForm, setEditForm] = useState({
    caption: '',
    tags: '',
    photographer: '',
    location: ''
  })
  
  const supabase = createClientComponentClient()
  const { addToast } = useToast()

  // Fetch photos
  useEffect(() => {
    fetchPhotos()
  }, [coupleId])

  const fetchPhotos = async () => {
    try {
      const { data, error } = await supabase
        .from('photos')
        .select('*')
        .eq('couple_id', coupleId)
        .order('created_at', { ascending: false })

      if (error) throw error

      setPhotos(data || [])
    } catch (error) {
      console.error('Error fetching photos:', error)
      addToast({
        title: 'Error',
        description: 'Failed to load photos',
        type: 'error'
      })
    } finally {
      setLoading(false)
    }
  }

  // Get all unique tags
  const allTags = Array.from(
    new Set(
      photos.flatMap(photo => photo.tags || [])
    )
  )

  // Filter photos
  const filteredPhotos = photos.filter(photo => {
    const matchesSearch = searchTerm === '' || 
      photo.caption?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      photo.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())) ||
      photo.photographer?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      photo.location?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesTags = selectedTags.length === 0 ||
      selectedTags.every(tag => photo.tags?.includes(tag))

    return matchesSearch && matchesTags
  })

  // Delete photo
  const deletePhoto = async (photoId: string, imageUrl: string) => {
    if (!confirm('Are you sure you want to delete this photo?')) return

    try {
      // Extract file path from URL
      const urlParts = imageUrl.split('/storage/v1/object/public/wedding-photos/')
      const filePath = urlParts[1]

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('wedding-photos')
        .remove([filePath])

      if (storageError) throw storageError

      // Delete from database
      const { error: dbError } = await supabase
        .from('photos')
        .delete()
        .eq('id', photoId)

      if (dbError) throw dbError

      setPhotos(prev => prev.filter(p => p.id !== photoId))
      setSelectedPhoto(null)

      addToast({
        title: 'Photo deleted',
        description: 'The photo has been removed',
        type: 'success'
      })
    } catch (error) {
      console.error('Error deleting photo:', error)
      addToast({
        title: 'Error',
        description: 'Failed to delete photo',
        type: 'error'
      })
    }
  }

  // Update photo details
  const updatePhoto = async () => {
    if (!editingPhoto) return

    try {
      const tags = editForm.tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag !== '')

      const { error } = await supabase
        .from('photos')
        .update({
          caption: editForm.caption || null,
          tags: tags.length > 0 ? tags : null,
          photographer: editForm.photographer || null,
          location: editForm.location || null
        })
        .eq('id', editingPhoto.id)

      if (error) throw error

      // Update local state
      setPhotos(prev => prev.map(p => 
        p.id === editingPhoto.id 
          ? { 
              ...p, 
              caption: editForm.caption || null,
              tags: tags.length > 0 ? tags : null,
              photographer: editForm.photographer || null,
              location: editForm.location || null
            }
          : p
      ))

      setEditingPhoto(null)
      addToast({
        title: 'Photo updated',
        description: 'Photo details have been saved',
        type: 'success'
      })
    } catch (error) {
      console.error('Error updating photo:', error)
      addToast({
        title: 'Error',
        description: 'Failed to update photo',
        type: 'error'
      })
    }
  }

  // Start editing
  const startEditing = (photo: Photo) => {
    setEditingPhoto(photo)
    setEditForm({
      caption: photo.caption || '',
      tags: photo.tags?.join(', ') || '',
      photographer: photo.photographer || '',
      location: photo.location || ''
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Search and filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search photos..."
                className="pl-10"
              />
            </div>
            
            <div className="flex gap-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Tag filters */}
          {allTags.length > 0 && (
            <div className="mt-4">
              <div className="flex items-center gap-2 mb-2">
                <Filter className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-600">Filter by tags:</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {allTags.map(tag => (
                  <Badge
                    key={tag}
                    variant={selectedTags.includes(tag) ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => {
                      setSelectedTags(prev =>
                        prev.includes(tag)
                          ? prev.filter(t => t !== tag)
                          : [...prev, tag]
                      )
                    }}
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Photo count */}
      <div className="text-sm text-gray-600">
        Showing {filteredPhotos.length} of {photos.length} photos
      </div>

      {/* Gallery */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredPhotos.map(photo => (
            <div
              key={photo.id}
              className="group relative aspect-square rounded-lg overflow-hidden cursor-pointer"
              onClick={() => setSelectedPhoto(photo)}
            >
              <Image
                src={photo.image_url}
                alt={photo.caption || 'Wedding photo'}
                fill
                className="object-cover transition-transform group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
                  {photo.caption && (
                    <p className="text-sm font-medium line-clamp-2">{photo.caption}</p>
                  )}
                  {photo.tags && photo.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {photo.tags.slice(0, 3).map(tag => (
                        <span key={tag} className="text-xs bg-white/20 px-1.5 py-0.5 rounded">
                          {tag}
                        </span>
                      ))}
                      {photo.tags.length > 3 && (
                        <span className="text-xs bg-white/20 px-1.5 py-0.5 rounded">
                          +{photo.tags.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredPhotos.map(photo => (
            <Card key={photo.id} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex gap-4">
                  <div className="relative w-32 h-32 rounded-lg overflow-hidden flex-shrink-0">
                    <Image
                      src={photo.image_url}
                      alt={photo.caption || 'Wedding photo'}
                      fill
                      className="object-cover cursor-pointer"
                      onClick={() => setSelectedPhoto(photo)}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium mb-1">
                      {photo.caption || 'Untitled photo'}
                    </h4>
                    {photo.tags && photo.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {photo.tags.map(tag => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                    <div className="text-sm text-gray-600 space-y-1">
                      {photo.photographer && (
                        <p>Photographer: {photo.photographer}</p>
                      )}
                      {photo.location && (
                        <p>Location: {photo.location}</p>
                      )}
                      {photo.created_at && (
                        <p>Added: {format(new Date(photo.created_at), 'MMM d, yyyy')}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => startEditing(photo)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deletePhoto(photo.id, photo.image_url)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {selectedPhoto && !editingPhoto && (
        <div 
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <div 
            className="relative max-w-5xl max-h-[90vh] w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <Button
              size="sm"
              variant="ghost"
              className="absolute top-4 right-4 text-white hover:bg-white/20"
              onClick={() => setSelectedPhoto(null)}
            >
              <X className="h-5 w-5" />
            </Button>

            <div className="relative h-[70vh]">
              <Image
                src={selectedPhoto.image_url}
                alt={selectedPhoto.caption || 'Wedding photo'}
                fill
                className="object-contain"
              />
            </div>

            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6 text-white">
              <div className="flex items-end justify-between">
                <div>
                  {selectedPhoto.caption && (
                    <h3 className="text-xl font-semibold mb-2">{selectedPhoto.caption}</h3>
                  )}
                  <div className="flex flex-wrap gap-4 text-sm">
                    {selectedPhoto.photographer && (
                      <span>📷 {selectedPhoto.photographer}</span>
                    )}
                    {selectedPhoto.location && (
                      <span>📍 {selectedPhoto.location}</span>
                    )}
                    {selectedPhoto.photo_date && (
                      <span>📅 {format(new Date(selectedPhoto.photo_date), 'MMM d, yyyy')}</span>
                    )}
                  </div>
                  {selectedPhoto.tags && selectedPhoto.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {selectedPhoto.tags.map(tag => (
                        <Badge key={tag} variant="secondary" className="bg-white/20 text-white">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-white hover:bg-white/20"
                    onClick={() => startEditing(selectedPhoto)}
                  >
                    <Edit2 className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-white hover:bg-white/20"
                    onClick={() => deletePhoto(selectedPhoto.id, selectedPhoto.image_url)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-white hover:bg-white/20"
                    asChild
                  >
                    <a href={selectedPhoto.image_url} download>
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </a>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit modal */}
      {editingPhoto && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="max-w-lg w-full">
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold mb-4">Edit Photo Details</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Caption</label>
                  <Input
                    value={editForm.caption}
                    onChange={(e) => setEditForm(prev => ({ ...prev, caption: e.target.value }))}
                    placeholder="Add a caption..."
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Tags (comma separated)</label>
                  <Input
                    value={editForm.tags}
                    onChange={(e) => setEditForm(prev => ({ ...prev, tags: e.target.value }))}
                    placeholder="wedding, ceremony, reception..."
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Photographer</label>
                  <Input
                    value={editForm.photographer}
                    onChange={(e) => setEditForm(prev => ({ ...prev, photographer: e.target.value }))}
                    placeholder="Photographer name"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Location</label>
                  <Input
                    value={editForm.location}
                    onChange={(e) => setEditForm(prev => ({ ...prev, location: e.target.value }))}
                    placeholder="Venue or location"
                  />
                </div>
              </div>

              <div className="flex gap-2 mt-6">
                <Button onClick={updatePhoto}>
                  Save Changes
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setEditingPhoto(null)}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}