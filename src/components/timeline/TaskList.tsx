'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  Calendar, 
  Clock, 
  User, 
  Tag, 
  AlertTriangle, 
  CheckCircle, 
  MoreHorizontal,
  Edit,
  Trash2,
  MessageSquare
} from 'lucide-react'
import { format, isAfter, isBefore, addDays } from 'date-fns'
import { cn } from '@/utils/cn'
import { ErrorBoundary } from '@/components/ui/error-boundary'
import { TasksLoading, EmptyTasks } from '@/components/ui/loading-states'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu'

interface Task {
  id: string
  title: string
  description?: string
  category: string
  priority: string
  assigned_to: string
  due_date?: string
  estimated_duration_hours?: number
  actual_duration_hours?: number
  completed: boolean
  completed_date?: string
  completed_by_user_id?: string
  notes?: string
  tags: string[]
  progress_percentage: number
  status: string
  critical_path: boolean
  blocked_reason?: string
  couple_vendors?: {
    id: string
    vendor_name: string
    vendor_type: string
  }
  milestones?: {
    id: string
    title: string
    target_date: string
  }
  task_comments?: Array<{
    id: string
    comment: string
    created_at: string
  }>
}

interface TaskListProps {
  tasks: Task[]
  isLoading: boolean
  error: string | null
  onTaskClick?: (task: Task) => void
  onTaskComplete?: (taskId: string, completed: boolean) => Promise<void>
  onTaskDelete?: (taskId: string) => Promise<void>
  onTaskEdit?: (task: Task) => void
  onCreateTask?: () => void
}

