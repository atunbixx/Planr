import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { currentUser } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import PhotoUploadDialog from './components/PhotoUploadDialog'
import AlbumGrid from './components/AlbumGrid'
import PhotoStats from './components/PhotoStats'
import PhotoGrid from './components/PhotoGrid'
import AlbumCreateDialog from './components/AlbumCreateDialog'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export default async function PhotosPage() {
  const { userId } = await auth()
  const user = await currentUser()
  
  if (!userId) {
    redirect('/sign-in')
  }
  
  let albums: any[] = []
  let recentPhotos: any[] = []
  let stats = {
    total_photos: 0,
    total_albums: 0,
    favorite_photos: 0,
    shared_photos: 0,
    storage_used: 0
  }
  let schemaSetup = false
  
  if (user?.emailAddresses?.[0]?.emailAddress) {
    try {
      // Get user's couple data using admin client
      const { data: userData } = await supabaseAdmin
        .from('users')
        .select(`
          id,
          couples (id)
        `)
        .eq('email', user.emailAddresses[0].emailAddress)
        .single()

      if (userData?.couples?.[0]) {
        const coupleId = userData.couples[0].id

        try {
          // Check if photo gallery tables exist
          const { data: tablesCheck } = await supabaseAdmin
            .from('information_schema.tables')
            .select('table_name')
            .eq('table_schema', 'public')
            .in('table_name', ['photo_albums', 'photos'])

          const tablesExist = tablesCheck && tablesCheck.length >= 2
          schemaSetup = !!tablesExist

          if (tablesExist) {
            // Get albums with photo counts
            const { data: albumsData } = await supabaseAdmin
              .from('photo_albums')
              .select(`
                *,
                photos:photos(count),
                cover_photo:cover_photo_id(
                  id,
                  cloudinary_secure_url,
                  title
                )
              `)
              .eq('couple_id', coupleId)
              .order('sort_order', { ascending: true })
              .order('created_at', { ascending: false })

            albums = albumsData?.map(album => ({
              ...album,
              photo_count: album.photos?.[0]?.count || 0,
              photos: undefined
            })) || []

            // Get recent photos
            const { data: photosData } = await supabaseAdmin
              .from('photos')
              .select(`
                *,
                photo_albums (
                  id,
                  name
                )
              `)
              .eq('couple_id', coupleId)
              .order('created_at', { ascending: false })
              .limit(12)

            recentPhotos = photosData || []

            // Get photo statistics
            const { data: statsData } = await supabaseAdmin
              .rpc('get_photo_stats', { p_couple_id: coupleId })

            stats = statsData?.[0] || stats
          }
        } catch (error: any) {
          console.error('Error fetching photo data:', error)
          // Database schema not set up yet - this is expected
        }
      }
    } catch (error) {
      console.error('Error fetching photo data:', error)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // Show setup notice if database schema isn't ready
  if (!schemaSetup) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Photo Gallery</h1>
            <p className="text-gray-600 mt-2">Capture and organize your wedding memories</p>
          </div>
        </div>

        {/* Setup Notice */}
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="text-4xl">⚙️</div>
              <div>
                <CardTitle className="text-yellow-800">Database Setup Required</CardTitle>
                <CardDescription className="text-yellow-700">
                  The photo gallery database schema needs to be set up before you can start using this feature.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-white rounded-lg p-4 border border-yellow-200">
              <h4 className="font-semibold text-gray-900 mb-2">Setup Instructions:</h4>
              <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
                <li>Go to your <strong>Supabase Dashboard</strong></li>
                <li>Navigate to <strong>SQL Editor</strong></li>
                <li>Copy and paste the contents of <code className="bg-gray-100 px-2 py-1 rounded">photo-gallery-schema.sql</code></li>
                <li>Click <strong>Run</strong> to create the photo gallery tables</li>
                <li>Refresh this page to start using the photo gallery</li>
              </ol>
            </div>
            
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <h4 className="font-semibold text-blue-900 mb-2">What will be created:</h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-blue-800">
                <li><strong>photo_albums</strong> - Organize photos by events and moments</li>
                <li><strong>photos</strong> - Store photo metadata with Cloudinary integration</li>
                <li><strong>photo_shares</strong> - Share photos with guests via secure links</li>
                <li><strong>photo_comments</strong> - Allow guests to comment on photos</li>
                <li><strong>photo_reactions</strong> - Like and react to photos</li>
              </ul>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() => window.location.reload()}
                variant="outline"
              >
                Check Again
              </Button>
              <Button
                onClick={() => window.open('https://supabase.com/dashboard', '_blank')}
              >
                Open Supabase Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Feature Preview */}
        <Card>
          <CardHeader>
            <CardTitle>Coming Soon: Photo Gallery Features</CardTitle>
            <CardDescription>Once set up, you'll have access to these powerful features</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="text-center p-4">
                <div className="text-4xl mb-3">📸</div>
                <h3 className="font-semibold mb-2">Drag & Drop Upload</h3>
                <p className="text-sm text-muted-foreground">
                  Upload multiple photos at once with progress tracking
                </p>
              </div>
              
              <div className="text-center p-4">
                <div className="text-4xl mb-3">📁</div>
                <h3 className="font-semibold mb-2">Smart Albums</h3>
                <p className="text-sm text-muted-foreground">
                  Organize photos by events, dates, and custom categories
                </p>
              </div>
              
              <div className="text-center p-4">
                <div className="text-4xl mb-3">🔗</div>
                <h3 className="font-semibold mb-2">Guest Sharing</h3>
                <p className="text-sm text-muted-foreground">
                  Share albums with family and friends via secure links
                </p>
              </div>
              
              <div className="text-center p-4">
                <div className="text-4xl mb-3">💬</div>
                <h3 className="font-semibold mb-2">Comments & Reactions</h3>
                <p className="text-sm text-muted-foreground">
                  Let guests comment and react to your special moments
                </p>
              </div>
              
              <div className="text-center p-4">
                <div className="text-4xl mb-3">☁️</div>
                <h3 className="font-semibold mb-2">Cloud Storage</h3>
                <p className="text-sm text-muted-foreground">
                  Powered by Cloudinary for fast, optimized image delivery
                </p>
              </div>
              
              <div className="text-center p-4">
                <div className="text-4xl mb-3">📱</div>
                <h3 className="font-semibold mb-2">Mobile Friendly</h3>
                <p className="text-sm text-muted-foreground">
                  Perfect viewing experience on all devices
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Photo Gallery</h1>
          <p className="text-gray-600 mt-2">Capture and organize your wedding memories</p>
        </div>
        <PhotoUploadDialog albums={albums} />
      </div>

      {/* Photo Statistics */}
      <PhotoStats stats={stats} formatFileSize={formatFileSize} />

      {/* Albums Section */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Photo Albums</CardTitle>
              <CardDescription>Organize your photos by moments and events</CardDescription>
            </div>
            <Badge variant="outline">{albums.length} album{albums.length !== 1 ? 's' : ''}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <AlbumGrid albums={albums} />
        </CardContent>
      </Card>

      {/* Recent Photos */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Recent Photos</CardTitle>
              <CardDescription>Your latest uploaded memories</CardDescription>
            </div>
            <Badge variant="outline">{recentPhotos.length} photo{recentPhotos.length !== 1 ? 's' : ''}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <PhotoGrid 
            photos={recentPhotos} 
            albums={albums} 
            onPhotosUpdated={() => window.location.reload()}
            selectable={true}
          />
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardContent className="p-6 text-center">
            <div className="text-4xl mb-3">📸</div>
            <h3 className="font-semibold mb-2">Upload Photos</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Add new photos to your gallery
            </p>
            <PhotoUploadDialog albums={albums} variant="outline" />
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardContent className="p-6 text-center">
            <div className="text-4xl mb-3">📁</div>
            <h3 className="font-semibold mb-2">Create Album</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Organize photos by events
            </p>
            <AlbumCreateDialog 
              onAlbumCreated={() => window.location.reload()}
              trigger={
                <Button variant="outline" size="sm">
                  New Album
                </Button>
              }
            />
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardContent className="p-6 text-center">
            <div className="text-4xl mb-3">🔗</div>
            <h3 className="font-semibold mb-2">Share Gallery</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Share with family and friends
            </p>
            <Button variant="outline" size="sm">
              Share
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}