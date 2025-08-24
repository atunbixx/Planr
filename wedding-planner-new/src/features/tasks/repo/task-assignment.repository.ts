import { BaseRepository, RepositoryResult, createSuccessResult, createErrorResult } from '@/lib/repositories/BaseRepository'
import { tempStorage } from '@/lib/db/temp-storage'
import { AssignTaskInput, UnassignTaskInput, BulkAssignTasksInput, UpdateTaskAssignmentInput, TaskAssignmentFilterInput } from '../dto/task-assignment.dto'

// Type definitions (matches Prisma schema)
type TaskAssignment = {
  id: string
  taskId: string
  assigneeId: string
  assignedBy: string
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'on_hold'
  notes: string | null
  dueDate: Date | null
  assignedAt: Date
  updatedAt: Date
}

type TaskAssignmentWithRelations = TaskAssignment & {
  task: {
    id: string
    title: string
    description: string | null
    category: string | null
    priority: 'low' | 'medium' | 'high' | 'urgent'
    timeline: string | null
    order: number | null
    tags: string[]
  }
  assignee: {
    id: string
    email: string
    role: 'couple' | 'planner' | 'vendor' | 'admin'
    isActive: boolean
  }
  assigner: {
    id: string
    email: string
    role: 'couple' | 'planner' | 'vendor' | 'admin'
    isActive: boolean
  }
}

export class TaskAssignmentRepository extends BaseRepository {

  /**
   * Find task assignments with filters
   */
  async findAssignments(filters?: TaskAssignmentFilterInput): Promise<RepositoryResult<TaskAssignmentWithRelations[]>> {
    try {
      const { limit = 50, offset = 0, assigneeId, assignedBy, status, priority, category, timeline, dueDateFrom, dueDateTo } = filters || {}
      
      // Try database first
      try {
        const where: any = {}
        
        if (assigneeId) where.assigneeId = assigneeId
        if (assignedBy) where.assignedBy = assignedBy
        if (status) where.status = status
        if (dueDateFrom || dueDateTo) {
          where.dueDate = {}
          if (dueDateFrom) where.dueDate.gte = new Date(dueDateFrom)
          if (dueDateTo) where.dueDate.lte = new Date(dueDateTo)
        }
        
        // Task-level filters
        if (priority || category || timeline) {
          where.task = {}
          if (priority) where.task.priority = priority
          if (category) where.task.category = category
          if (timeline) where.task.timeline = timeline
        }

        const assignments = await (this.db as any).taskAssignment.findMany({
          where,
          include: {
            task: {
              select: {
                id: true,
                title: true,
                description: true,
                category: true,
                priority: true,
                timeline: true,
                order: true,
                tags: true
              }
            },
            assignee: {
              select: {
                id: true,
                email: true,
                role: true,
                isActive: true
              }
            },
            assigner: {
              select: {
                id: true,
                email: true,
                role: true,
                isActive: true
              }
            }
          },
          orderBy: { assignedAt: 'desc' },
          take: limit,
          skip: offset
        })

        return createSuccessResult(assignments)
      } catch (dbError) {
        // Fallback to temp storage
        console.warn('Database not available, using temp storage:', dbError)
        const tempAssignments = await tempStorage.listTaskAssignments(filters || {})
        return createSuccessResult(tempAssignments.map(this.transformTempAssignment))
      }
    } catch (error) {
      console.error('Error in TaskAssignmentRepository.findAssignments:', error)
      return createErrorResult('Failed to fetch task assignments', 'FETCH_ERROR', 500)
    }
  }

  /**
   * Find assignments for a specific user
   */
  async findUserAssignments(userId: string, filters?: Partial<TaskAssignmentFilterInput>): Promise<RepositoryResult<TaskAssignmentWithRelations[]>> {
    return this.findAssignments({ limit: 50, offset: 0, ...filters, assigneeId: userId })
  }

  /**
   * Find assignment by task and assignee
   */
  async findAssignment(taskId: string, assigneeId: string): Promise<RepositoryResult<TaskAssignmentWithRelations | null>> {
    try {
      // Try database first
      try {
        const assignment = await (this.db as any).taskAssignment.findUnique({
          where: {
            taskId_assigneeId: {
              taskId,
              assigneeId
            }
          },
          include: {
            task: {
              select: {
                id: true,
                title: true,
                description: true,
                category: true,
                priority: true,
                timeline: true,
                order: true,
                tags: true
              }
            },
            assignee: {
              select: {
                id: true,
                email: true,
                role: true,
                isActive: true
              }
            },
            assigner: {
              select: {
                id: true,
                email: true,
                role: true,
                isActive: true
              }
            }
          }
        })
        return createSuccessResult(assignment)
      } catch (dbError) {
        // Fallback to temp storage
        const tempAssignment = await tempStorage.findTaskAssignment(taskId, assigneeId)
        return createSuccessResult(tempAssignment ? this.transformTempAssignment(tempAssignment) : null)
      }
    } catch (error) {
      console.error('Error in TaskAssignmentRepository.findAssignment:', error)
      return createErrorResult('Failed to fetch task assignment', 'FETCH_ERROR', 500)
    }
  }

