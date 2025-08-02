'use client'

import React, { useState, useCallback, useMemo } from 'react'
import { useEnhancedTasks } from '@/hooks/useEnhancedTasks'
import { useTimeline } from '@/hooks/useTimeline'
import { TimelineGanttChart } from '@/components/timeline/TimelineGanttChart'
import { TaskKanbanBoard } from '@/components/timeline/TaskKanbanBoard'
import { TaskDetailModal } from '@/components/timeline/TaskDetailModal'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Task,
  TimelineItem,
  Milestone,
  TaskStatus,
  TaskFilters,
  TaskWithDependencies
} from '@/types/timeline'
import {
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Users,
  GitBranch,
  LayoutGrid,
  BarChart3,
  Plus,
  Filter,
  Download,
  Upload
} from 'lucide-react'

type ViewMode = 'gantt' | 'kanban' | 'calendar'

export default function TimelineTaskPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('gantt')
  const [selectedTask, setSelectedTask] = useState<TaskWithDependencies | null>(null)
  const [filters, setFilters] = useState<TaskFilters>({
    show_completed: false,
    show_critical_path: true
  })

  const {
    tasks,
    analytics,
    loading: tasksLoading,
    error: tasksError,
    addTask,
    updateTask,
    deleteTask,
    addComment,
    assignTask,
    addReminder,
    calculateCriticalPath,
    loadTasks
  } = useEnhancedTasks()

  const {
    timelineItems,
    loading: timelineLoading,
    error: timelineError,
    timelineStats,
    addTimelineItem,
    updateTimelineItem,
    deleteTimelineItem
  } = useTimeline()

  // Mock milestones for now - TODO: Create useMilestones hook
  const milestones: Milestone[] = []

  // Handle task status change
  const handleTaskStatusChange = useCallback(async (taskId: string, newStatus: TaskStatus) => {
    await updateTask(taskId, newStatus)
    if (newStatus === 'completed') {
      await calculateCriticalPath()
    }
  }, [updateTask, calculateCriticalPath])

  // Handle task click
  const handleTaskClick = useCallback((task: TaskWithDependencies) => {
    setSelectedTask(task)
  }, [])

  // Handle task update from detail modal
  const handleTaskUpdate = useCallback(async (updates: any) => {
    if (!selectedTask) return
    await updateTask(selectedTask.id, updates)
  }, [selectedTask, updateTask])

  // Quick stats
  const quickStats = useMemo(() => {
    if (!analytics) return null

    return {
      completion: Math.round((analytics.completed_tasks / analytics.total_tasks) * 100) || 0,
      overdue: analytics.overdue_tasks,
      upcoming: analytics.upcoming_week_tasks,
      critical: analytics.critical_path_tasks,
      blocked: analytics.blocked_tasks
    }
  }, [analytics])

  if (tasksLoading || timelineLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading timeline and tasks...</p>
        </div>
      </div>
    )
  }

  if (tasksError || timelineError) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center text-red-600">
          <AlertCircle className="h-12 w-12 mx-auto mb-4" />
          <p>Error loading data: {tasksError || timelineError}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Timeline & Tasks</h1>
          <p className="text-gray-600 mt-1">
            Manage your wedding planning tasks and timeline in one place
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm">
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Task
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      {quickStats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Completion</p>
                <p className="text-2xl font-bold">{quickStats.completion}%</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Overdue</p>
                <p className="text-2xl font-bold">{quickStats.overdue}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">This Week</p>
                <p className="text-2xl font-bold">{quickStats.upcoming}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Critical Path</p>
                <p className="text-2xl font-bold">{quickStats.critical}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center">
                <GitBranch className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Blocked</p>
                <p className="text-2xl font-bold">{quickStats.blocked}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center">
                <AlertCircle className="h-6 w-6 text-gray-600" />
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* View Toggle & Filters */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'gantt' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('gantt')}
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            Gantt Chart
          </Button>
          <Button
            variant={viewMode === 'kanban' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('kanban')}
          >
            <LayoutGrid className="h-4 w-4 mr-2" />
            Kanban Board
          </Button>
          <Button
            variant={viewMode === 'calendar' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('calendar')}
          >
            <Calendar className="h-4 w-4 mr-2" />
            Calendar
          </Button>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-lg shadow-sm border min-h-[600px]">
        {viewMode === 'gantt' && (
          <TimelineGanttChart
            tasks={tasks}
            timelineItems={timelineItems}
            milestones={milestones}
            viewMode="month"
            onItemClick={(item) => {
              if ('status' in item && !('type' in item)) {
                handleTaskClick(item as TaskWithDependencies)
              }
            }}
            showCriticalPath={filters.show_critical_path}
          />
        )}

        {viewMode === 'kanban' && (
          <div className="p-6 h-[600px]">
            <TaskKanbanBoard
              tasks={tasks}
              onTaskMove={handleTaskStatusChange}
              onTaskClick={handleTaskClick}
              filters={filters}
              onFiltersChange={setFilters}
            />
          </div>
        )}

        {viewMode === 'calendar' && (
          <div className="p-6">
            <p className="text-gray-500 text-center py-12">
              Calendar view coming soon...
            </p>
          </div>
        )}
      </div>

      {/* Task Detail Modal */}
      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          open={!!selectedTask}
          onClose={() => setSelectedTask(null)}
          onUpdate={handleTaskUpdate}
          onStatusChange={(status) => handleTaskStatusChange(selectedTask.id, status)}
          onAddComment={async (comment) => {
            await addComment(selectedTask.id, comment)
          }}
          onAssign={async (assigneeId, type) => {
            await assignTask(selectedTask.id, assigneeId, type)
          }}
          onAddReminder={async (date, type) => {
            await addReminder(selectedTask.id, date, type)
          }}
        />
      )}
    </div>
  )
}