import { NextRequest, NextResponse } from 'next/server'
import { TaskAssignmentHandler } from '@/features/tasks/api/task-assignment.handler'
import { requireOnboarding, AuthenticatedRequest } from '@/lib/auth/middleware'

const taskAssignmentHandler = new TaskAssignmentHandler()

/**
 * GET /api/tasks/assignments
 * Get task assignments with filtering
 */
export async function GET(request: NextRequest) {
  return requireOnboarding(async (authenticatedRequest: AuthenticatedRequest) => {
    const user = authenticatedRequest.user!
    return taskAssignmentHandler.getAssignments(authenticatedRequest, user.id, user.role)
  })
}

/**
 * POST /api/tasks/assignments
 * Assign a task to a user
 */
export async function POST(request: NextRequest) {
  return requireOnboarding(async (authenticatedRequest: AuthenticatedRequest) => {
    const user = authenticatedRequest.user!
    return taskAssignmentHandler.assignTask(authenticatedRequest, user.id, user.role)
  })
}