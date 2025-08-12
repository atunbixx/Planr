'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'

interface Album {
  id: string
  name: string
  description?: string
  photo_count: number
  cover_photo?: {
    id: string
    cloudinarySecureUrl: string
    title?: string
  }
  isFeatured: boolean
  isPublic: boolean
}

interface AlbumGridProps {
  albums: Album[]
}

export default function AlbumGrid({ albums }: AlbumGridProps) {
  const getAlbumEmoji = (name: string) => {
    const lowerName = name.toLowerCase()
    if (lowerName.includes('engagement')) return '💕'
    if (lowerName.includes('wedding') || lowerName.includes('ceremony')) return '💍'
    if (lowerName.includes('reception')) return '🎉'
    if (lowerName.includes('venue')) return '🏛️'
    if (lowerName.includes('dress') || lowerName.includes('attire')) return '👗'
    if (lowerName.includes('cake') || lowerName.includes('food')) return '🎂'
    if (lowerName.includes('flower') || lowerName.includes('decor')) return '🌸'
    if (lowerName.includes('ring')) return '💎'
    if (lowerName.includes('invitation')) return '💌'
    if (lowerName.includes('inspiration') || lowerName.includes('idea')) return '✨'
    return '📸'
  }

  const getGradientClass = (index: number) => {
    const gradients = [
      'from-rose-100 to-pink-100',
      'from-blue-100 to-indigo-100',
      'from-purple-100 to-pink-100',
      'from-yellow-100 to-orange-100',
      'from-green-100 to-emerald-100',
      'from-teal-100 to-cyan-100',
      'from-indigo-100 to-purple-100',
      'from-orange-100 to-red-100'
    ]
    return gradients[index % gradients.length]
  }

  if (albums.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">📁</div>
        <h3 className="text-lg font-semibold mb-2">No albums yet</h3>
        <p className="text-muted-foreground mb-6 max-w-md mx-auto">
          Create your first photo album to start organizing your wedding photos.
        </p>
        <Button>Create Album</Button>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {albums.map((album, index) => (
        <Link key={album.id} href={`/dashboard/photos/albums/${album.id}`}>
          <Card className="group cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-0">
            <div className={`aspect-square bg-gradient-to-br ${getGradientClass(index)} rounded-t-lg flex items-center justify-center relative overflow-hidden`}>
              {album.cover_photo ? (
                <img
                  src={album.cover_photo.cloudinarySecureUrl}
                  alt={album.cover_photo.title || album.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-4xl">{getAlbumEmoji(album.name)}</span>
              )}
              
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-200 flex items-center justify-center">
                <Button 
                  variant="secondary" 
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  View Album
                </Button>
              </div>

              {/* Album badges */}
              <div className="absolute top-2 left-2 flex gap-1">
                {album.isFeatured && (
                  <Badge variant="secondary" className="text-xs">Featured</Badge>
                )}
                {album.isPublic && (
                  <Badge variant="outline" className="text-xs bg-white/80">Public</Badge>
                )}
              </div>
            </div>
            
            <div className="p-4">
              <h3 className="font-semibold text-lg mb-1">{album.name}</h3>
              {album.description && (
                <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                  {album.description}
                </p>
              )}
              <p className="text-sm text-muted-foreground">
                {album.photo_count || 0} photo{album.photo_count !== 1 ? 's' : ''}
              </p>
            </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  )
}