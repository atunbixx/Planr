"use client"

import AuthClient from '@/lib/auth/client'
import { CreateTaskInput, UpdateTaskInput, TaskFilterInput, TaskResponse, TaskListResponse, TaskStatsResponse } from '@/features/tasks/dto/task.dto'

// API response envelope
type ApiEnvelope<T> = {
  success: boolean
  data?: T
  error?: { message: string; details?: any }
}

export class TasksClient {
  private static async authHeaders() {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${await AuthClient.getToken()}`
    }
  }

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
    
    const response = await fetch(url, {
      method: 'GET',
      headers: await this.authHeaders()
    })

    const result: ApiEnvelope<TaskListResponse> = await response.json()
    
    if (!result.success) {
      throw new Error(result.error?.message || 'Failed to fetch tasks')
    }

    return result.data!
  }

  /**
   * Get a single task by ID
   */
  static async getById(taskId: string): Promise<TaskResponse> {
    const response = await fetch(`/api/tasks/${taskId}`, {
      method: 'GET',
      headers: await this.authHeaders()
    })

    const result: ApiEnvelope<TaskResponse> = await response.json()
    
    if (!result.success) {
      throw new Error(result.error?.message || 'Failed to fetch task')
    }

    return result.data!
  }

  /**
   * Create a new task
   */
  static async create(data: CreateTaskInput): Promise<TaskResponse> {
    const response = await fetch('/api/tasks', {
      method: 'POST',
      headers: await this.authHeaders(),
      body: JSON.stringify(data)
    })

    const result: ApiEnvelope<TaskResponse> = await response.json()
    
    if (!result.success) {
      throw new Error(result.error?.message || 'Failed to create task')
    }

    return result.data!
  }

  /**
   * Update an existing task
   */
  static async update(taskId: string, data: UpdateTaskInput): Promise<TaskResponse> {
    const response = await fetch(`/api/tasks/${taskId}`, {
      method: 'PATCH',
      headers: await this.authHeaders(),
      body: JSON.stringify(data)
    })

    const result: ApiEnvelope<TaskResponse> = await response.json()
    
    if (!result.success) {
      throw new Error(result.error?.message || 'Failed to update task')
    }

    return result.data!
  }

  /**
   * Delete a task
   */
  static async delete(taskId: string): Promise<boolean> {
    const response = await fetch(`/api/tasks/${taskId}`, {
      method: 'DELETE',
      headers: await this.authHeaders()
    })

    const result: ApiEnvelope<{ deleted: boolean }> = await response.json()
    
    if (!result.success) {
      throw new Error(result.error?.message || 'Failed to delete task')
    }

    return result.data!.deleted
  }

  /**
   * Get task statistics
   */
  static async getStats(): Promise<TaskStatsResponse> {
    const response = await fetch('/api/tasks/stats', {
      method: 'GET',
      headers: await this.authHeaders()
    })

    const result: ApiEnvelope<TaskStatsResponse> = await response.json()
    
    if (!result.success) {
      throw new Error(result.error?.message || 'Failed to fetch task statistics')
    }

    return result.data!
  }

  /**
   * Create tasks from a template
   */
  static async createFromTemplate(timeline: string): Promise<TaskResponse[]> {
    const response = await fetch('/api/tasks/template', {
      method: 'POST',
      headers: await this.authHeaders(),
      body: JSON.stringify({ timeline })
    })

    const result: ApiEnvelope<TaskResponse[]> = await response.json()
    
    if (!result.success) {
      throw new Error(result.error?.message || 'Failed to create tasks from template')
    }

    return result.data!
  }

  /**
   * Bulk update task status
   */
  static async bulkUpdateStatus(
    taskIds: string[], 
    status: 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'on_hold'
  ): Promise<TaskResponse[]> {
    const response = await fetch('/api/tasks/bulk', {
      method: 'PATCH',
      headers: await this.authHeaders(),
      body: JSON.stringify({ taskIds, status })
    })

    const result: ApiEnvelope<TaskResponse[]> = await response.json()
    
    if (!result.success) {
      throw new Error(result.error?.message || 'Failed to bulk update tasks')
    }

    return result.data!
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