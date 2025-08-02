'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { TaskFilters } from '@/components/timeline/TaskFilters'

interface Task {
  id: string
  couple_id: string
  vendor_id?: string
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
  depends_on_task_id?: string
  notes?: string
  created_at: string
  updated_at: string
  timeline_item_id?: string
  milestone_id?: string
  recurring_pattern?: string
  recurring_end_date?: string
  task_template_id?: string
  critical_path: boolean
  blocked_reason?: string
  attachments: any[]
  tags: string[]
  progress_percentage: number
  status: string
  couple_vendors?: {
    id: string
    vendor_name: string
    vendor_type: string
    contact_email?: string
    contact_phone?: string
  }
  milestones?: {
    id: string
    title: string
    target_date: string
    status: string
    progress_percentage: number
  }
  timeline_items?: {
    id: string
    title: string
    start_time: string
    end_time?: string
    location?: string
  }
  task_assignments?: Array<{
    id: string
    assigned_to_user_id?: string
    assigned_to_vendor_id?: string
    accepted: boolean
    assigned_at: string
    notes?: string
  }>
  task_comments?: Array<{
    id: string
    comment: string
    created_at: string
    updated_at: string
    user_id: string
  }>
  task_dependencies?: Array<{
    id: string
    depends_on_task_id: string
    dependency_type: string
    lag_days: number
  }>
}

interface TaskAnalytics {
  overview: {
    totalTasks: number
    completedTasks: number
    overdueTasks: number
    upcomingWeekTasks: number
    urgentTasks: number
    criticalPathTasks: number
    blockedTasks: number
    completionRate: number
    avgCompletionDelay: number
    activeCategories: number
    vendorsWithTasks: number
    avgTaskProgress: number
  }
  breakdowns: {
    byCategory: Array<{ category: string; count: number; completed: number }>
    byPriority: Array<{ priority: string; count: number; completed: number }>
  }
  trends: {
    completionTrends: Array<{ date: string; completed: number; total: number }>
  }
  tasks: {
    overdue: Array<Task>
    upcoming: Array<Task>
  }
}

interface UseEnhancedTasksReturn {
  tasks: Task[]
  analytics: TaskAnalytics | null
  isLoading: boolean
  error: string | null
  filters: TaskFilters
  setFilters: (filters: TaskFilters) => void
  clearFilters: () => void
  createTask: (task: Partial<Task>) => Promise<Task | null>
  updateTask: (id: string, updates: Partial<Task>) => Promise<Task | null>
  deleteTask: (id: string) => Promise<boolean>
  completeTask: (id: string, notes?: string) => Promise<Task | null>
  uncompleteTask: (id: string) => Promise<Task | null>
  assignTask: (id: string, assignedTo: string, assignedBy: string) => Promise<boolean>
  addTaskComment: (id: string, comment: string) => Promise<boolean>
  addTaskDependency: (id: string, dependsOnId: string, type?: string) => Promise<boolean>
  removeTaskDependency: (id: string, dependsOnId: string) => Promise<boolean>
  calculateCriticalPath: () => Promise<Array<{ taskId: string; slackDays: number; isCritical: boolean }>>
  getTaskTemplates: () => Promise<Array<any>>
  applyTaskTemplate: (templateId: string) => Promise<Task[]>
  bulkUpdateTasks: (taskIds: string[], updates: Partial<Task>) => Promise<boolean>
  bulkDeleteTasks: (taskIds: string[]) => Promise<boolean>
  refreshTasks: () => Promise<void>
  refreshAnalytics: () => Promise<void>
}

