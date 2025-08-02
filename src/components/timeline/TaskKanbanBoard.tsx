'use client'

import React, { useState, useCallback, useMemo } from 'react'
import { 
  Task, 
  TaskStatus, 
  TaskPriority, 
  TaskFilters,
  TaskWithDependencies 
} from '@/types/timeline'
import { cn } from '@/utils/cn'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  Calendar, 
  Clock, 
  User, 
  Flag, 
  Search,
  Plus,
  Filter,
  MoreVertical,
  CheckCircle2,
  Circle,
  PlayCircle,
  XCircle,
  AlertCircle,
  Paperclip,
  MessageSquare,
  GitBranch
} from 'lucide-react'
import { format, isOverdue, differenceInDays } from 'date-fns'

interface TaskKanbanBoardProps {
  tasks: TaskWithDependencies[]
  onTaskMove?: (taskId: string, newStatus: TaskStatus) => void
  onTaskClick?: (task: TaskWithDependencies) => void
  onTaskCreate?: (status: TaskStatus) => void
  filters?: TaskFilters
  onFiltersChange?: (filters: TaskFilters) => void
  showDependencies?: boolean
}

const STATUS_CONFIG: Record<TaskStatus, {
  label: string
  icon: React.ElementType
  color: string
  bgColor: string
}> = {
  todo: {
    label: 'To Do',
    icon: Circle,
    color: 'text-gray-600',
    bgColor: 'bg-gray-50'
  },
  in_progress: {
    label: 'In Progress',
    icon: PlayCircle,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50'
  },
  completed: {
    label: 'Completed',
    icon: CheckCircle2,
    color: 'text-green-600',
    bgColor: 'bg-green-50'
  },
  cancelled: {
    label: 'Cancelled',
    icon: XCircle,
    color: 'text-gray-400',
    bgColor: 'bg-gray-50'
  },
  blocked: {
    label: 'Blocked',
    icon: AlertCircle,
    color: 'text-red-600',
    bgColor: 'bg-red-50'
  }
}

const PRIORITY_COLORS: Record<TaskPriority, string> = {
  low: 'bg-gray-100 text-gray-700',
  medium: 'bg-blue-100 text-blue-700',
  high: 'bg-orange-100 text-orange-700',
  urgent: 'bg-red-100 text-red-700'
}

