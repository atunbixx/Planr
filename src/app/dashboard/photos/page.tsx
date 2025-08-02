'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PhotoUpload } from '@/components/photos/PhotoUpload'
import { PhotoGallery } from '@/components/photos/PhotoGallery'
import { Camera, Upload } from 'lucide-react'
import { useToast } from '@/hooks/useToast'

export default function PhotosPage() {
  const [coupleId, setCoupleId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [showUpload, setShowUpload] = useState(false)
  const [refreshGallery, setRefreshGallery] = useState(0)
  const supabase = createClientComponentClient()
  const { addToast } = useToast()

  // Get current couple ID
  useEffect(() => {
    getCurrentCouple()
  }, [])

  const getCurrentCouple = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data: couple, error } = await supabase
        .from('couples')
        .select('id')
        .or(`partner1_user_id.eq.${user.id},partner2_user_id.eq.${user.id}`)
        .single()

      if (error) throw error
      setCoupleId(couple.id)
    } catch (error) {
      console.error('Error getting couple:', error)
      addToast({
        title: 'Error',
        description: 'Failed to load your profile',
        type: 'error'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleUploadComplete = (urls: string[]) => {
    // Refresh the gallery to show new photos
    setRefreshGallery(prev => prev + 1)
    setShowUpload(false)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-serif font-bold text-ink">Photos</h1>
        </div>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your photos...</p>
        </div>
      </div>
    )
  }

  if (!coupleId) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-serif font-bold text-ink">Photos</h1>
        </div>
        <Card>
          <CardContent className="pt-6 text-center py-12">
            <Camera className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-ink mb-2">No profile found</h3>
            <p className="text-gray-500">Please complete your profile setup first.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-serif font-bold text-ink">Photos</h1>
          <p className="text-gray-600 mt-1">Capture and organize your wedding memories</p>
        </div>
        <Button onClick={() => setShowUpload(!showUpload)}>
          <Upload className="h-4 w-4 mr-2" />
          Upload Photos
        </Button>
      </div>

      {/* Upload section */}
      {showUpload && (
        <Card>
          <CardHeader>
            <CardTitle>Upload Photos</CardTitle>
            <CardDescription>
              Add photos to your wedding gallery. You can upload multiple photos at once.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PhotoUpload 
              coupleId={coupleId} 
              onUploadComplete={handleUploadComplete}
            />
            <div className="mt-4 flex justify-end">
              <Button variant="outline" onClick={() => setShowUpload(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Gallery */}
      <PhotoGallery key={refreshGallery} coupleId={coupleId} />
    </div>
  )
}