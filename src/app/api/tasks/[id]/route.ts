import { NextRequest } from 'next/server'
import { requireOnboarding, AuthenticatedRequest } from '@/lib/auth/middleware'
import { TaskHandler } from '@/features/tasks/api/task.handler'

const taskHandler = new TaskHandler()

interface RouteParams {
  params: { id: string }
}

async function getHandler(request: AuthenticatedRequest, { params }: RouteParams) {
  return await taskHandler.getById(request, params.id)
}

async function patchHandler(request: AuthenticatedRequest, { params }: RouteParams) {
  return await taskHandler.update(request, params.id)
}

async function deleteHandler(request: AuthenticatedRequest, { params }: RouteParams) {
  return await taskHandler.delete(request, params.id)
}

export const GET = requireOnboarding(getHandler)
export const PATCH = requireOnboarding(patchHandler)
export const DELETE = requireOnboarding(deleteHandler)