import { TaskRepository } from '../repo/task.repository'
import { RepositoryResult, createErrorResult } from '@/lib/repositories/BaseRepository'
import { CreateTaskInput, UpdateTaskInput, TaskFilterInput, TaskResponse, TaskListResponse, TaskStatsResponse, WEDDING_TASK_TEMPLATES } from '../dto/task.dto'

// Task type definition (matches Prisma schema)
type Task = {
  id: string
  userId: string
  title: string
  description: string | null
  category: string | null
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'on_hold'
  dueDate: Date | null
  completedAt: Date | null
  assignedTo: string | null
  isTemplate: boolean
  templateId: string | null
  timeline: string | null
  order: number | null
  tags: string[]
  notes: string | null
  createdAt: Date
  updatedAt: Date
}

export interface ServiceResult<T> {
  success: boolean
  data?: T
  error?: {
    message: string
    code?: string
    statusCode?: number
  }
}

export class TaskService {
  private repository = new TaskRepository()

  /**
   * Get all tasks for a user with filtering
   */
  async list(userId: string, filters?: TaskFilterInput): Promise<ServiceResult<TaskListResponse>> {
    try {
      const result = await this.repository.findByUserId(userId, filters)
      
      if (!result.success) {
        return {
          success: false,
          error: result.error
        }
      }

      const tasks = result.data || []
      const total = tasks.length // In a real implementation, you'd get this from a separate count query
      
      return {
        success: true,
        data: {
          tasks: tasks.map(this.transformTaskToResponse),
          total,
          limit: filters?.limit || 50,
          offset: filters?.offset || 0
        }
      }
    } catch (error) {
      console.error('Error in TaskService.list:', error)
      return {
        success: false,
        error: {
          message: 'Failed to fetch tasks',
          code: 'SERVICE_ERROR',
          statusCode: 500
        }
      }
    }
  }

  /**
   * Get a single task by ID
   */
  async getById(taskId: string): Promise<ServiceResult<TaskResponse | null>> {
    try {
      const result = await this.repository.findById(taskId)
      
      if (!result.success) {
        return {
          success: false,
          error: result.error
        }
      }

      const task = result.data
      
      return {
        success: true,
        data: task ? this.transformTaskToResponse(task) : null
      }
    } catch (error) {
      console.error('Error in TaskService.getById:', error)
      return {
        success: false,
        error: {
          message: 'Failed to fetch task',
          code: 'SERVICE_ERROR',
          statusCode: 500
        }
      }
    }
  }

  /**
   * Create a new task
   */
  async create(userId: string, data: CreateTaskInput): Promise<ServiceResult<TaskResponse>> {
    try {
      // Validate input
      if (!data.title?.trim()) {
        return {
          success: false,
          error: {
            message: 'Task title is required',
            code: 'VALIDATION_ERROR',
            statusCode: 400
          }
        }
      }

      const result = await this.repository.create(userId, data)
      
      if (!result.success) {
        return {
          success: false,
          error: result.error
        }
      }

      return {
        success: true,
        data: this.transformTaskToResponse(result.data!)
      }
    } catch (error) {
      console.error('Error in TaskService.create:', error)
      return {
        success: false,
        error: {
          message: 'Failed to create task',
          code: 'SERVICE_ERROR',
          statusCode: 500
        }
      }
    }
  }

  /**
   * Update an existing task
   */
  async update(taskId: string, data: UpdateTaskInput): Promise<ServiceResult<TaskResponse>> {
    try {
      // Validate input
      if (data.title !== undefined && !data.title?.trim()) {
        return {
          success: false,
          error: {
            message: 'Task title cannot be empty',
            code: 'VALIDATION_ERROR',
            statusCode: 400
          }
        }
      }

      const result = await this.repository.update(taskId, data)
      
      if (!result.success) {
        return {
          success: false,
          error: result.error
        }
      }

      return {
        success: true,
        data: this.transformTaskToResponse(result.data!)
      }
    } catch (error) {
      console.error('Error in TaskService.update:', error)
      return {
        success: false,
        error: {
          message: 'Failed to update task',
          code: 'SERVICE_ERROR',
          statusCode: 500
        }
      }
    }
  }

