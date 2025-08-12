import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent } from '@/components/ui/card'

export function PhotoGridSkeleton({ count = 12 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {[...Array(count)].map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="aspect-square rounded-lg" />
          <Skeleton className="h-3 w-3/4" />
        </div>
      ))}
    </div>
  )
}

export function AlbumGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
      {[...Array(count)].map((_, i) => (
        <Card key={i} className="overflow-hidden">
          <div className="aspect-square">
            <Skeleton className="w-full h-full" />
          </div>
          <CardContent className="p-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export function PhotoStatsSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
      {[...Array(5)].map((_, i) => (
        <Card key={i}>
          <CardContent className="p-6">
            <div className="space-y-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-8 w-12" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export function PhotoUploadSkeleton() {
  return (
    <div className="flex items-center gap-2">
      <Skeleton className="h-10 w-28" />
    </div>
  )
}

export function QuickActionsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {[...Array(3)].map((_, i) => (
        <Card key={i} className="cursor-pointer">
          <CardContent className="p-6 text-center">
            <div className="space-y-4">
              <Skeleton className="h-12 w-12 rounded-full mx-auto" />
              <Skeleton className="h-4 w-24 mx-auto" />
              <Skeleton className="h-3 w-32 mx-auto" />
              <Skeleton className="h-8 w-20 mx-auto" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}