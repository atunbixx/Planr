import { BaseRepository, RepositoryResult, createSuccessResult, createErrorResult } from '@/lib/repositories/BaseRepository'
import { tempStorage } from '@/lib/db/temp-storage'
import { CreateTaskInput, UpdateTaskInput, TaskFilterInput } from '../dto/task.dto'

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

// Transform temp storage task to repository task format
function transformTempTask(tempTask: any): Task {
  return {
    id: tempTask.id,
    userId: tempTask.userId,
    title: tempTask.title,
    description: tempTask.description || null,
    category: tempTask.category || null,
    priority: tempTask.priority,
    status: tempTask.status,
    dueDate: tempTask.dueDate ? new Date(tempTask.dueDate) : null,
    completedAt: tempTask.completedAt ? new Date(tempTask.completedAt) : null,
    assignedTo: tempTask.assignedTo || null,
    isTemplate: tempTask.isTemplate || false,
    templateId: tempTask.templateId || null,
    timeline: tempTask.timeline || null,
    order: tempTask.order || null,
    tags: tempTask.tags || [],
    notes: tempTask.notes || null,
    createdAt: new Date(tempTask.createdAt),
    updatedAt: new Date(tempTask.updatedAt)
  }
}

export class TaskRepository extends BaseRepository {
  
  /**
   * Find all tasks for a user with optional filtering
   */
  async findByUserId(
    userId: string, 
    filters?: TaskFilterInput
  ): Promise<RepositoryResult<Task[]>> {
    try {
      const { limit = 50, offset = 0, status, priority, category, assignedTo, timeline, includeCompleted = true } = filters || {}
      
      // Try database first (when migration is applied)
      try {
        const where: any = { userId, isTemplate: false }
        
        if (status) where.status = status
        if (priority) where.priority = priority
        if (category) where.category = category
        if (assignedTo) where.assignedTo = assignedTo
        if (timeline) where.timeline = timeline
        
        // Filter out completed tasks if requested
        if (!includeCompleted) {
          where.status = { not: 'completed' }
        }

        const tasks = await (this.db as any).task.findMany({
          where,
          orderBy: [
            { status: 'asc' },
            { priority: 'desc' },
            { dueDate: 'asc' },
            { order: 'asc' },
            { createdAt: 'desc' }
          ],
          take: limit,
          skip: offset
        })

        return createSuccessResult(tasks)
      } catch (dbError) {
        // Fallback to temp storage
        console.warn('Database not available, using temp storage:', dbError)
        const tempTasks = await tempStorage.findTasksByUserId(userId)
        const filteredTasks = tempTasks.filter(task => {
          if (status && task.status !== status) return false
          if (priority && task.priority !== priority) return false
          if (category && task.category !== category) return false
          if (assignedTo && task.assignedTo !== assignedTo) return false
          if (timeline && task.timeline !== timeline) return false
          if (!includeCompleted && task.status === 'completed') return false
          return true
        }).slice(offset, offset + limit)

        return createSuccessResult(filteredTasks.map(transformTempTask))
      }
    } catch (error) {
      console.error('Error in TaskRepository.findByUserId:', error)
      return createErrorResult('Failed to fetch tasks', 'FETCH_ERROR', 500)
    }
  }

  /**
   * Find task by ID
   */
  async findById(taskId: string): Promise<RepositoryResult<Task | null>> {
    try {
      // Try database first
      try {
        const task = await (this.db as any).task.findUnique({
          where: { id: taskId }
        })
        return createSuccessResult(task)
      } catch (dbError) {
        // Fallback to temp storage
        const tempTask = await tempStorage.findTaskById(taskId)
        return createSuccessResult(tempTask ? transformTempTask(tempTask) : null)
      }
    } catch (error) {
      console.error('Error in TaskRepository.findById:', error)
      return createErrorResult('Failed to fetch task', 'FETCH_ERROR', 500)
    }
  }

  /**
   * Create a new task
   */
  async create(userId: string, data: CreateTaskInput): Promise<RepositoryResult<Task>> {
    try {
      const taskData = {
        userId,
        title: data.title,
        description: data.description || null,
        category: data.category || null,
        priority: data.priority,
        status: data.status,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        assignedTo: data.assignedTo || null,
        timeline: data.timeline || null,
        order: data.order || null,
        tags: data.tags,
        notes: data.notes || null,
        isTemplate: false
      }

      // Try database first
      try {
        const task = await (this.db as any).task.create({
          data: taskData
        })
        return createSuccessResult(task)
      } catch (dbError) {
        // Fallback to temp storage
        const tempTask = await tempStorage.createTask({
          userId,
          title: data.title,
          description: data.description,
          category: data.category,
          priority: data.priority,
          status: data.status,
          dueDate: data.dueDate,
          assignedTo: data.assignedTo,
          timeline: data.timeline,
          order: data.order,
          tags: data.tags,
          notes: data.notes
        })
        return createSuccessResult(transformTempTask(tempTask))
      }
    } catch (error) {
      console.error('Error in TaskRepository.create:', error)
      return createErrorResult('Failed to create task', 'CREATE_ERROR', 500)
    }
  }

