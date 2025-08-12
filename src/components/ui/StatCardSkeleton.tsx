export function StatCardSkeleton() {
  return (
    <div 
      className="bg-card text-card-foreground rounded-lg shadow-sm p-6 animate-pulse"
      role="status"
      aria-label="Loading dashboard statistics"
    >
      <div className="flex items-center justify-between">
        <div>
          <div className="h-4 bg-muted rounded w-24 mb-2"></div>
          <div className="h-8 bg-muted rounded w-16"></div>
        </div>
        <div className="h-8 w-8 bg-muted rounded"></div>
      </div>
    </div>
  )
}