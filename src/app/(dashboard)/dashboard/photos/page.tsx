import { Suspense } from 'react'
import { getPhotosData } from '@/lib/server/db'
import { Button } from '@/components/ui/button'
import { Camera, Heart, Share2, Folder, Plus, Image } from 'lucide-react'

import PhotoUploadDialog from './components/PhotoUploadDialog'
import AlbumGrid from './components/AlbumGrid'
import PhotoGrid from './components/PhotoGrid'
import AlbumCreateDialog from './components/AlbumCreateDialog'

interface PhotosPageProps {
  searchParams: Promise<{
    album?: string
    search?: string
    page?: string
    limit?: string
    sort_field?: string
    sort_direction?: 'asc' | 'desc'
  }>
}

export default async function PhotosPage({ searchParams }: PhotosPageProps) {
  const resolvedSearchParams = await searchParams
  
  const filters = {
    search: resolvedSearchParams.search
  }
  
  const sort = {
    field: resolvedSearchParams.sort_field || 'createdAt',
    direction: resolvedSearchParams.sort_direction || 'desc' as 'desc'
  }
  
  const pagination = {
    page: parseInt(resolvedSearchParams.page || '1'),
    limit: parseInt(resolvedSearchParams.limit || '20')
  }

  try {
    const { photos, albums, stats } = await getPhotosData({
      albumId: resolvedSearchParams.album,
      filters,
      sort,
      pagination
    })

    return (
      <div className="px-8 py-12">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-5xl font-light tracking-wide text-gray-900 mb-2 uppercase">Photos</h1>
          <p className="text-lg font-light text-gray-600">Organize and share your wedding memories</p>
        </div>

        {/* Photo Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-12">
          <div className="bg-white p-6 rounded-sm shadow-sm text-center">
            <p className="text-3xl font-light text-gray-900">{stats.total_photos}</p>
            <p className="text-xs font-medium tracking-[0.2em] text-gray-500 uppercase mt-2">Total Photos</p>
          </div>

          <div className="bg-white p-6 rounded-sm shadow-sm text-center">
            <p className="text-3xl font-light text-gray-900">{stats.total_albums}</p>
            <p className="text-xs font-medium tracking-[0.2em] text-gray-500 uppercase mt-2">Albums</p>
          </div>

          <div className="bg-white p-6 rounded-sm shadow-sm text-center">
            <p className="text-3xl font-light text-[#7a9b7f]">{stats.favorite_photos}</p>
            <p className="text-xs font-medium tracking-[0.2em] text-gray-500 uppercase mt-2">Favorites</p>
          </div>

          <div className="bg-white p-6 rounded-sm shadow-sm text-center">
            <p className="text-3xl font-light text-gray-900">{stats.shared_photos}</p>
            <p className="text-xs font-medium tracking-[0.2em] text-gray-500 uppercase mt-2">Shared</p>
          </div>

          <div className="bg-white p-6 rounded-sm shadow-sm text-center">
            <p className="text-3xl font-light text-gray-900">{formatFileSize(stats.storage_used)}</p>
            <p className="text-xs font-medium tracking-[0.2em] text-gray-500 uppercase mt-2">Storage</p>
          </div>
        </div>

        {/* Albums Section */}
        {albums.length > 0 && (
          <div className="bg-white rounded-sm shadow-sm mb-8">
            <div className="p-8 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-light tracking-wide text-gray-900 uppercase">Albums</h2>
                  <p className="text-sm font-light text-gray-600 mt-1">Organize your photos into themed collections</p>
                </div>
                <AlbumCreateDialog>
                  <Button className="bg-[#7a9b7f] hover:bg-[#6a8b6f] text-white rounded-sm px-4 py-2 text-sm font-light tracking-wider uppercase">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Album
                  </Button>
                </AlbumCreateDialog>
              </div>
            </div>
            
            <div className="p-8">
              <Suspense fallback={<AlbumGridSkeleton />}>
                <AlbumGrid albums={albums} />
              </Suspense>
            </div>
          </div>
        )}

        {/* Recent Photos */}
        <div className="bg-white rounded-sm shadow-sm">
          <div className="p-8 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-light tracking-wide text-gray-900 uppercase">
                  {resolvedSearchParams.album ? 'Album Photos' : 'Recent Photos'}
                </h2>
                <p className="text-sm font-light text-gray-600 mt-1">
                  {resolvedSearchParams.album 
                    ? 'Photos from the selected album'
                    : 'Your most recently uploaded wedding photos'
                  }
                </p>
              </div>
              <PhotoUploadDialog albums={albums}>
                <Button className="bg-[#7a9b7f] hover:bg-[#6a8b6f] text-white rounded-sm px-4 py-2 text-sm font-light tracking-wider uppercase">
                  <Camera className="w-4 h-4 mr-2" />
                  Upload Photos
                </Button>
              </PhotoUploadDialog>
            </div>
          </div>
          
          <div className="p-0">
            <Suspense fallback={<PhotoGridSkeleton />}>
              <PhotoGrid 
                photos={photos} 
                albums={albums} 
                onPhotosUpdated={async () => {
                  'use server'
                  // This will trigger a re-render of the page
                }} 
              />
            </Suspense>
          </div>
        </div>

        {photos.length === 0 && albums.length === 0 && (
          <div className="bg-white rounded-sm shadow-sm p-16 text-center">
            <Image className="w-24 h-24 text-gray-300 mx-auto mb-6" />
            <h3 className="text-2xl font-light tracking-wide text-gray-900 uppercase mb-2">No Photos Yet</h3>
            <p className="text-lg font-light text-gray-600 mb-8">
              Start building your wedding photo collection by uploading your first photos
            </p>
            <PhotoUploadDialog albums={albums}>
              <Button className="bg-[#7a9b7f] hover:bg-[#6a8b6f] text-white rounded-sm px-6 py-3 text-sm font-light tracking-wider uppercase">
                <Camera className="w-4 h-4 mr-2" />
                Upload Your First Photos
              </Button>
            </PhotoUploadDialog>
          </div>
        )}
      </div>
    )
  } catch (error) {
    console.error('Error loading photos:', error)
    
    return (
      <div className="px-8 py-12">
        <div className="mb-12">
          <h1 className="text-5xl font-light tracking-wide text-gray-900 mb-2 uppercase">Photos</h1>
          <p className="text-lg font-light text-gray-600">Organize and share your wedding memories</p>
        </div>

        <div className="bg-white rounded-sm shadow-sm p-16 text-center">
          <div className="text-6xl mb-6">⚠️</div>
          <h3 className="text-2xl font-light tracking-wide text-gray-900 uppercase mb-2">Unable to Load Photos</h3>
          <p className="text-lg font-light text-gray-600">
            There was an error loading your photo gallery. Please try refreshing the page.
          </p>
        </div>
      </div>
    )
  }
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

function AlbumGridSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="h-48 bg-gray-200 rounded-sm mb-3"></div>
          <div className="space-y-2">
            <div className="h-4 w-3/4 bg-gray-200 rounded-sm"></div>
            <div className="h-3 w-1/2 bg-gray-200 rounded-sm"></div>
          </div>
        </div>
      ))}
    </div>
  )
}

function PhotoGridSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 p-8">
      {[...Array(12)].map((_, i) => (
        <div key={i} className="aspect-square bg-gray-200 rounded-sm animate-pulse"></div>
      ))}
    </div>
  )
}