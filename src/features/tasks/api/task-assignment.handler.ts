import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { TaskAssignmentService } from '../service/task-assignment.service'
import {
  AssignTaskDto,
  UnassignTaskDto,
  BulkAssignTasksDto,
  UpdateTaskAssignmentDto,
  TaskAssignmentFilterDto
} from '../dto/task-assignment.dto'

export class TaskAssignmentHandler {
  private taskAssignmentService: TaskAssignmentService

  constructor() {
    this.taskAssignmentService = new TaskAssignmentService()
  }

  /**
   * Get task assignments with filtering
   * GET /api/tasks/assignments
   */
  async getAssignments(request: NextRequest, userId: string, userRole: string): Promise<NextResponse> {
    try {
      const { searchParams } = new URL(request.url)
      
      // Parse query parameters
      const filters = {
        assigneeId: searchParams.get('assigneeId') || undefined,
        assignedBy: searchParams.get('assignedBy') || undefined,
        status: searchParams.get('status') as any || undefined,
        priority: searchParams.get('priority') as any || undefined,
        category: searchParams.get('category') || undefined,
        timeline: searchParams.get('timeline') || undefined,
        dueDateFrom: searchParams.get('dueDateFrom') || undefined,
        dueDateTo: searchParams.get('dueDateTo') || undefined,
        limit: parseInt(searchParams.get('limit') || '50'),
        offset: parseInt(searchParams.get('offset') || '0')
      }

      // Validate filters
      const validatedFilters = TaskAssignmentFilterDto.parse(filters)
      
      const result = await this.taskAssignmentService.getAssignments(userId, userRole, validatedFilters)
      
      if (!result.success) {
        return NextResponse.json(
          { error: result.error?.message || 'Failed to fetch assignments' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        assignments: result.data || [],
        total: (result.data || []).length
      })
    } catch (error) {
      console.error('Error in TaskAssignmentHandler.getAssignments:', error)
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Invalid query parameters', details: error.issues },
          { status: 400 }
        )
      }
      return NextResponse.json(
        { error: 'Failed to fetch assignments' },
        { status: 500 }
      )
    }
  }

  /**
   * Get assignments for a specific user
   * GET /api/tasks/assignments/user/{userId}
   */
  async getUserAssignments(
    request: NextRequest, 
    requesterId: string, 
    requesterRole: string,
    targetUserId: string
  ): Promise<NextResponse> {
    try {
      const { searchParams } = new URL(request.url)
      
      const filters = {
        status: searchParams.get('status') as any || undefined,
        priority: searchParams.get('priority') as any || undefined,
        category: searchParams.get('category') || undefined,
        limit: parseInt(searchParams.get('limit') || '50'),
        offset: parseInt(searchParams.get('offset') || '0')
      }
      
      const result = await this.taskAssignmentService.getUserAssignments(
        requesterId,
        requesterRole,
        targetUserId,
        filters
      )
      
      if (!result.success) {
        const message = result.error?.message || 'Failed to fetch user assignments'
        return NextResponse.json(
          { error: message },
          { status: message.includes('permissions') ? 403 : 500 }
        )
      }

      return NextResponse.json(result.data)
    } catch (error) {
      console.error('Error in TaskAssignmentHandler.getUserAssignments:', error)
      return NextResponse.json(
        { error: 'Failed to fetch user assignments' },
        { status: 500 }
      )
    }
  }

  /**
   * Assign a task to a user
   * POST /api/tasks/assignments
   */
  async assignTask(request: NextRequest, assignerId: string, assignerRole: string): Promise<NextResponse> {
    try {
      const body = await request.json()
      
      // Validate request body
      const validatedData = AssignTaskDto.parse({
        ...body,
        assignedBy: assignerId // Ensure assigner is the authenticated user
      })
      
      const result = await this.taskAssignmentService.assignTask(assignerId, assignerRole, validatedData)
      
      if (!result.success) {
        const message = result.error?.message || 'Failed to assign task'
        const statusCode = message.includes('permissions') ? 403 : 
                          message.includes('mismatch') ? 400 : 500
        return NextResponse.json(
          { error: message },
          { status: statusCode }
        )
      }

      return NextResponse.json(result.data, { status: 201 })
    } catch (error) {
      console.error('Error in TaskAssignmentHandler.assignTask:', error)
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Invalid request data', details: error.issues },
          { status: 400 }
        )
      }
      return NextResponse.json(
        { error: 'Failed to assign task' },
        { status: 500 }
      )
    }
  }

  /**
   * Bulk assign tasks to a user
   * POST /api/tasks/assignments/bulk
   */
  async bulkAssignTasks(request: NextRequest, assignerId: string, assignerRole: string): Promise<NextResponse> {
    try {
      const body = await request.json()
      
      // Validate request body
      const validatedData = BulkAssignTasksDto.parse({
        ...body,
        assignedBy: assignerId // Ensure assigner is the authenticated user
      })
      
      const result = await this.taskAssignmentService.bulkAssignTasks(assignerId, assignerRole, validatedData)
      
      if (!result.success) {
        const message = result.error?.message || 'Failed to bulk assign tasks'
        const statusCode = message.includes('permissions') ? 403 : 
                          message.includes('mismatch') ? 400 : 500
        return NextResponse.json(
          { error: message },
          { status: statusCode }
        )
      }

      return NextResponse.json({
        assignments: result.data || [],
        count: (result.data || []).length
      }, { status: 201 })
    } catch (error) {
      console.error('Error in TaskAssignmentHandler.bulkAssignTasks:', error)
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Invalid request data', details: error.issues },
          { status: 400 }
        )
      }
      return NextResponse.json(
        { error: 'Failed to bulk assign tasks' },
        { status: 500 }
      )
    }
  }

  /**
   * Update a task assignment
   * PATCH /api/tasks/assignments/{taskId}/{assigneeId}
   */
  async updateAssignment(
    request: NextRequest, 
    updaterId: string, 
    updaterRole: string,
    taskId: string,
    assigneeId: string
  ): Promise<NextResponse> {
    try {
      const body = await request.json()
      
      // Validate request body
      const validatedData = UpdateTaskAssignmentDto.parse({
        ...body,
        taskId,
        assigneeId,
        updatedBy: updaterId // Ensure updater is the authenticated user
      })
      
      const result = await this.taskAssignmentService.updateAssignment(updaterId, updaterRole, validatedData)
      
      if (!result.success) {
        const message = result.error?.message || 'Failed to update assignment'
        const statusCode = message.includes('permissions') ? 403 : 
                          message.includes('mismatch') ? 400 : 
                          message.includes('not found') ? 404 : 500
        return NextResponse.json(
          { error: message },
          { status: statusCode }
        )
      }

      return NextResponse.json(result.data)
    } catch (error) {
      console.error('Error in TaskAssignmentHandler.updateAssignment:', error)
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Invalid request data', details: error.issues },
          { status: 400 }
        )
      }
      return NextResponse.json(
        { error: 'Failed to update assignment' },
        { status: 500 }
      )
    }
  }

  /**
   * Unassign a task from a user
   * DELETE /api/tasks/assignments/{taskId}/{assigneeId}
   */
  async unassignTask(
    request: NextRequest, 
    unassignerId: string, 
    unassignerRole: string,
    taskId: string,
    assigneeId: string
  ): Promise<NextResponse> {
    try {
      const body = await request.json().catch(() => ({}))
      
      // Validate request data
      const validatedData = UnassignTaskDto.parse({
        taskId,
        assigneeId,
        unassignedBy: unassignerId,
        reason: body.reason
      })
      
      const result = await this.taskAssignmentService.unassignTask(unassignerId, unassignerRole, validatedData)
      
      if (!result.success) {
        const message = result.error?.message || 'Failed to unassign task'
        const statusCode = message.includes('permissions') ? 403 : 
                          message.includes('mismatch') ? 400 : 500
        return NextResponse.json(
          { error: message },
          { status: statusCode }
        )
      }

      return NextResponse.json({ success: true })
    } catch (error) {
      console.error('Error in TaskAssignmentHandler.unassignTask:', error)
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Invalid request data', details: error.issues },
          { status: 400 }
        )
      }
      return NextResponse.json(
        { error: 'Failed to unassign task' },
        { status: 500 }
      )
    }
  }

  /**
   * Get assignment statistics
   * GET /api/tasks/assignments/stats
   */
  async getAssignmentStats(
    request: NextRequest, 
    requesterId: string, 
    requesterRole: string
  ): Promise<NextResponse> {
    try {
      const { searchParams } = new URL(request.url)
      const targetUserId = searchParams.get('userId') || undefined
      
      const result = await this.taskAssignmentService.getAssignmentStats(
        requesterId,
        requesterRole,
        targetUserId
      )
      
      if (!result.success) {
        const message = result.error?.message || 'Failed to fetch assignment statistics'
        return NextResponse.json(
          { error: message },
          { status: message.includes('permissions') ? 403 : 500 }
        )
      }

      return NextResponse.json(result.data)
    } catch (error) {
      console.error('Error in TaskAssignmentHandler.getAssignmentStats:', error)
      return NextResponse.json(
        { error: 'Failed to fetch assignment statistics' },
        { status: 500 }
      )
    }
  }

  /**
   * Get a specific assignment
   * GET /api/tasks/assignments/{taskId}/{assigneeId}
   */
  async getAssignment(
    request: NextRequest, 
    requesterId: string, 
    requesterRole: string,
    taskId: string,
    assigneeId: string
  ): Promise<NextResponse> {
    try {
      const result = await this.taskAssignmentService.getAssignment(
        requesterId,
        requesterRole,
        taskId,
        assigneeId
      )
      
      if (!result.success) {
        const message = result.error?.message || 'Failed to fetch assignment'
        return NextResponse.json(
          { error: message },
          { status: message.includes('permissions') ? 403 : 500 }
        )
      }

      if (!result.data) {
        return NextResponse.json(
          { error: 'Assignment not found' },
          { status: 404 }
        )
      }

      return NextResponse.json(result.data)
    } catch (error) {
      console.error('Error in TaskAssignmentHandler.getAssignment:', error)
      return NextResponse.json(
        { error: 'Failed to fetch assignment' },
        { status: 500 }
      )
    }
  }

  /**
   * Auto-assign tasks
   * POST /api/tasks/assignments/auto-assign
   */
  async autoAssignTasks(
    request: NextRequest, 
    assignerId: string, 
    assignerRole: string
  ): Promise<NextResponse> {
    try {
      const body = await request.json()
      
      const { taskIds, targetUserIds, strategy = 'balanced' } = body
      
      // Basic validation
      if (!Array.isArray(taskIds) || !Array.isArray(targetUserIds)) {
        return NextResponse.json(
          { error: 'taskIds and targetUserIds must be arrays' },
          { status: 400 }
        )
      }
      
      const result = await this.taskAssignmentService.autoAssignTasks(
        assignerId,
        assignerRole,
        taskIds,
        targetUserIds,
        strategy
      )
      
      if (!result.success) {
        const message = result.error?.message || 'Failed to auto-assign tasks'
        const statusCode = message.includes('permissions') ? 403 : 
                          message.includes('required') ? 400 : 500
        return NextResponse.json(
          { error: message },
          { status: statusCode }
        )
      }

      return NextResponse.json({
        assignments: result.data || [],
        count: (result.data || []).length,
        strategy
      }, { status: 201 })
    } catch (error) {
      console.error('Error in TaskAssignmentHandler.autoAssignTasks:', error)
      return NextResponse.json(
        { error: 'Failed to auto-assign tasks' },
        { status: 500 }
      )
    }
  }
}