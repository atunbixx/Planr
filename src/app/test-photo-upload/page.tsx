'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { PhotoUpload } from '@/components/photos/PhotoUpload'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/useToast'

export default function TestPhotoUploadPage() {
  const [coupleId, setCoupleId] = useState<string | null>(null)
  const [uploadedUrls, setUploadedUrls] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClientComponentClient()
  const { addToast } = useToast()

  useEffect(() => {
    checkSetup()
  }, [])

  const checkSetup = async () => {
    try {
      // 1. Check if user is authenticated
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        console.log('Not authenticated')
        setLoading(false)
        return
      }

      // 2. Get couple ID
      const { data: couple, error: coupleError } = await supabase
        .from('couples')
        .select('id')
        .or(`partner1_user_id.eq.${user.id},partner2_user_id.eq.${user.id}`)
        .single()

      if (coupleError || !couple) {
        console.error('No couple found:', coupleError)
        setCoupleId(null)
      } else {
        console.log('Found couple:', couple.id)
        setCoupleId(couple.id)
      }

      // 3. Check storage bucket
      const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()
      if (bucketsError) {
        console.error('Error checking buckets:', bucketsError)
      } else {
        const weddingPhotosBucket = buckets?.find(b => b.id === 'wedding-photos')
        console.log('Wedding photos bucket exists:', !!weddingPhotosBucket)
      }

    } catch (error) {
      console.error('Setup check error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUploadComplete = (urls: string[]) => {
    console.log('Upload complete! URLs:', urls)
    setUploadedUrls(prev => [...prev, ...urls])
    addToast({
      title: 'Upload successful!',
      description: `${urls.length} photo(s) uploaded`,
      type: 'success'
    })
  }

  const testDatabaseQuery = async () => {
    try {
      const { data, error } = await supabase
        .from('photos')
        .select('*')
        .eq('couple_id', coupleId!)
        .order('created_at', { ascending: false })
        .limit(5)

      if (error) {
        console.error('Database query error:', error)
        addToast({
          title: 'Database Error',
          description: error.message,
          type: 'error'
        })
      } else {
        console.log('Database query successful:', data)
        addToast({
          title: 'Database OK',
          description: `Found ${data.length} photos`,
          type: 'success'
        })
      }
    } catch (error) {
      console.error('Query error:', error)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-8">
        <h1 className="text-2xl font-bold mb-4">Photo Upload Test</h1>
        <p>Loading...</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-8 space-y-6">
      <h1 className="text-2xl font-bold">Photo Upload Test Page</h1>

      {/* Status Card */}
      <Card>
        <CardHeader>
          <CardTitle>System Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p><strong>Couple ID:</strong> {coupleId || 'Not found'}</p>
          <p><strong>Storage Bucket:</strong> wedding-photos</p>
          <Button onClick={testDatabaseQuery} disabled={!coupleId}>
            Test Database Query
          </Button>
        </CardContent>
      </Card>

      {/* Upload Component */}
      {coupleId ? (
        <Card>
          <CardHeader>
            <CardTitle>Photo Upload Component</CardTitle>
          </CardHeader>
          <CardContent>
            <PhotoUpload 
              coupleId={coupleId} 
              onUploadComplete={handleUploadComplete}
              maxFiles={5}
              maxSizeInMB={10}
            />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <p className="text-red-600">No couple profile found. Please complete onboarding first.</p>
          </CardContent>
        </Card>
      )}

      {/* Uploaded URLs */}
      {uploadedUrls.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Uploaded Photos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {uploadedUrls.map((url, index) => (
                <div key={index} className="flex items-center gap-2">
                  <img 
                    src={url} 
                    alt={`Upload ${index + 1}`} 
                    className="w-20 h-20 object-cover rounded"
                  />
                  <a 
                    href={url} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-sm text-blue-600 hover:underline truncate flex-1"
                  >
                    {url}
                  </a>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}