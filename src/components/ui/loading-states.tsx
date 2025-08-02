'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Plus, Inbox, Search, RefreshCw } from 'lucide-react'

// Task Skeleton Component
export function TaskSkeleton() {
  return (
    <Card className="mb-4">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-4 rounded" />
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-6 w-16 rounded-full" />
            </div>
            <Skeleton className="h-4 w-64" />
            <div className="flex items-center gap-4">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-24" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-3 w-8" />
              </div>
              <Skeleton className="h-2 w-full" />
            </div>
          </div>
          <Skeleton className="h-8 w-16" />
        </div>
      </CardContent>
    </Card>
  )
}

// Timeline Item Skeleton
export function TimelineItemSkeleton() {
  return (
    <Card className="mb-3">
      <CardContent className="p-3">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-48" />
          </div>
          <Skeleton className="h-6 w-20" />
        </div>
      </CardContent>
    </Card>
  )
}

// Milestone Skeleton
export function MilestoneSkeleton() {
  return (
    <Card className="mb-4">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-5" />
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
            <Skeleton className="h-4 w-56" />
            <div className="flex items-center gap-4">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-28" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-3 w-8" />
              </div>
              <Skeleton className="h-2 w-full" />
            </div>
          </div>
          <Skeleton className="h-8 w-16" />
        </div>
      </CardContent>
    </Card>
  )
}

// Loading Spinner
export function LoadingSpinner({ size = 'md', text = 'Loading...' }: { size?: 'sm' | 'md' | 'lg', text?: string }) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  }

  return (
    <div className="flex items-center justify-center gap-2">
      <RefreshCw className={`${sizeClasses[size]} animate-spin text-muted-foreground`} />
      {text && <span className="text-sm text-muted-foreground">{text}</span>}
    </div>
  )
}

// Empty State Component
interface EmptyStateProps {
  title: string
  description: string
  icon?: React.ReactNode
  action?: {
    label: string
    onClick: () => void
    icon?: React.ReactNode
  }
  secondaryAction?: {
    label: string
    onClick: () => void
    icon?: React.ReactNode
  }
}

export function EmptyState({ 
  title, 
  description, 
  icon = <Inbox className="w-12 h-12" />,
  action,
  secondaryAction 
}: EmptyStateProps) {
  return (
    <Card className="text-center py-12">
      <CardContent className="space-y-4">
        <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center text-muted-foreground">
          {icon}
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">{title}</h3>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            {description}
          </p>
        </div>
        {(action || secondaryAction) && (
          <div className="flex gap-2 justify-center">
            {action && (
              <Button onClick={action.onClick} size="sm">
                {action.icon && <span className="mr-2">{action.icon}</span>}
                {action.label}
              </Button>
            )}
            {secondaryAction && (
              <Button onClick={secondaryAction.onClick} variant="outline" size="sm">
                {secondaryAction.icon && <span className="mr-2">{secondaryAction.icon}</span>}
                {secondaryAction.label}
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Specific Empty States
export function EmptyTasks({ onCreateTask }: { onCreateTask: () => void }) {
  return (
    <EmptyState
      title="No tasks yet"
      description="Get started by creating your first wedding planning task. We'll help you stay organized throughout your planning journey."
      icon={<Plus className="w-12 h-12" />}
      action={{
        label: "Create Task",
        onClick: onCreateTask,
        icon: <Plus className="w-4 h-4" />
      }}
    />
  )
}

export function EmptyTimeline({ onAddItem }: { onAddItem: () => void }) {
  return (
    <EmptyState
      title="No timeline items"
      description="Start building your wedding day timeline by adding events, vendor appointments, and special moments."
      icon={<Search className="w-12 h-12" />}
      action={{
        label: "Add Timeline Item",
        onClick: onAddItem,
        icon: <Plus className="w-4 h-4" />
      }}
    />
  )
}

export function EmptyMilestones({ onCreateMilestone }: { onCreateMilestone: () => void }) {
  return (
    <EmptyState
      title="No milestones set"
      description="Create milestones to track major planning checkpoints and keep your wedding planning on schedule."
      icon={<Inbox className="w-12 h-12" />}
      action={{
        label: "Create Milestone",
        onClick: onCreateMilestone,
        icon: <Plus className="w-4 h-4" />
      }}
    />
  )
}

// Loading States for Different Components
export function TasksLoading() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <TaskSkeleton key={i} />
      ))}
    </div>
  )
}

export function TimelineLoading() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 8 }).map((_, i) => (
        <TimelineItemSkeleton key={i} />
      ))}
    </div>
  )
}

export function MilestonesLoading() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <MilestoneSkeleton key={i} />
      ))}
    </div>
  )
} 