  /**
   * Update a task
   */
  async update(taskId: string, data: UpdateTaskInput): Promise<RepositoryResult<Task>> {
    try {
      const updateData: any = {}
      
      if (data.title !== undefined) updateData.title = data.title
      if (data.description !== undefined) updateData.description = data.description
      if (data.category !== undefined) updateData.category = data.category
      if (data.priority !== undefined) updateData.priority = data.priority
      if (data.status !== undefined) {
        updateData.status = data.status
        if (data.status === 'completed' && !data.completedAt) {
          updateData.completedAt = new Date()
        } else if (data.status !== 'completed') {
          updateData.completedAt = null
        }
      }
      if (data.dueDate !== undefined) updateData.dueDate = data.dueDate ? new Date(data.dueDate) : null
      if (data.completedAt !== undefined) updateData.completedAt = data.completedAt ? new Date(data.completedAt) : null
      if (data.assignedTo !== undefined) updateData.assignedTo = data.assignedTo
      if (data.timeline !== undefined) updateData.timeline = data.timeline
      if (data.order !== undefined) updateData.order = data.order
      if (data.tags !== undefined) updateData.tags = data.tags
      if (data.notes !== undefined) updateData.notes = data.notes
      
      updateData.updatedAt = new Date()

      // Try database first
      try {
        const task = await (this.db as any).task.update({
          where: { id: taskId },
          data: updateData
        })
        return createSuccessResult(task)
      } catch (dbError) {
        // Fallback to temp storage
        const tempTask = await tempStorage.updateTask(taskId, data)
        return createSuccessResult(tempTask ? transformTempTask(tempTask) : null)
      }
    } catch (error) {
      console.error('Error in TaskRepository.update:', error)
      return createErrorResult('Failed to update task', 'UPDATE_ERROR', 500)
    }
  }

  /**
   * Delete a task
   */
  async delete(taskId: string): Promise<RepositoryResult<boolean>> {
    try {
      // Try database first
      try {
        await (this.db as any).task.delete({
          where: { id: taskId }
        })
        return createSuccessResult(true)
      } catch (dbError) {
        // Fallback to temp storage
        const result = await tempStorage.deleteTask(taskId)
        return createSuccessResult(result)
      }
    } catch (error) {
      console.error('Error in TaskRepository.delete:', error)
      return createErrorResult('Failed to delete task', 'DELETE_ERROR', 500)
    }
  }

  /**
   * Get task statistics for a user
   */
  async getStats(userId: string): Promise<RepositoryResult<{
    total: number
    pending: number
    in_progress: number
    completed: number
    overdue: number
    completedThisWeek: number
  }>> {
    try {
      const now = new Date()
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

      // Try database first
      try {
        const [total, pending, inProgress, completed, overdue, completedThisWeek] = await Promise.all([
          (this.db as any).task.count({ where: { userId, isTemplate: false } }),
          (this.db as any).task.count({ where: { userId, status: 'pending', isTemplate: false } }),
          (this.db as any).task.count({ where: { userId, status: 'in_progress', isTemplate: false } }),
          (this.db as any).task.count({ where: { userId, status: 'completed', isTemplate: false } }),
          (this.db as any).task.count({ 
            where: { 
              userId, 
              isTemplate: false,
              status: { not: 'completed' },
              dueDate: { lt: now }
            } 
          }),
          (this.db as any).task.count({ 
            where: { 
              userId, 
              status: 'completed',
              isTemplate: false,
              completedAt: { gte: weekAgo }
            } 
          })
        ])

        return createSuccessResult({
          total,
          pending,
          in_progress: inProgress,
          completed,
          overdue,
          completedThisWeek
        })
      } catch (dbError) {
        // Fallback to temp storage
        const tasks = await tempStorage.findTasksByUserId(userId)
        
        const stats = {
          total: tasks.length,
          pending: tasks.filter(t => t.status === 'pending').length,
          in_progress: tasks.filter(t => t.status === 'in_progress').length,
          completed: tasks.filter(t => t.status === 'completed').length,
          overdue: tasks.filter(t => t.status !== 'completed' && t.dueDate && new Date(t.dueDate) < now).length,
          completedThisWeek: tasks.filter(t => t.status === 'completed' && t.completedAt && new Date(t.completedAt) >= weekAgo).length
        }
        
        return createSuccessResult(stats)
      }
    } catch (error) {
      console.error('Error in TaskRepository.getStats:', error)
      return createErrorResult('Failed to get task statistics', 'STATS_ERROR', 500)
    }
  }

  /**
   * Create template tasks for a user based on timeline
   */
  async createFromTemplate(userId: string, timeline: string, templateTasks: any[]): Promise<RepositoryResult<Task[]>> {
    try {
      // Try database first
      try {
        const tasks = await Promise.all(
          templateTasks.map(template => 
            (this.db as any).task.create({
              data: {
                userId,
                title: template.title,
                description: template.description || null,
                category: template.category || null,
                priority: template.priority,
                status: 'pending',
                timeline,
                order: template.order || null,
                tags: template.tags || [],
                isTemplate: false,
                templateId: `template_${timeline}_${template.order || 0}`
              }
            })
          )
        )
        return createSuccessResult(tasks)
      } catch (dbError) {
        // Fallback to temp storage
        const tasks = await Promise.all(
          templateTasks.map(template => 
            tempStorage.createTask({
              userId,
              title: template.title,
              description: template.description,
              category: template.category,
              priority: template.priority,
              status: 'pending',
              timeline,
              order: template.order,
              tags: template.tags || []
            })
          )
        )
        return createSuccessResult(tasks.map(transformTempTask))
      }
    } catch (error) {
      console.error('Error in TaskRepository.createFromTemplate:', error)
      return createErrorResult('Failed to create tasks from template', 'TEMPLATE_ERROR', 500)
    }
  }
}