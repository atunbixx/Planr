'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Plus, Loader2, FolderPlus } from 'lucide-react'
import { toast } from 'sonner'
import { api } from '@/lib/api/client'

interface Album {
  id: string
  name: string
  description: string | null
}

interface AlbumCreateDialogProps {
  onAlbumCreated: (album: Album) => void
  trigger?: React.ReactNode
}

export default function AlbumCreateDialog({ onAlbumCreated, trigger }: AlbumCreateDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      toast.error('Album name is required')
      return
    }

    setIsLoading(true)

    try {
      const response = await api.albums.create({
        name: formData.name.trim(),
        description: formData.description.trim() || undefined
      })

      if (response.success && response.data) {
        onAlbumCreated(response.data)
        setIsOpen(false)
        setFormData({ name: '', description: '' })
        toast.success('Album created successfully')
      } else {
        throw new Error('Failed to create album')
      }
    } catch (error) {
      console.error('Create album error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to create album')
    } finally {
      setIsLoading(false)
    }
  }

  const defaultTrigger = (
    <Button>
      <Plus className="w-4 h-4 mr-2" />
      New Album
    </Button>
  )

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderPlus className="w-5 h-5" />
            Create New Album
          </DialogTitle>
          <DialogDescription>
            Organize your photos by creating a new album. You can add photos to this album during upload or move them later.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Album Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Album Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., Engagement Photos, Wedding Day, Reception..."
              required
            />
          </div>

          {/* Album Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Add a description for this album..."
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => {
                setIsOpen(false)
                setFormData({ name: '', description: '' })
              }}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !formData.name.trim()}>
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <FolderPlus className="w-4 h-4 mr-2" />
                  Create Album
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}