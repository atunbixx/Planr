import { NextRequest, NextResponse } from 'next/server'
import { TaskAssignmentHandler } from '@/features/tasks/api/task-assignment.handler'
import { requireOnboarding, AuthenticatedRequest } from '@/lib/auth/middleware'

const taskAssignmentHandler = new TaskAssignmentHandler()

/**
 * GET /api/tasks/assignments/stats
 * Get assignment statistics
 */
export async function GET(request: NextRequest) {
  return requireOnboarding(async (authenticatedRequest: AuthenticatedRequest) => {
    const user = authenticatedRequest.user!
    return taskAssignmentHandler.getAssignmentStats(authenticatedRequest, user.id, user.role)
  })
}