import { NextRequest, NextResponse } from 'next/server'
import { TaskAssignmentHandler } from '@/features/tasks/api/task-assignment.handler'
import { requireOnboarding, AuthenticatedRequest } from '@/lib/auth/middleware'

const taskAssignmentHandler = new TaskAssignmentHandler()

/**
 * POST /api/tasks/assignments/bulk
 * Bulk assign tasks to a user
 */
export async function POST(request: NextRequest) {
  return requireOnboarding(async (authenticatedRequest: AuthenticatedRequest) => {
    const user = authenticatedRequest.user!
    return taskAssignmentHandler.bulkAssignTasks(authenticatedRequest, user.id, user.role)
  })
}