import { NextRequest, NextResponse } from 'next/server'
import { TaskService } from '../service/task.service'
import { startSpan } from '@/lib/observability/otel'
import { CreateTaskDto, UpdateTaskDto, TaskFilterDto } from '../dto/task.dto'

export class TaskHandler {
  private service = new TaskService()

  /**
   * GET /api/tasks - List tasks with filtering
   */
  async list(request: NextRequest, userId: string) {
    const span = await startSpan('tasks.list', { userId })
    try {
      const { searchParams } = new URL(request.url)
      
      // Parse query parameters
      const filters = {
        status: searchParams.get('status') || undefined,
        priority: searchParams.get('priority') || undefined,
        category: searchParams.get('category') || undefined,
        assignedTo: searchParams.get('assignedTo') || undefined,
        timeline: searchParams.get('timeline') || undefined,
        limit: parseInt(searchParams.get('limit') || '50'),
        offset: parseInt(searchParams.get('offset') || '0'),
        includeCompleted: searchParams.get('includeCompleted') !== 'false'
      }

      // Validate filters
      const validationResult = TaskFilterDto.safeParse(filters)
      if (!validationResult.success) {
        return NextResponse.json({
          success: false,
          error: {
            message: 'Invalid filter parameters',
            details: validationResult.error.issues
          }
        }, { status: 400 })
      }

      const result = await this.service.list(userId, validationResult.data)
      if (result.success) {
        // Validate shape defensively using DTO
        const { TaskListResponseDto } = await import('@/features/tasks/dto/task.dto')
        const data = TaskListResponseDto.parse(result.data)
        return NextResponse.json({ success: true, data })
      }
      // Dev fallback: use temp-storage in non-production
      if (process.env.NODE_ENV !== 'production') {
        const { tempStorage } = await import('@/lib/db/temp-storage')
        const all = await tempStorage.findTasksByUserId(userId)
        // apply minimal filtering
        const filtered = all.filter(t => !validationResult.data.status || t.status === (validationResult.data.status as any))
        return NextResponse.json({ success: true, data: { tasks: filtered, total: filtered.length, limit: filtered.length, offset: 0 } })
      }
      return NextResponse.json({ success: false, error: result.error }, { status: result.error?.statusCode || 500 })
    } catch (error) {
      console.error('Error in TaskHandler.list:', error)
      return NextResponse.json(
        { success: false, error: { message: 'Internal server error' } },
        { status: 500 }
      )
    } finally { span.end() }
  }

  /**
   * POST /api/tasks - Create a new task
   */
  async create(request: NextRequest, userId: string) {
    const span = await startSpan('tasks.create', { userId })
    try {
      const body = await request.json()
      
      // Validate input
      const validationResult = CreateTaskDto.safeParse(body)
      if (!validationResult.success) {
        return NextResponse.json({
          success: false,
          error: {
            message: 'Invalid task data',
            details: validationResult.error.issues
          }
        }, { status: 400 })
      }

      const result = await this.service.create(userId, validationResult.data)
      if (result.success) {
        const { TaskResponseDto } = await import('@/features/tasks/dto/task.dto')
        const data = TaskResponseDto.parse(result.data)
        return NextResponse.json({ success: true, data }, { status: 201 })
      }
      if (process.env.NODE_ENV !== 'production') {
        const { tempStorage } = await import('@/lib/db/temp-storage')
        const created = await tempStorage.createTask({
          userId,
          title: validationResult.data.title,
          description: validationResult.data.description,
          category: validationResult.data.category || undefined,
          priority: validationResult.data.priority as any,
          status: (validationResult.data.status || 'pending') as any,
          dueDate: validationResult.data.dueDate,
          assignedTo: validationResult.data.assignedTo || undefined,
          timeline: validationResult.data.timeline || undefined,
          order: validationResult.data.order || undefined,
          tags: validationResult.data.tags,
          notes: validationResult.data.notes || undefined
        })
        return NextResponse.json({ success: true, data: created }, { status: 201 })
      }
      return NextResponse.json({ success: false, error: result.error }, { status: result.error?.statusCode || 500 })
    } catch (error) {
      console.error('Error in TaskHandler.create:', error)
      return NextResponse.json(
        { success: false, error: { message: 'Internal server error' } },
        { status: 500 }
      )
    } finally { span.end() }
  }

  /**
   * GET /api/tasks/[id] - Get a single task
   */
  async getById(request: NextRequest, taskId: string) {
    const span = await startSpan('tasks.getById', { taskId })
    try {
      const result = await this.service.getById(taskId)
      
      if (!result.success) {
        return NextResponse.json(
          { success: false, error: result.error },
          { status: result.error?.statusCode || 500 }
        )
      }

      if (!result.data) {
        return NextResponse.json(
          { success: false, error: { message: 'Task not found' } },
          { status: 404 }
        )
      }

      return NextResponse.json({ success: true, data: result.data })
    } catch (error) {
      console.error('Error in TaskHandler.getById:', error)
      return NextResponse.json(
        { success: false, error: { message: 'Internal server error' } },
        { status: 500 }
      )
    } finally { span.end() }
  }