  /**
   * Assign task to user
   */
  async assignTask(data: AssignTaskInput): Promise<RepositoryResult<TaskAssignmentWithRelations>> {
    try {
      const assignmentData = {
        taskId: data.taskId,
        assigneeId: data.assigneeId,
        assignedBy: data.assignedBy,
        notes: data.notes || null,
        dueDate: data.dueDate ? new Date(data.dueDate) : null
      }

      // Try database first
      try {
        const assignment = await (this.db as any).taskAssignment.create({
          data: assignmentData,
          include: {
            task: {
              select: {
                id: true,
                title: true,
                description: true,
                category: true,
                priority: true,
                timeline: true,
                order: true,
                tags: true
              }
            },
            assignee: {
              select: {
                id: true,
                email: true,
                role: true,
                isActive: true
              }
            },
            assigner: {
              select: {
                id: true,
                email: true,
                role: true,
                isActive: true
              }
            }
          }
        })
        return createSuccessResult(assignment)
      } catch (dbError) {
        // Fallback to temp storage
        const tempAssignment = await tempStorage.createTaskAssignment({
          taskId: data.taskId,
          assigneeId: data.assigneeId,
          assignedBy: data.assignedBy,
          notes: data.notes,
          dueDate: data.dueDate
        })
        return createSuccessResult(this.transformTempAssignment(tempAssignment))
      }
    } catch (error) {
      console.error('Error in TaskAssignmentRepository.assignTask:', error)
      return createErrorResult('Failed to assign task', 'ASSIGN_ERROR', 500)
    }
  }

  /**
   * Bulk assign tasks to user
   */
  async bulkAssignTasks(data: BulkAssignTasksInput): Promise<RepositoryResult<TaskAssignmentWithRelations[]>> {
    try {
      // Try database first
      try {
        const assignments = await Promise.all(
          data.taskIds.map(taskId => 
            (this.db as any).taskAssignment.create({
              data: {
                taskId,
                assigneeId: data.assigneeId,
                assignedBy: data.assignedBy,
                notes: data.notes || null,
                dueDate: data.dueDate ? new Date(data.dueDate) : null
              },
              include: {
                task: {
                  select: {
                    id: true,
                    title: true,
                    description: true,
                    category: true,
                    priority: true,
                    timeline: true,
                    order: true,
                    tags: true
                  }
                },
                assignee: {
                  select: {
                    id: true,
                    email: true,
                    role: true,
                    isActive: true
                  }
                },
                assigner: {
                  select: {
                    id: true,
                    email: true,
                    role: true,
                    isActive: true
                  }
                }
              }
            })
          )
        )
        return createSuccessResult(assignments)
      } catch (dbError) {
        // Fallback to temp storage
        const tempAssignments = await tempStorage.bulkAssignTasks({
          taskIds: data.taskIds,
          assigneeId: data.assigneeId,
          assignedBy: data.assignedBy,
          notes: data.notes,
          dueDate: data.dueDate
        })
        return createSuccessResult(tempAssignments.map(this.transformTempAssignment))
      }
    } catch (error) {
      console.error('Error in TaskAssignmentRepository.bulkAssignTasks:', error)
      return createErrorResult('Failed to bulk assign tasks', 'BULK_ASSIGN_ERROR', 500)
    }
  }

  /**
   * Update task assignment
   */
  async updateAssignment(data: UpdateTaskAssignmentInput): Promise<RepositoryResult<TaskAssignmentWithRelations>> {
    try {
      const updateData: any = {
        updatedAt: new Date()
      }
      
      if (data.status !== undefined) updateData.status = data.status
      if (data.notes !== undefined) updateData.notes = data.notes
      if (data.dueDate !== undefined) updateData.dueDate = data.dueDate ? new Date(data.dueDate) : null

      // Try database first
      try {
        const assignment = await (this.db as any).taskAssignment.update({
          where: {
            taskId_assigneeId: {
              taskId: data.taskId,
              assigneeId: data.assigneeId
            }
          },
          data: updateData,
          include: {
            task: {
              select: {
                id: true,
                title: true,
                description: true,
                category: true,
                priority: true,
                timeline: true,
                order: true,
                tags: true
              }
            },
            assignee: {
              select: {
                id: true,
                email: true,
                role: true,
                isActive: true
              }
            },
            assigner: {
              select: {
                id: true,
                email: true,
                role: true,
                isActive: true
              }
            }
          }
        })
        return createSuccessResult(assignment)
      } catch (dbError) {
        // Fallback to temp storage
        const tempAssignment = await tempStorage.updateTaskAssignment(data.taskId, data.assigneeId, {
          status: data.status,
          notes: data.notes,
          dueDate: data.dueDate,
          updatedBy: data.updatedBy
        })
        if (!tempAssignment) {
          return createErrorResult('Assignment not found', 'NOT_FOUND', 404)
        }
        return createSuccessResult(this.transformTempAssignment(tempAssignment))
      }
    } catch (error) {
      console.error('Error in TaskAssignmentRepository.updateAssignment:', error)
      return createErrorResult('Failed to update task assignment', 'UPDATE_ERROR', 500)
    }
  }

