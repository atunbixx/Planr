import { NextRequest, NextResponse } from 'next/server'
import { TaskAssignmentHandler } from '@/features/tasks/api/task-assignment.handler'
import { requireOnboarding, AuthenticatedRequest } from '@/lib/auth/middleware'

const taskAssignmentHandler = new TaskAssignmentHandler()

/**
 * GET /api/tasks/assignments/[taskId]/[assigneeId]
 * Get a specific task assignment
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { taskId: string; assigneeId: string } }
) {
  return requireOnboarding(async (authenticatedRequest: AuthenticatedRequest) => {
    const user = authenticatedRequest.user!
    return taskAssignmentHandler.getAssignment(
      authenticatedRequest,
      user.id,
      user.role,
      params.taskId,
      params.assigneeId
    )
  })
}

/**
 * PATCH /api/tasks/assignments/[taskId]/[assigneeId]
 * Update a task assignment
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { taskId: string; assigneeId: string } }
) {
  return requireOnboarding(async (authenticatedRequest: AuthenticatedRequest) => {
    const user = authenticatedRequest.user!
    return taskAssignmentHandler.updateAssignment(
      authenticatedRequest,
      user.id,
      user.role,
      params.taskId,
      params.assigneeId
    )
  })
}

/**
 * DELETE /api/tasks/assignments/[taskId]/[assigneeId]
 * Unassign a task from a user
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { taskId: string; assigneeId: string } }
) {
  return requireOnboarding(async (authenticatedRequest: AuthenticatedRequest) => {
    const user = authenticatedRequest.user!
    return taskAssignmentHandler.unassignTask(
      authenticatedRequest,
      user.id,
      user.role,
      params.taskId,
      params.assigneeId
    )
  })
}