export function useEnhancedTasks(): UseEnhancedTasksReturn {
  const [tasks, setTasks] = useState<Task[]>([])
  const [analytics, setAnalytics] = useState<TaskAnalytics | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<TaskFilters>({})
  const supabase = createClientComponentClient()

  // Fetch tasks with filters
  const fetchTasks = useCallback(async (currentFilters: TaskFilters = {}) => {
    try {
      setIsLoading(true)
      setError(null)

      // Build query parameters
      const params = new URLSearchParams()
      Object.entries(currentFilters).forEach(([key, value]) => {
        if (value !== undefined && value !== '' && value !== false) {
          params.append(key, String(value))
        }
      })

      const response = await fetch(`/api/tasks?${params.toString()}`)
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `HTTP ${response.status}: Failed to fetch tasks`)
      }

      const data = await response.json()
      setTasks(data.tasks || [])
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred while fetching tasks'
      setError(errorMessage)
      console.error('Error fetching tasks:', err)
      
      // Log to error reporting service in production
      if (process.env.NODE_ENV === 'production') {
        // Example: Sentry.captureException(err, { tags: { component: 'useEnhancedTasks', action: 'fetchTasks' } })
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Fetch analytics
  const fetchAnalytics = useCallback(async () => {
    try {
      const response = await fetch('/api/analytics/tasks')
      if (!response.ok) {
        throw new Error('Failed to fetch analytics')
      }

      const data = await response.json()
      setAnalytics(data)
    } catch (err) {
      console.error('Error fetching analytics:', err)
    }
  }, [])

  // Create task
  const createTask = useCallback(async (task: Partial<Task>): Promise<Task | null> => {
    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(task)
      })

      if (!response.ok) {
        throw new Error('Failed to create task')
      }

      const data = await response.json()
      await fetchTasks(filters) // Refresh tasks
      return data.task
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create task')
      return null
    }
  }, [filters, fetchTasks])

  // Update task
  const updateTask = useCallback(async (id: string, updates: Partial<Task>): Promise<Task | null> => {
    try {
      const response = await fetch(`/api/tasks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      })

      if (!response.ok) {
        throw new Error('Failed to update task')
      }

      const data = await response.json()
      await fetchTasks(filters) // Refresh tasks
      return data.task
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update task')
      return null
    }
  }, [filters, fetchTasks])

  // Delete task
  const deleteTask = useCallback(async (id: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/tasks/${id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to delete task')
      }

      await fetchTasks(filters) // Refresh tasks
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete task')
      return false
    }
  }, [filters, fetchTasks])

  // Complete task
  const completeTask = useCallback(async (id: string, notes?: string): Promise<Task | null> => {
    try {
      const response = await fetch(`/api/tasks/${id}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: true, notes })
      })

      if (!response.ok) {
        throw new Error('Failed to complete task')
      }

      const data = await response.json()
      await fetchTasks(filters) // Refresh tasks
      return data.task
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to complete task')
      return null
    }
  }, [filters, fetchTasks])

  // Uncomplete task
  const uncompleteTask = useCallback(async (id: string): Promise<Task | null> => {
    try {
      const response = await fetch(`/api/tasks/${id}/complete`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to uncomplete task')
      }

      const data = await response.json()
      await fetchTasks(filters) // Refresh tasks
      return data.task
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to uncomplete task')
      return null
    }
  }, [filters, fetchTasks])

  // Assign task
  const assignTask = useCallback(async (id: string, assignedTo: string, assignedBy: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/tasks/${id}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignedTo, assignedBy })
      })

      if (!response.ok) {
        throw new Error('Failed to assign task')
      }

      await fetchTasks(filters) // Refresh tasks
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to assign task')
      return false
    }
  }, [filters, fetchTasks])

  // Add task comment
  const addTaskComment = useCallback(async (id: string, comment: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/tasks/${id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comment })
      })

      if (!response.ok) {
        throw new Error('Failed to add comment')
      }

      await fetchTasks(filters) // Refresh tasks
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add comment')
      return false
    }
  }, [filters, fetchTasks])

  // Add task dependency
  const addTaskDependency = useCallback(async (id: string, dependsOnId: string, type: string = 'finish_to_start'): Promise<boolean> => {
    try {
      const response = await fetch(`/api/tasks/${id}/dependencies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dependsOnId, type })
      })

      if (!response.ok) {
        throw new Error('Failed to add dependency')
      }

      await fetchTasks(filters) // Refresh tasks
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add dependency')
      return false
    }
  }, [filters, fetchTasks])

  // Remove task dependency
  const removeTaskDependency = useCallback(async (id: string, dependsOnId: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/tasks/${id}/dependencies`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dependsOnId })
      })

      if (!response.ok) {
        throw new Error('Failed to remove dependency')
      }

      await fetchTasks(filters) // Refresh tasks
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove dependency')
      return false
    }
  }, [filters, fetchTasks])

  // Calculate critical path
  const calculateCriticalPath = useCallback(async (): Promise<Array<{ taskId: string; slackDays: number; isCritical: boolean }>> => {
    try {
      const response = await fetch('/api/analytics/critical-path')
      if (!response.ok) {
        throw new Error('Failed to calculate critical path')
      }

      const data = await response.json()
      return data.criticalPath || []
    } catch (err) {
      console.error('Error calculating critical path:', err)
      return []
    }
  }, [])

  // Get task templates
  const getTaskTemplates = useCallback(async (): Promise<Array<any>> => {
    try {
      const response = await fetch('/api/tasks/templates')
      if (!response.ok) {
        throw new Error('Failed to fetch templates')
      }

      const data = await response.json()
      return data.templates || []
    } catch (err) {
      console.error('Error fetching templates:', err)
      return []
    }
  }, [])

  // Apply task template
  const applyTaskTemplate = useCallback(async (templateId: string): Promise<Task[]> => {
    try {
      const response = await fetch(`/api/tasks/templates/${templateId}/apply`, {
        method: 'POST'
      })

      if (!response.ok) {
        throw new Error('Failed to apply template')
      }

      const data = await response.json()
      await fetchTasks(filters) // Refresh tasks
      return data.tasks || []
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to apply template')
      return []
    }
  }, [filters, fetchTasks])

  // Bulk update tasks
  const bulkUpdateTasks = useCallback(async (taskIds: string[], updates: Partial<Task>): Promise<boolean> => {
    try {
      const response = await fetch('/api/tasks/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskIds, updates })
      })

      if (!response.ok) {
        throw new Error('Failed to bulk update tasks')
      }

      await fetchTasks(filters) // Refresh tasks
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to bulk update tasks')
      return false
    }
  }, [filters, fetchTasks])

  // Bulk delete tasks
  const bulkDeleteTasks = useCallback(async (taskIds: string[]): Promise<boolean> => {
    try {
      const response = await fetch('/api/tasks/bulk', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskIds })
      })

      if (!response.ok) {
        throw new Error('Failed to bulk delete tasks')
      }

      await fetchTasks(filters) // Refresh tasks
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to bulk delete tasks')
      return false
    }
  }, [filters, fetchTasks])

  // Clear filters
  const clearFilters = useCallback(() => {
    setFilters({})
  }, [])

  // Refresh functions
  const refreshTasks = useCallback(() => fetchTasks(filters), [fetchTasks, filters])
  const refreshAnalytics = useCallback(() => fetchAnalytics(), [fetchAnalytics])

  // Initial load
  useEffect(() => {
    fetchTasks(filters)
    fetchAnalytics()
  }, [fetchTasks, fetchAnalytics, filters])

  return {
    tasks,
    analytics,
    isLoading,
    error,
    filters,
    setFilters,
    clearFilters,
    createTask,
    updateTask,
    deleteTask,
    completeTask,
    uncompleteTask,
    assignTask,
    addTaskComment,
    addTaskDependency,
    removeTaskDependency,
    calculateCriticalPath,
    getTaskTemplates,
    applyTaskTemplate,
    bulkUpdateTasks,
    bulkDeleteTasks,
    refreshTasks,
    refreshAnalytics
  }
}