  /**
   * Delete a task
   */
  async delete(taskId: string): Promise<ServiceResult<boolean>> {
    try {
      const result = await this.repository.delete(taskId)
      
      if (!result.success) {
        return {
          success: false,
          error: result.error
        }
      }

      return {
        success: true,
        data: result.data!
      }
    } catch (error) {
      console.error('Error in TaskService.delete:', error)
      return {
        success: false,
        error: {
          message: 'Failed to delete task',
          code: 'SERVICE_ERROR',
          statusCode: 500
        }
      }
    }
  }

  /**
   * Get task statistics for a user
   */
  async getStats(userId: string): Promise<ServiceResult<TaskStatsResponse>> {
    try {
      const result = await this.repository.getStats(userId)
      
      if (!result.success) {
        return {
          success: false,
          error: result.error
        }
      }

      return {
        success: true,
        data: result.data!
      }
    } catch (error) {
      console.error('Error in TaskService.getStats:', error)
      return {
        success: false,
        error: {
          message: 'Failed to get task statistics',
          code: 'SERVICE_ERROR',
          statusCode: 500
        }
      }
    }
  }

  /**
   * Create tasks from a template based on timeline
   */
  async createFromTemplate(userId: string, timeline: string): Promise<ServiceResult<TaskResponse[]>> {
    try {
      // Validate timeline
      const validTimelines = ['12_months', '6_months', '3_months', '1_month', '1_week']
      if (!validTimelines.includes(timeline)) {
        return {
          success: false,
          error: {
            message: 'Invalid timeline specified',
            code: 'VALIDATION_ERROR',
            statusCode: 400
          }
        }
      }

      const templateTasks = WEDDING_TASK_TEMPLATES[timeline as keyof typeof WEDDING_TASK_TEMPLATES]
      if (!templateTasks || templateTasks.length === 0) {
        return {
          success: false,
          error: {
            message: 'No template tasks found for timeline',
            code: 'NOT_FOUND',
            statusCode: 404
          }
        }
      }

      const result = await this.repository.createFromTemplate(userId, timeline, templateTasks)
      
      if (!result.success) {
        return {
          success: false,
          error: result.error
        }
      }

      return {
        success: true,
        data: result.data!.map(this.transformTaskToResponse)
      }
    } catch (error) {
      console.error('Error in TaskService.createFromTemplate:', error)
      return {
        success: false,
        error: {
          message: 'Failed to create tasks from template',
          code: 'SERVICE_ERROR',
          statusCode: 500
        }
      }
    }
  }

  /**
   * Bulk update task status
   */
  async bulkUpdateStatus(taskIds: string[], status: 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'on_hold'): Promise<ServiceResult<TaskResponse[]>> {
    try {
      const updatePromises = taskIds.map(id => 
        this.repository.update(id, { 
          status,
          completedAt: status === 'completed' ? new Date().toISOString() : undefined
        })
      )

      const results = await Promise.all(updatePromises)
      const successfulUpdates = results.filter(r => r.success).map(r => r.data!)
      const failedUpdates = results.filter(r => !r.success)

      if (failedUpdates.length > 0) {
        console.warn(`${failedUpdates.length} tasks failed to update`)
      }

      return {
        success: true,
        data: successfulUpdates.map(this.transformTaskToResponse)
      }
    } catch (error) {
      console.error('Error in TaskService.bulkUpdateStatus:', error)
      return {
        success: false,
        error: {
          message: 'Failed to bulk update task status',
          code: 'SERVICE_ERROR',
          statusCode: 500
        }
      }
    }
  }

  /**
   * Transform Task entity to TaskResponse DTO
   */
  private transformTaskToResponse(task: Task): TaskResponse {
    return {
      id: task.id,
      userId: task.userId,
      title: task.title,
      description: task.description,
      category: task.category,
      priority: task.priority as 'low' | 'medium' | 'high' | 'urgent',
      status: task.status as 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'on_hold',
      dueDate: task.dueDate,
      completedAt: task.completedAt,
      assignedTo: task.assignedTo,
      isTemplate: task.isTemplate,
      templateId: task.templateId,
      timeline: task.timeline,
      order: task.order,
      tags: task.tags,
      notes: task.notes,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt
    }
  }
}