export function TaskKanbanBoard({
  tasks,
  onTaskMove,
  onTaskClick,
  onTaskCreate,
  filters = {},
  onFiltersChange,
  showDependencies = true
}: TaskKanbanBoardProps) {
  const [draggedTask, setDraggedTask] = useState<Task | null>(null)
  const [dragOverStatus, setDragOverStatus] = useState<TaskStatus | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  // Filter and group tasks
  const filteredAndGroupedTasks = useMemo(() => {
    let filteredTasks = tasks

    // Apply filters
    if (filters.status?.length) {
      filteredTasks = filteredTasks.filter(task => 
        filters.status!.includes(task.status)
      )
    }

    if (filters.priority?.length) {
      filteredTasks = filteredTasks.filter(task => 
        filters.priority!.includes(task.priority)
      )
    }

    if (filters.category?.length) {
      filteredTasks = filteredTasks.filter(task => 
        filters.category!.includes(task.category)
      )
    }

    if (filters.assigned_to?.length) {
      filteredTasks = filteredTasks.filter(task => 
        filters.assigned_to!.includes(task.assigned_to)
      )
    }

    if (!filters.show_completed) {
      filteredTasks = filteredTasks.filter(task => 
        task.status !== 'completed' && task.status !== 'cancelled'
      )
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filteredTasks = filteredTasks.filter(task => 
        task.title.toLowerCase().includes(query) ||
        task.description?.toLowerCase().includes(query) ||
        task.tags.some(tag => tag.toLowerCase().includes(query))
      )
    }

    // Group by status
    const grouped = Object.keys(STATUS_CONFIG).reduce((acc, status) => {
      acc[status as TaskStatus] = filteredTasks.filter(task => task.status === status)
      return acc
    }, {} as Record<TaskStatus, TaskWithDependencies[]>)

    return grouped
  }, [tasks, filters, searchQuery])

  // Calculate column stats
  const columnStats = useMemo(() => {
    return Object.entries(filteredAndGroupedTasks).reduce((acc, [status, tasks]) => {
      acc[status as TaskStatus] = {
        count: tasks.length,
        overdue: tasks.filter(task => 
          task.due_date && isOverdue(new Date(task.due_date), new Date())
        ).length,
        critical: tasks.filter(task => task.critical_path).length,
        blocked: status === 'blocked' ? tasks.length : 0
      }
      return acc
    }, {} as Record<TaskStatus, any>)
  }, [filteredAndGroupedTasks])

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, task: Task) => {
    setDraggedTask(task)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent, status: TaskStatus) => {
    e.preventDefault()
    setDragOverStatus(status)
  }

  const handleDragLeave = () => {
    setDragOverStatus(null)
  }

  const handleDrop = (e: React.DragEvent, status: TaskStatus) => {
    e.preventDefault()
    setDragOverStatus(null)
    
    if (draggedTask && onTaskMove && draggedTask.status !== status) {
      onTaskMove(draggedTask.id, status)
    }
    
    setDraggedTask(null)
  }

  // Get task urgency indicator
  const getTaskUrgency = (task: Task) => {
    if (!task.due_date) return null
    
    const daysUntilDue = differenceInDays(new Date(task.due_date), new Date())
    
    if (daysUntilDue < 0) return { text: 'Overdue', color: 'text-red-600' }
    if (daysUntilDue === 0) return { text: 'Due Today', color: 'text-orange-600' }
    if (daysUntilDue <= 3) return { text: `${daysUntilDue}d`, color: 'text-orange-500' }
    if (daysUntilDue <= 7) return { text: `${daysUntilDue}d`, color: 'text-blue-500' }
    
    return null
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 flex gap-4 overflow-x-auto pb-4">
        {Object.entries(STATUS_CONFIG).map(([status, config]) => {
          const StatusIcon = config.icon
          const columnTasks = filteredAndGroupedTasks[status as TaskStatus] || []
          const stats = columnStats[status as TaskStatus] || {}

          return (
            <div
              key={status}
              className="flex-shrink-0 w-80 flex flex-col"
              onDragOver={(e) => handleDragOver(e, status as TaskStatus)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, status as TaskStatus)}
            >
              {/* Column Header */}
              <div className={cn(
                "p-3 rounded-t-lg",
                config.bgColor,
                dragOverStatus === status && "ring-2 ring-offset-2 ring-blue-500"
              )}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <StatusIcon className={cn("h-5 w-5", config.color)} />
                    <h3 className={cn("font-medium", config.color)}>
                      {config.label}
                    </h3>
                    <span className="text-sm text-gray-500">
                      ({columnTasks.length})
                    </span>
                  </div>
                  {onTaskCreate && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onTaskCreate(status as TaskStatus)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                
                {/* Column Stats */}
                <div className="flex items-center gap-2 mt-2 text-xs">
                  {stats.overdue > 0 && (
                    <Badge variant="destructive" className="text-xs">
                      {stats.overdue} overdue
                    </Badge>
                  )}
                  {stats.critical > 0 && (
                    <Badge variant="outline" className="text-xs">
                      {stats.critical} critical
                    </Badge>
                  )}
                </div>
              </div>

              {/* Column Content */}
              <div className={cn(
                "flex-1 p-2 bg-gray-50 rounded-b-lg overflow-y-auto space-y-2",
                dragOverStatus === status && "bg-blue-50"
              )}>
                {columnTasks.map((task) => {
                  const urgency = getTaskUrgency(task)
                  
                  return (
                    <Card
                      key={task.id}
                      className={cn(
                        "p-3 cursor-pointer transition-all hover:shadow-md",
                        draggedTask?.id === task.id && "opacity-50",
                        task.critical_path && "border-red-500"
                      )}
                      draggable
                      onDragStart={(e) => handleDragStart(e, task)}
                      onClick={() => onTaskClick?.(task)}
                    >
                      {/* Task Header */}
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h4 className="font-medium text-sm flex-1 line-clamp-2">
                          {task.title}
                        </h4>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </div>

                      {/* Task Meta */}
                      <div className="space-y-2">
                        {/* Priority & Category */}
                        <div className="flex items-center gap-2">
                          <Badge className={cn("text-xs", PRIORITY_COLORS[task.priority])}>
                            <Flag className="h-3 w-3 mr-1" />
                            {task.priority}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {task.category}
                          </Badge>
                        </div>

                        {/* Due Date & Urgency */}
                        {task.due_date && (
                          <div className="flex items-center gap-2 text-xs text-gray-600">
                            <Calendar className="h-3 w-3" />
                            <span>{format(new Date(task.due_date), 'MMM d')}</span>
                            {urgency && (
                              <span className={cn("font-medium", urgency.color)}>
                                • {urgency.text}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Progress */}
                        {task.progress_percentage > 0 && (
                          <div className="w-full bg-gray-200 rounded-full h-1.5">
                            <div
                              className="bg-blue-600 h-1.5 rounded-full transition-all"
                              style={{ width: `${task.progress_percentage}%` }}
                            />
                          </div>
                        )}

                        {/* Footer Info */}
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <div className="flex items-center gap-3">
                            {/* Assignee */}
                            <div className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              <span>{task.assigned_to}</span>
                            </div>

                            {/* Attachments */}
                            {task.attachments.length > 0 && (
                              <div className="flex items-center gap-1">
                                <Paperclip className="h-3 w-3" />
                                <span>{task.attachments.length}</span>
                              </div>
                            )}

                            {/* Comments */}
                            {/* TODO: Add comment count */}
                            
                            {/* Dependencies */}
                            {showDependencies && task.dependencies && task.dependencies.length > 0 && (
                              <div className="flex items-center gap-1">
                                <GitBranch className="h-3 w-3" />
                                <span>{task.dependencies.length}</span>
                              </div>
                            )}
                          </div>

                          {/* Critical Path Indicator */}
                          {task.critical_path && (
                            <Badge variant="destructive" className="text-xs px-1 py-0">
                              Critical
                            </Badge>
                          )}
                        </div>

                        {/* Blocked Reason */}
                        {task.status === 'blocked' && task.blocked_reason && (
                          <div className="text-xs text-red-600 flex items-start gap-1">
                            <AlertCircle className="h-3 w-3 mt-0.5" />
                            <span className="line-clamp-2">{task.blocked_reason}</span>
                          </div>
                        )}
                      </div>
                    </Card>
                  )
                })}

                {/* Empty State */}
                {columnTasks.length === 0 && (
                  <div className="text-center py-8 text-gray-400">
                    <p className="text-sm">No tasks</p>
                    {onTaskCreate && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="mt-2"
                        onClick={() => onTaskCreate(status as TaskStatus)}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Task
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}