export function TaskList({
  tasks,
  isLoading,
  error,
  onTaskClick,
  onTaskComplete,
  onTaskDelete,
  onTaskEdit,
  onCreateTask
}: TaskListProps) {
  const [completingTasks, setCompletingTasks] = useState<Set<string>>(new Set())
  const [deletingTasks, setDeletingTasks] = useState<Set<string>>(new Set())

  const handleTaskComplete = async (taskId: string, completed: boolean) => {
    if (!onTaskComplete) return

    setCompletingTasks(prev => new Set(prev).add(taskId))
    try {
      await onTaskComplete(taskId, completed)
    } catch (error) {
      console.error('Error completing task:', error)
    } finally {
      setCompletingTasks(prev => {
        const newSet = new Set(prev)
        newSet.delete(taskId)
        return newSet
      })
    }
  }

  const handleTaskDelete = async (taskId: string) => {
    if (!onTaskDelete) return

    setDeletingTasks(prev => new Set(prev).add(taskId))
    try {
      await onTaskDelete(taskId)
    } catch (error) {
      console.error('Error deleting task:', error)
    } finally {
      setDeletingTasks(prev => {
        const newSet = new Set(prev)
        newSet.delete(taskId)
        return newSet
      })
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-50 text-red-700 border-red-200'
      case 'high':
        return 'bg-orange-50 text-orange-700 border-orange-200'
      case 'medium':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200'
      case 'low':
        return 'bg-green-50 text-green-700 border-green-200'
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200'
      case 'in_progress':
        return 'bg-blue-50 text-blue-700 border-blue-200'
      case 'blocked':
        return 'bg-amber-50 text-amber-700 border-amber-200'
      case 'cancelled':
        return 'bg-gray-50 text-gray-700 border-gray-200'
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200'
    }
  }

  const getDaysUntilDue = (dueDate: string) => {
    const today = new Date()
    const due = new Date(dueDate)
    const diffTime = due.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const isOverdue = (dueDate: string) => {
    return getDaysUntilDue(dueDate) < 0
  }

  const isDueSoon = (dueDate: string) => {
    const daysUntilDue = getDaysUntilDue(dueDate)
    return daysUntilDue >= 0 && daysUntilDue <= 3
  }

  if (error) {
    return (
      <Card className="border-destructive/50">
        <CardContent className="p-6 text-center">
          <AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-destructive mb-2">
            Error Loading Tasks
          </h3>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={() => window.location.reload()} variant="outline">
            Try Again
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (isLoading) {
    return <TasksLoading />
  }

  if (tasks.length === 0) {
    return <EmptyTasks onCreateTask={onCreateTask} />
  }

  return (
    <div className="space-y-4">
      {tasks.map((task) => {
        const isCompleting = completingTasks.has(task.id)
        const isDeleting = deletingTasks.has(task.id)
        const daysUntilDue = task.due_date ? getDaysUntilDue(task.due_date) : null
        const overdue = task.due_date ? isOverdue(task.due_date) : false
        const dueSoon = task.due_date ? isDueSoon(task.due_date) : false

        return (
          <ErrorBoundary key={task.id}>
            <Card 
              className={cn(
                "transition-all hover:shadow-md cursor-pointer",
                task.completed && "opacity-75",
                task.critical_path && "border-orange-200 bg-orange-50/30",
                overdue && !task.completed && "border-red-200 bg-red-50/30",
                dueSoon && !task.completed && "border-yellow-200 bg-yellow-50/30"
              )}
              onClick={() => onTaskClick?.(task)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    {/* Header */}
                    <div className="flex items-start gap-3 mb-2">
                      <Checkbox
                        checked={task.completed}
                        onCheckedChange={(checked) => 
                          handleTaskComplete(task.id, checked as boolean)
                        }
                        disabled={isCompleting}
                        className="mt-1"
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className={cn(
                          "font-medium text-sm leading-tight",
                          task.completed && "line-through text-muted-foreground"
                        )}>
                          {task.title}
                        </h3>
                        {task.description && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {task.description}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Badges */}
                    <div className="flex flex-wrap gap-2 mb-3">
                      <Badge 
                        variant="secondary" 
                        className={cn("text-xs border", getPriorityColor(task.priority))}
                      >
                        {task.priority}
                      </Badge>
                      <Badge 
                        variant="secondary" 
                        className={cn("text-xs border", getStatusColor(task.status))}
                      >
                        {task.status.replace('_', ' ')}
                      </Badge>
                      {task.critical_path && (
                        <Badge variant="secondary" className="text-xs border bg-orange-50 text-orange-700 border-orange-200">
                          Critical Path
                        </Badge>
                      )}
                      {task.blocked_reason && (
                        <Badge variant="secondary" className="text-xs border bg-amber-50 text-amber-700 border-amber-200">
                          Blocked
                        </Badge>
                      )}
                    </div>

                    {/* Progress */}
                    {!task.completed && (
                      <div className="space-y-2 mb-3">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Progress</span>
                          <span className="font-medium">{task.progress_percentage}%</span>
                        </div>
                        <Progress value={task.progress_percentage} className="h-2" />
                      </div>
                    )}

                    {/* Metadata */}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      {task.due_date && (
                        <div className={cn(
                          "flex items-center gap-1",
                          overdue && !task.completed && "text-red-600 font-medium",
                          dueSoon && !task.completed && "text-yellow-600 font-medium"
                        )}>
                          <Calendar className="w-3 h-3" />
                          {format(new Date(task.due_date), 'MMM dd, yyyy')}
                          {overdue && !task.completed && (
                            <span className="text-red-600">({Math.abs(daysUntilDue!)} days overdue)</span>
                          )}
                          {dueSoon && !task.completed && (
                            <span className="text-yellow-600">(due in {daysUntilDue} days)</span>
                          )}
                        </div>
                      )}
                      
                      {task.estimated_duration_hours && (
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {task.estimated_duration_hours}h
                        </div>
                      )}

                      <div className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {task.assigned_to === 'both' ? 'Both Partners' : 
                         task.assigned_to === 'partner1' ? 'Partner 1' :
                         task.assigned_to === 'partner2' ? 'Partner 2' : 'Vendor'}
                      </div>

                      {task.task_comments && task.task_comments.length > 0 && (
                        <div className="flex items-center gap-1">
                          <MessageSquare className="w-3 h-3" />
                          {task.task_comments.length}
                        </div>
                      )}
                    </div>

                    {/* Tags */}
                    {task.tags && task.tags.length > 0 && (
                      <div className="flex items-center gap-1 mt-2">
                        <Tag className="w-3 h-3 text-muted-foreground" />
                        <div className="flex flex-wrap gap-1">
                          {task.tags.slice(0, 3).map((tag, index) => (
                            <span 
                              key={index}
                              className="text-xs bg-muted px-2 py-1 rounded-full text-muted-foreground"
                            >
                              {tag}
                            </span>
                          ))}
                          {task.tags.length > 3 && (
                            <span className="text-xs text-muted-foreground">
                              +{task.tags.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Vendor/Milestone Info */}
                    {(task.couple_vendors || task.milestones) && (
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        {task.couple_vendors && (
                          <span>Vendor: {task.couple_vendors.vendor_name}</span>
                        )}
                        {task.milestones && (
                          <span>Milestone: {task.milestones.title}</span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 ml-4">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation()
                          onTaskEdit?.(task)
                        }}>
                          <Edit className="w-4 h-4 mr-2" />
                          Edit Task
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={(e) => {
                            e.stopPropagation()
                            handleTaskDelete(task.id)
                          }}
                          disabled={isDeleting}
                          className="text-destructive"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          {isDeleting ? 'Deleting...' : 'Delete Task'}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardContent>
            </Card>
          </ErrorBoundary>
        )
      })}
    </div>
  )
} 