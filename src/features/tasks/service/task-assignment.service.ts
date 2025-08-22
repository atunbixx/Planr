import { RepositoryResult, createSuccessResult, createErrorResult } from '@/lib/repositories/BaseRepository'
import { TaskAssignmentRepository } from '../repo/task-assignment.repository'
import { 
  AssignTaskInput, 
  UnassignTaskInput, 
  BulkAssignTasksInput, 
  UpdateTaskAssignmentInput, 
  TaskAssignmentFilterInput,
  TaskAssignmentResponse,
  TaskAssignmentStatsResponse,
  UserTaskSummaryResponse,
  canAssignTasks,
  canViewAllAssignments,
  canManageAssignments
} from '../dto/task-assignment.dto'

type ServiceResult<T> = RepositoryResult<T>

export class TaskAssignmentService {
  private taskAssignmentRepo: TaskAssignmentRepository

  constructor() {
    this.taskAssignmentRepo = new TaskAssignmentRepository()
  }

  /**
   * Get task assignments with filtering
   */
  async getAssignments(
    userId: string, 
    userRole: string, 
    filters?: TaskAssignmentFilterInput
  ): Promise<ServiceResult<TaskAssignmentResponse[]>> {
    try {
      // Check permissions
      if (!canViewAllAssignments(userRole) && filters?.assigneeId !== userId) {
        // Non-privileged users can only see their own assignments
        filters = { ...filters, assigneeId: userId, limit: 50, offset: 0 }
      }

      const result = await this.taskAssignmentRepo.findAssignments(filters)
      if (!result.success) {
        return createErrorResult(result.error?.message || 'Failed to fetch assignments', 'SERVICE_ERROR', 500)
      }

      return createSuccessResult(result.data || [])
    } catch (error) {
      console.error('Error in TaskAssignmentService.getAssignments:', error)
      return createErrorResult('Failed to fetch assignments', 'SERVICE_ERROR', 500)
    }
  }

  /**
   * Get assignments for a specific user
   */
  async getUserAssignments(
    requesterId: string,
    requesterRole: string,
    targetUserId: string,
    filters?: Partial<TaskAssignmentFilterInput>
  ): Promise<ServiceResult<UserTaskSummaryResponse>> {
    try {
      // Check permissions - users can view their own assignments, privileged users can view any
      if (requesterId !== targetUserId && !canViewAllAssignments(requesterRole)) {
        return createErrorResult('Insufficient permissions to view user assignments', 'FORBIDDEN', 403)
      }

      const result = await this.taskAssignmentRepo.findUserAssignments(targetUserId, filters)
      if (!result.success) {
        return createErrorResult(result.error?.message || 'Failed to fetch user assignments', 'SERVICE_ERROR', 500)
      }

      // Calculate user stats
      const assignments = result.data || []
      const totalAssigned = assignments.length
      const completed = assignments.filter(a => a.status === 'completed').length
      const pending = assignments.filter(a => a.status === 'pending').length
      const inProgress = assignments.filter(a => a.status === 'in_progress').length
      const overdue = assignments.filter(a => 
        a.dueDate && new Date(a.dueDate) < new Date() && a.status !== 'completed'
      ).length
      const completionRate = totalAssigned > 0 ? (completed / totalAssigned) * 100 : 0

      const userSummary: UserTaskSummaryResponse = {
        userId: targetUserId,
        userEmail: assignments[0]?.assignee.email || '',
        userRole: assignments[0]?.assignee.role || 'couple',
        assignedTasks: assignments,
        stats: {
          totalAssigned,
          completed,
          pending,
          inProgress,
          overdue,
          completionRate
        }
      }

      return createSuccessResult(userSummary)
    } catch (error) {
      console.error('Error in TaskAssignmentService.getUserAssignments:', error)
      return createErrorResult('Failed to fetch user assignments', 'SERVICE_ERROR', 500)
    }
  }

  /**
   * Assign a task to a user
   */
  async assignTask(
    assignerId: string,
    assignerRole: string,
    data: AssignTaskInput
  ): Promise<ServiceResult<TaskAssignmentResponse>> {
    try {
      // Check permissions
      if (!canAssignTasks(assignerRole)) {
        return createErrorResult('Insufficient permissions to assign tasks', 'FORBIDDEN', 403)
      }

      // Validate assigner matches the one in data
      if (data.assignedBy !== assignerId) {
        return createErrorResult('Assigner ID mismatch', 'VALIDATION_ERROR', 400)
      }

      const result = await this.taskAssignmentRepo.assignTask(data)
      if (!result.success) {
        return createErrorResult(result.error?.message || 'Failed to assign task', 'SERVICE_ERROR', 500)
      }

      if (!result.data) {
        return createErrorResult('Assignment creation failed', 'SERVICE_ERROR', 500)
      }

      return createSuccessResult(result.data)
    } catch (error) {
      console.error('Error in TaskAssignmentService.assignTask:', error)
      return createErrorResult('Failed to assign task', 'SERVICE_ERROR', 500)
    }
  }