  /**
   * Unassign task from user
   */
  async unassignTask(data: UnassignTaskInput): Promise<RepositoryResult<boolean>> {
    try {
      // Try database first
      try {
        await (this.db as any).taskAssignment.delete({
          where: {
            taskId_assigneeId: {
              taskId: data.taskId,
              assigneeId: data.assigneeId
            }
          }
        })
        return createSuccessResult(true)
      } catch (dbError) {
        // Fallback to temp storage
        const result = await tempStorage.unassignTask(data.taskId, data.assigneeId)
        return createSuccessResult(result)
      }
    } catch (error) {
      console.error('Error in TaskAssignmentRepository.unassignTask:', error)
      return createErrorResult('Failed to unassign task', 'UNASSIGN_ERROR', 500)
    }
  }

  /**
   * Get assignment statistics
   */
  async getAssignmentStats(userId?: string): Promise<RepositoryResult<{
    totalAssignments: number
    assignmentsByStatus: Record<string, number>
    assignmentsByPriority: Record<string, number>
    overdueTasks: number
    completionRate: number
  }>> {
    try {
      // Try database first
      try {
        const where: any = {}
        if (userId) where.assigneeId = userId

        const [totalAssignments, statusCounts, priorityCounts, overdueTasks] = await Promise.all([
          (this.db as any).taskAssignment.count({ where }),
          (this.db as any).taskAssignment.groupBy({
            by: ['status'],
            where,
            _count: { status: true }
          }),
          (this.db as any).taskAssignment.groupBy({
            by: ['task', 'priority'],
            where,
            _count: { id: true }
          }),
          (this.db as any).taskAssignment.count({
            where: {
              ...where,
              dueDate: { lt: new Date() },
              status: { not: 'completed' }
            }
          })
        ])

        const assignmentsByStatus = statusCounts.reduce((acc: any, item: any) => {
          acc[item.status] = item._count.status
          return acc
        }, {})

        const assignmentsByPriority = priorityCounts.reduce((acc: any, item: any) => {
          acc[item.task.priority] = item._count.id
          return acc
        }, {})

        const completedCount = assignmentsByStatus.completed || 0
        const completionRate = totalAssignments > 0 ? (completedCount / totalAssignments) * 100 : 0

        return createSuccessResult({
          totalAssignments,
          assignmentsByStatus,
          assignmentsByPriority,
          overdueTasks,
          completionRate
        })
      } catch (dbError) {
        // Fallback to temp storage
        const stats = await tempStorage.getTaskAssignmentStats(userId)
        return createSuccessResult(stats)
      }
    } catch (error) {
      console.error('Error in TaskAssignmentRepository.getAssignmentStats:', error)
      return createErrorResult('Failed to get assignment statistics', 'STATS_ERROR', 500)
    }
  }

  /**
   * Transform temp storage assignment to repository format
   */
  private transformTempAssignment(tempAssignment: any): TaskAssignmentWithRelations {
    return {
      id: tempAssignment.id,
      taskId: tempAssignment.taskId,
      assigneeId: tempAssignment.assigneeId,
      assignedBy: tempAssignment.assignedBy,
      status: tempAssignment.status || 'pending',
      notes: tempAssignment.notes || null,
      dueDate: tempAssignment.dueDate ? new Date(tempAssignment.dueDate) : null,
      assignedAt: new Date(tempAssignment.assignedAt),
      updatedAt: new Date(tempAssignment.updatedAt),
      task: {
        id: tempAssignment.task?.id || tempAssignment.taskId,
        title: tempAssignment.task?.title || 'Unknown Task',
        description: tempAssignment.task?.description || null,
        category: tempAssignment.task?.category || null,
        priority: tempAssignment.task?.priority || 'medium',
        timeline: tempAssignment.task?.timeline || null,
        order: tempAssignment.task?.order || null,
        tags: tempAssignment.task?.tags || []
      },
      assignee: {
        id: tempAssignment.assignee?.id || tempAssignment.assigneeId,
        email: tempAssignment.assignee?.email || 'unknown@example.com',
        role: tempAssignment.assignee?.role || 'couple',
        isActive: tempAssignment.assignee?.isActive ?? true
      },
      assigner: {
        id: tempAssignment.assigner?.id || tempAssignment.assignedBy,
        email: tempAssignment.assigner?.email || 'unknown@example.com',
        role: tempAssignment.assigner?.role || 'couple',
        isActive: tempAssignment.assigner?.isActive ?? true
      }
    }
  }
}