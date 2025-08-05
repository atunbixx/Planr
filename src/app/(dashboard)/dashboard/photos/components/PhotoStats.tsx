'use client'

import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card'

interface PhotoStatsProps {
  stats: {
    total_photos: number
    total_albums: number
    favorite_photos: number
    shared_photos: number
    storage_used: number
  }
  formatFileSize: (bytes: number) => string
}

export default function PhotoStats({ stats, formatFileSize }: PhotoStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <Card>
        <CardHeader className="pb-2">
          <CardDescription>Total Photos</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.total_photos}</div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <CardDescription>Albums</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">{stats.total_albums}</div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <CardDescription>Favorites</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">{stats.favorite_photos}</div>
          <p className="text-xs text-muted-foreground">
            {stats.total_photos > 0 ? Math.round((stats.favorite_photos / stats.total_photos) * 100) : 0}% of total
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <CardDescription>Storage Used</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-purple-600">
            {formatFileSize(stats.storage_used)}
          </div>
          <p className="text-xs text-muted-foreground">
            {stats.shared_photos} shared
          </p>
        </CardContent>
      </Card>
    </div>
  )
}