  /**
   * Bulk assign tasks to a user
   */
  async bulkAssignTasks(
    assignerId: string,
    assignerRole: string,
    data: BulkAssignTasksInput
  ): Promise<ServiceResult<TaskAssignmentResponse[]>> {
    try {
      // Check permissions
      if (!canAssignTasks(assignerRole)) {
        return createErrorResult('Insufficient permissions to assign tasks', 'FORBIDDEN', 403)
      }

      // Validate assigner matches the one in data
      if (data.assignedBy !== assignerId) {
        return createErrorResult('Assigner ID mismatch', 'VALIDATION_ERROR', 400)
      }

      // Validate task count
      if (data.taskIds.length > 20) {
        return createErrorResult('Cannot assign more than 20 tasks at once', 'VALIDATION_ERROR', 400)
      }

      const result = await this.taskAssignmentRepo.bulkAssignTasks(data)
      if (!result.success) {
        return createErrorResult(result.error?.message || 'Failed to bulk assign tasks', 'SERVICE_ERROR', 500)
      }

      return createSuccessResult(result.data || [])
    } catch (error) {
      console.error('Error in TaskAssignmentService.bulkAssignTasks:', error)
      return createErrorResult('Failed to bulk assign tasks', 'SERVICE_ERROR', 500)
    }
  }

  /**
   * Update a task assignment
   */
  async updateAssignment(
    updaterId: string,
    updaterRole: string,
    data: UpdateTaskAssignmentInput
  ): Promise<ServiceResult<TaskAssignmentResponse>> {
    try {
      // Check permissions - assignee can update their own assignments, managers can update any
      if (data.assigneeId !== updaterId && !canManageAssignments(updaterRole)) {
        return createErrorResult('Insufficient permissions to update assignment', 'FORBIDDEN', 403)
      }

      // Validate updater matches the one in data
      if (data.updatedBy !== updaterId) {
        return createErrorResult('Updater ID mismatch', 'VALIDATION_ERROR', 400)
      }

      const result = await this.taskAssignmentRepo.updateAssignment(data)
      if (!result.success) {
        return createErrorResult(result.error?.message || 'Failed to update assignment', 'SERVICE_ERROR', 500)
      }

      if (!result.data) {
        return createErrorResult('Assignment update failed', 'SERVICE_ERROR', 500)
      }

      return createSuccessResult(result.data)
    } catch (error) {
      console.error('Error in TaskAssignmentService.updateAssignment:', error)
      return createErrorResult('Failed to update assignment', 'SERVICE_ERROR', 500)
    }
  }

  /**
   * Unassign a task from a user
   */
  async unassignTask(
    unassignerId: string,
    unassignerRole: string,
    data: UnassignTaskInput
  ): Promise<ServiceResult<boolean>> {
    try {
      // Check permissions
      if (!canManageAssignments(unassignerRole)) {
        return createErrorResult('Insufficient permissions to unassign tasks', 'FORBIDDEN', 403)
      }

      // Validate unassigner matches the one in data
      if (data.unassignedBy !== unassignerId) {
        return createErrorResult('Unassigner ID mismatch', 'VALIDATION_ERROR', 400)
      }

      const result = await this.taskAssignmentRepo.unassignTask(data)
      if (!result.success) {
        return createErrorResult(result.error?.message || 'Failed to unassign task', 'SERVICE_ERROR', 500)
      }

      return createSuccessResult(result.data ?? false)
    } catch (error) {
      console.error('Error in TaskAssignmentService.unassignTask:', error)
      return createErrorResult('Failed to unassign task', 'SERVICE_ERROR', 500)
    }
  }

