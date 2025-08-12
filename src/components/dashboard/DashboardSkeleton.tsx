import { Card, CardContent, CardHeader } from '@/components/ui/card'

export function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      {/* Header Skeleton */}
      <div>
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-2" />
        <div className="h-4 w-64 bg-gray-200 rounded animate-pulse" />
      </div>

      {/* Wedding Countdown Skeleton */}
      <Card>
        <CardHeader>
          <div className="h-6 w-32 bg-gray-200 rounded animate-pulse mb-2" />
          <div className="h-4 w-48 bg-gray-200 rounded animate-pulse" />
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="h-16 w-32 bg-gray-200 rounded animate-pulse mx-auto mb-4" />
            <div className="h-4 w-24 bg-gray-200 rounded animate-pulse mx-auto" />
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid Skeleton */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
              <div className="h-8 w-8 bg-gray-200 rounded animate-pulse" />
            </CardHeader>
            <CardContent>
              <div className="h-8 w-16 bg-gray-200 rounded animate-pulse mb-2" />
              <div className="h-3 w-32 bg-gray-200 rounded animate-pulse" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Budget Overview Skeleton */}
      <Card>
        <CardHeader>
          <div className="h-6 w-32 bg-gray-200 rounded animate-pulse mb-2" />
          <div className="h-4 w-48 bg-gray-200 rounded animate-pulse" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="h-4 w-full bg-gray-200 rounded animate-pulse" />
          <div className="space-y-2">
            <div className="flex justify-between">
              <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
            </div>
            <div className="flex justify-between">
              <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity Skeleton */}
      <Card>
        <CardHeader>
          <div className="h-6 w-32 bg-gray-200 rounded animate-pulse" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <div className="h-10 w-10 bg-gray-200 rounded-full animate-pulse" />
                <div className="flex-1">
                  <div className="h-4 w-48 bg-gray-200 rounded animate-pulse mb-2" />
                  <div className="h-3 w-24 bg-gray-200 rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export function StatCardSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
        <div className="h-8 w-8 bg-gray-200 rounded animate-pulse" />
      </CardHeader>
      <CardContent>
        <div className="h-8 w-16 bg-gray-200 rounded animate-pulse mb-2" />
        <div className="h-3 w-32 bg-gray-200 rounded animate-pulse" />
      </CardContent>
    </Card>
  )
}