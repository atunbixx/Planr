"use client"

import { api } from '@/lib/api/fetcher'
import { TaskListResponseDto, TaskResponseDto, TaskStatsResponseDto, CreateTaskInput, UpdateTaskInput, TaskFilterInput, TaskResponse, TaskListResponse, TaskStatsResponse } from '@/features/tasks/dto/task.dto'

// API response envelope
type ApiEnvelope<T> = {
  success: boolean
  data?: T
  error?: { message: string; details?: any }
}

export class TasksClient {

  /**
   * List tasks with optional filtering
   */
  static async list(filters?: TaskFilterInput): Promise<TaskListResponse> {
    const params = new URLSearchParams()
    
    if (filters?.status) params.append('status', filters.status)
    if (filters?.priority) params.append('priority', filters.priority)
    if (filters?.category) params.append('category', filters.category)
    if (filters?.assignedTo) params.append('assignedTo', filters.assignedTo)
    if (filters?.timeline) params.append('timeline', filters.timeline)
    if (filters?.limit) params.append('limit', filters.limit.toString())
    if (filters?.offset) params.append('offset', filters.offset.toString())
    if (filters?.includeCompleted !== undefined) params.append('includeCompleted', filters.includeCompleted.toString())

    const url = `/api/tasks${params.toString() ? `?${params.toString()}` : ''}`
    const result = await api.get<ApiEnvelope<unknown>>(url)
    if (!result.success) throw new Error(result.error?.message || 'Failed to fetch tasks')
    const parsed = TaskListResponseDto.safeParse(result.data)
    if (!parsed.success) throw new Error('Invalid task list shape')
    return parsed.data
  }

  /**
   * Get a single task by ID
   */
  static async getById(taskId: string): Promise<TaskResponse> {
    const result = await api.get<ApiEnvelope<unknown>>(`/api/tasks/${taskId}`)
    if (!result.success) throw new Error(result.error?.message || 'Failed to fetch task')
    const parsed = TaskResponseDto.safeParse(result.data)
    if (!parsed.success) throw new Error('Invalid task shape')
    return parsed.data
  }

  /**
   * Create a new task
   */
  static async create(data: CreateTaskInput): Promise<TaskResponse> {
    const result = await api.post<ApiEnvelope<unknown>>('/api/tasks', data)
    if (!result.success) throw new Error(result.error?.message || 'Failed to create task')
    const parsed = TaskResponseDto.safeParse(result.data)
    if (!parsed.success) throw new Error('Invalid task shape')
    return parsed.data
  }

  /**
   * Update an existing task
   */
  static async update(taskId: string, data: UpdateTaskInput): Promise<TaskResponse> {
    const result = await api.patch<ApiEnvelope<unknown>>(`/api/tasks/${taskId}`, data)
    if (!result.success) throw new Error(result.error?.message || 'Failed to update task')
    const parsed = TaskResponseDto.safeParse(result.data)
    if (!parsed.success) throw new Error('Invalid task shape')
    return parsed.data
  }

  /**
   * Delete a task
   */
  static async delete(taskId: string): Promise<boolean> {
    const result = await api.delete<ApiEnvelope<{ deleted: boolean }>>(`/api/tasks/${taskId}`)
    if (!result.success) throw new Error(result.error?.message || 'Failed to delete task')
    return (result.data as any).deleted
  }

  /**
   * Get task statistics
   */
  static async getStats(): Promise<TaskStatsResponse> {
    const result = await api.get<ApiEnvelope<unknown>>('/api/tasks/stats')
    if (!result.success) throw new Error(result.error?.message || 'Failed to fetch task statistics')
    const parsed = TaskStatsResponseDto.safeParse(result.data)
    if (!parsed.success) throw new Error('Invalid task stats shape')
    return parsed.data
  }

  /**
   * Create tasks from a template
   */
  static async createFromTemplate(timeline: string): Promise<TaskResponse[]> {
    const result = await api.post<ApiEnvelope<unknown>>('/api/tasks/template', { timeline })
    if (!result.success) throw new Error(result.error?.message || 'Failed to create tasks from template')
    const parsed = TaskResponseDto.array().safeParse(result.data)
    if (!parsed.success) throw new Error('Invalid task array shape')
    return parsed.data
  }

  /**
   * Bulk update task status
   */
  static async bulkUpdateStatus(
    taskIds: string[], 
    status: 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'on_hold'
  ): Promise<TaskResponse[]> {
    const result = await api.patch<ApiEnvelope<unknown>>('/api/tasks/bulk', { taskIds, status })
    if (!result.success) throw new Error(result.error?.message || 'Failed to bulk update tasks')
    const parsed = TaskResponseDto.array().safeParse(result.data)
    if (!parsed.success) throw new Error('Invalid task array shape')
    return parsed.data
  }

  /**
   * Mark multiple tasks as completed
   */
  static async markCompleted(taskIds: string[]): Promise<TaskResponse[]> {
    return this.bulkUpdateStatus(taskIds, 'completed')
  }

  /**
   * Mark multiple tasks as in progress
   */
  static async markInProgress(taskIds: string[]): Promise<TaskResponse[]> {
    return this.bulkUpdateStatus(taskIds, 'in_progress')
  }

  /**
   * Get available task templates
   */
  static getAvailableTemplates(): { [key: string]: string } {
    return {
      '12_months': '12+ Months Before',
      '6_months': '6 Months Before',
      '3_months': '3 Months Before',
      '1_month': '1 Month Before',
      '1_week': '1 Week Before'
    }
  }

  /**
   * Get task priority labels
   */
  static getPriorityLabels(): { [key: string]: string } {
    return {
      'low': 'Low',
      'medium': 'Medium',
      'high': 'High',
      'urgent': 'Urgent'
    }
  }

  /**
   * Get task status labels
   */
  static getStatusLabels(): { [key: string]: string } {
    return {
      'pending': 'Pending',
      'in_progress': 'In Progress',
      'completed': 'Completed',
      'cancelled': 'Cancelled',
      'on_hold': 'On Hold'
    }
  }
}