  /**
   * Get assignment statistics
   */
  async getAssignmentStats(
    requesterId: string,
    requesterRole: string,
    targetUserId?: string
  ): Promise<ServiceResult<TaskAssignmentStatsResponse>> {
    try {
      // Check permissions
      if (targetUserId && targetUserId !== requesterId && !canViewAllAssignments(requesterRole)) {
        return createErrorResult('Insufficient permissions to view user statistics', 'FORBIDDEN', 403)
      }

      const result = await this.taskAssignmentRepo.getAssignmentStats(targetUserId)
      if (!result.success) {
        return createErrorResult(result.error?.message || 'Failed to fetch assignment statistics', 'SERVICE_ERROR', 500)
      }

      const data = result.data || {
        totalAssignments: 0,
        assignmentsByStatus: {},
        assignmentsByPriority: {},
        overdueTasks: 0,
        completionRate: 0
      }

      // Transform to proper response format
      const stats: TaskAssignmentStatsResponse = {
        totalAssignments: data.totalAssignments,
        assignmentsByStatus: {
          pending: data.assignmentsByStatus.pending || 0,
          in_progress: data.assignmentsByStatus.in_progress || 0,
          completed: data.assignmentsByStatus.completed || 0,
          cancelled: data.assignmentsByStatus.cancelled || 0,
          on_hold: data.assignmentsByStatus.on_hold || 0
        },
        assignmentsByPriority: {
          low: data.assignmentsByPriority.low || 0,
          medium: data.assignmentsByPriority.medium || 0,
          high: data.assignmentsByPriority.high || 0,
          urgent: data.assignmentsByPriority.urgent || 0
        },
        assignmentsByUser: [], // TODO: Implement user breakdown
        overdueTasks: data.overdueTasks,
        completionRate: data.completionRate,
        averageCompletionTime: null // TODO: Implement completion time tracking
      }

      return createSuccessResult(stats)
    } catch (error) {
      console.error('Error in TaskAssignmentService.getAssignmentStats:', error)
      return createErrorResult('Failed to fetch assignment statistics', 'SERVICE_ERROR', 500)
    }
  }

  /**
   * Get assignment by task and assignee
   */
  async getAssignment(
    requesterId: string,
    requesterRole: string,
    taskId: string,
    assigneeId: string
  ): Promise<ServiceResult<TaskAssignmentResponse | null>> {
    try {
      // Check permissions
      if (assigneeId !== requesterId && !canViewAllAssignments(requesterRole)) {
        return createErrorResult('Insufficient permissions to view assignment', 'FORBIDDEN', 403)
      }

      const result = await this.taskAssignmentRepo.findAssignment(taskId, assigneeId)
      if (!result.success) {
        return createErrorResult(result.error?.message || 'Failed to fetch assignment', 'SERVICE_ERROR', 500)
      }

      return createSuccessResult(result.data ?? null)
    } catch (error) {
      console.error('Error in TaskAssignmentService.getAssignment:', error)
      return createErrorResult('Failed to fetch assignment', 'SERVICE_ERROR', 500)
    }
  }

  /**
   * Auto-assign tasks based on workload and preferences
   */
  async autoAssignTasks(
    assignerId: string,
    assignerRole: string,
    taskIds: string[],
    targetUserIds: string[],
    strategy: 'balanced' | 'priority' | 'random' = 'balanced'
  ): Promise<ServiceResult<TaskAssignmentResponse[]>> {
    try {
      // Check permissions
      if (!canAssignTasks(assignerRole)) {
        return createErrorResult('Insufficient permissions to auto-assign tasks', 'FORBIDDEN', 403)
      }

      // Validate inputs
      if (taskIds.length === 0 || targetUserIds.length === 0) {
        return createErrorResult('Task IDs and target user IDs are required', 'VALIDATION_ERROR', 400)
      }

      // Simple balanced assignment strategy
      const assignments: AssignTaskInput[] = []
      let userIndex = 0

      for (const taskId of taskIds) {
        assignments.push({
          taskId,
          assigneeId: targetUserIds[userIndex],
          assignedBy: assignerId,
          notes: `Auto-assigned using ${strategy} strategy`
        })
        userIndex = (userIndex + 1) % targetUserIds.length
      }

      // Execute assignments
      const results: TaskAssignmentResponse[] = []
      for (const assignment of assignments) {
        const result = await this.taskAssignmentRepo.assignTask(assignment)
        if (result.success && result.data) {
          results.push(result.data)
        }
      }

      return createSuccessResult(results)
    } catch (error) {
      console.error('Error in TaskAssignmentService.autoAssignTasks:', error)
      return createErrorResult('Failed to auto-assign tasks', 'SERVICE_ERROR', 500)
    }
  }
}