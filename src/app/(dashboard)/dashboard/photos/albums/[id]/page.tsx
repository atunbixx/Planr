import { getAdminClient } from '@/lib/supabase-admin-transformed'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Calendar, Users, Image } from 'lucide-react'
import Link from 'next/link'
import PhotoGrid from '../../components/PhotoGrid'
import PhotoUploadDialog from '../../components/PhotoUploadDialog'
import { notFound } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth/server'

interface Props {
  params: Promise<{ id: string }>
}

export default async function AlbumPage({ params }: Props) {
  const { id } = await params
  const user = await getCurrentUser()
  
  if (!user?.id) {
    return notFound()
  }

  let album: any = null
  let photos: any[] = []
  let allAlbums: any[] = []
  let schemaSetup = false

  try {
    // Get user's couple data using admin client
    const supabase = getAdminClient()
    const { data: userData } = await supabase
      .from('users')
      .select(`
        id,
        wedding_couples (id)
      `)
      .eq('supabaseUserId', user.id)
      .single()

    if (userData?.wedding_couples?.[0]) {
      const coupleId = userData.wedding_couples[0].id

      try {
        // Check if photo gallery tables exist
        const { data: tablesCheck } = await supabase
          .from('information_schema.tables')
          .select('table_name')
          .eq('table_schema', 'public')
          .in('table_name', ['photo_albums', 'photos'])

        const tablesExist = tablesCheck && tablesCheck.length >= 2
        schemaSetup = !!tablesExist

        if (tablesExist) {
          // Get album details
          const { data: albumData, error: albumError } = await supabase
            .from('photo_albums')
            .select(`
              *,
              photos:photos(count)
            `)
            .eq('id', id)
            .eq('coupleId', coupleId)
            .single()

          if (albumError || !albumData) {
            return notFound()
          }

          album = {
            ...albumData,
            photo_count: albumData.photos?.[0]?.count || 0,
            photos: undefined
          }

          // Get photos in this album
          const { data: photosData } = await supabase
            .from('photos')
            .select(`
              *,
              photo_albums (
                id,
                name
              )
            `)
            .eq('albumId', id)
            .eq('coupleId', coupleId)
            .order('createdAt', { ascending: false })

          photos = photosData || []

          // Get all albums for moving photos
          const { data: albumsData } = await supabase
            .from('photo_albums')
            .select('id, name, description')
            .eq('coupleId', coupleId)
            .order('name', { ascending: true })

          allAlbums = albumsData || []
        }
      } catch (error: any) {
        console.error('Error fetching album data:', error)
      }
    }
  } catch (error) {
    console.error('Error fetching album data:', error)
  }

  // Show setup notice if database schema isn't ready
  if (!schemaSetup) {
    return (
      <div className="space-y-8">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/photos">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Photos
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Album</h1>
            <p className="text-gray-600 mt-2">Database schema setup required</p>
          </div>
        </div>

        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="text-yellow-800">Database Setup Required</CardTitle>
            <CardDescription className="text-yellow-700">
              The photo gallery database schema needs to be set up before you can view albums.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/photos">
              <Button variant="outline">
                Return to Photo Gallery
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!album) {
    return notFound()
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <Link href="/dashboard/photos">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Photos
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{album.name}</h1>
            {album.description && (
              <p className="text-gray-600 mt-2">{album.description}</p>
            )}
          </div>
        </div>
        <PhotoUploadDialog 
          albums={allAlbums} 
          defaultAlbumId={album.id}
        />
      </div>

      {/* Album Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6 text-center">
            <Image className="w-8 h-8 mx-auto mb-2 text-blue-600" />
            <div className="text-2xl font-bold">{album.photos?.length || 0}</div>
            <div className="text-sm text-muted-foreground">
              Photo{album.photos?.length || 0 !== 1 ? 's' : ''}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <Calendar className="w-8 h-8 mx-auto mb-2 text-green-600" />
            <div className="text-sm font-medium">{formatDate(album.createdAt)}</div>
            <div className="text-sm text-muted-foreground">Created</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <Users className="w-8 h-8 mx-auto mb-2 text-purple-600" />
            <div className="text-sm font-medium">
              {album.isShared ? 'Shared' : 'Private'}
            </div>
            <div className="text-sm text-muted-foreground">Visibility</div>
          </CardContent>
        </Card>
      </div>

      {/* Photos */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Album Photos</CardTitle>
              <CardDescription>
                {photos.length > 0 
                  ? `${photos.length} photo${photos.length !== 1 ? 's' : ''} in this album`
                  : 'No photos in this album yet'
                }
              </CardDescription>
            </div>
            {photos.length > 0 && (
              <Badge variant="outline">{photos.length} photo{photos.length !== 1 ? 's' : ''}</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {photos.length > 0 ? (
            <PhotoGrid 
              photos={photos} 
              albums={allAlbums} 
              onPhotosUpdated={() => window.location.reload()}
              selectable={true}
            />
          ) : (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📸</div>
              <h3 className="text-lg font-semibold mb-2">No photos in this album</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Start adding photos to this album by uploading new photos and selecting this album, or by moving existing photos here.
              </p>
              <PhotoUploadDialog 
                albums={allAlbums} 
                defaultAlbumId={album.id}
                trigger={
                  <Button>
                    <Image className="w-4 h-4 mr-2" />
                    Add Photos to Album
                  </Button>
                }
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}