  /**
   * PATCH /api/tasks/[id] - Update a task
   */
  async update(request: NextRequest, taskId: string) {
    const span = await startSpan('tasks.update', { taskId })
    try {
      const body = await request.json()
      
      // Validate input
      const validationResult = UpdateTaskDto.safeParse(body)
      if (!validationResult.success) {
        return NextResponse.json({
          success: false,
          error: {
            message: 'Invalid task data',
            details: validationResult.error.issues
          }
        }, { status: 400 })
      }

      const result = await this.service.update(taskId, validationResult.data)
      if (result.success) {
        const { TaskResponseDto } = await import('@/features/tasks/dto/task.dto')
        const data = TaskResponseDto.parse(result.data)
        return NextResponse.json({ success: true, data })
      }
      if (process.env.NODE_ENV !== 'production') {
        const { tempStorage } = await import('@/lib/db/temp-storage')
        const updated = await tempStorage.updateTask(taskId, validationResult.data as any)
        if (updated) return NextResponse.json({ success: true, data: updated })
      }
      return NextResponse.json({ success: false, error: { message: 'Task not found' } }, { status: 404 })
    } catch (error) {
      console.error('Error in TaskHandler.update:', error)
      return NextResponse.json(
        { success: false, error: { message: 'Internal server error' } },
        { status: 500 }
      )
    } finally { span.end() }
  }

  /**
   * DELETE /api/tasks/[id] - Delete a task
   */
  async delete(request: NextRequest, taskId: string) {
    const span = await startSpan('tasks.delete', { taskId })
    try {
      const result = await this.service.delete(taskId)
      if (result.success) {
        return NextResponse.json({ success: true, data: { deleted: result.data } })
      }
      if (process.env.NODE_ENV !== 'production') {
        const { tempStorage } = await import('@/lib/db/temp-storage')
        const ok = await tempStorage.deleteTask(taskId)
        return NextResponse.json({ success: true, data: { deleted: ok } })
      }
      return NextResponse.json({ success: false, error: result.error }, { status: result.error?.statusCode || 500 })
    } catch (error) {
      console.error('Error in TaskHandler.delete:', error)
      return NextResponse.json(
        { success: false, error: { message: 'Internal server error' } },
        { status: 500 }
      )
    } finally { span.end() }
  }

  /**
   * GET /api/tasks/stats - Get task statistics
   */
  async getStats(request: NextRequest, userId: string) {
    const span = await startSpan('tasks.getStats', { userId })
    try {
      const result = await this.service.getStats(userId)
      
      if (!result.success) {
        return NextResponse.json(
          { success: false, error: result.error },
          { status: result.error?.statusCode || 500 }
        )
      }

      return NextResponse.json({ success: true, data: result.data })
    } catch (error) {
      console.error('Error in TaskHandler.getStats:', error)
      return NextResponse.json(
        { success: false, error: { message: 'Internal server error' } },
        { status: 500 }
      )
    } finally { span.end() }
  }

  /**
   * POST /api/tasks/template - Create tasks from template
   */
  async createFromTemplate(request: NextRequest, userId: string) {
    const span = await startSpan('tasks.createFromTemplate', { userId })
    try {
      const body = await request.json()
      const { timeline } = body

      if (!timeline || typeof timeline !== 'string') {
        return NextResponse.json({
          success: false,
          error: { message: 'Timeline is required' }
        }, { status: 400 })
      }

      const result = await this.service.createFromTemplate(userId, timeline)
      
      if (!result.success) {
        return NextResponse.json(
          { success: false, error: result.error },
          { status: result.error?.statusCode || 500 }
        )
      }

      return NextResponse.json(
        { success: true, data: result.data },
        { status: 201 }
      )
    } catch (error) {
      console.error('Error in TaskHandler.createFromTemplate:', error)
      return NextResponse.json(
        { success: false, error: { message: 'Internal server error' } },
        { status: 500 }
      )
    } finally { span.end() }
  }

  /**
   * PATCH /api/tasks/bulk - Bulk update task status
   */
  async bulkUpdate(request: NextRequest, userId: string) {
    try {
      const body = await request.json()
      const { taskIds, status } = body

      if (!Array.isArray(taskIds) || taskIds.length === 0) {
        return NextResponse.json({
          success: false,
          error: { message: 'Task IDs array is required' }
        }, { status: 400 })
      }

      if (!status || !['pending', 'in_progress', 'completed', 'cancelled', 'on_hold'].includes(status)) {
        return NextResponse.json({
          success: false,
          error: { message: 'Valid status is required' }
        }, { status: 400 })
      }

      const result = await this.service.bulkUpdateStatus(taskIds, status)
      
      if (!result.success) {
        return NextResponse.json(
          { success: false, error: result.error },
          { status: result.error?.statusCode || 500 }
        )
      }

      return NextResponse.json({ success: true, data: result.data })
    } catch (error) {
      console.error('Error in TaskHandler.bulkUpdate:', error)
      return NextResponse.json(
        { success: false, error: { message: 'Internal server error' } },
        { status: 500 }
      )
    }
  }
}
