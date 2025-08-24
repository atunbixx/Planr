import { NextRequest } from 'next/server'
import { requireOnboarding, AuthenticatedRequest } from '@/lib/auth/middleware'
import { TaskHandler } from '@/features/tasks/api/task.handler'

const taskHandler = new TaskHandler()

async function getHandler(request: AuthenticatedRequest) {
  const url = new URL(request.url)
  const taskId = url.pathname.split('/').pop()!
  return await taskHandler.getById(request, taskId)
}

async function patchHandler(request: AuthenticatedRequest) {
  const url = new URL(request.url)
  const taskId = url.pathname.split('/').pop()!
  return await taskHandler.update(request, taskId)
}

async function deleteHandler(request: AuthenticatedRequest) {
  const url = new URL(request.url)
  const taskId = url.pathname.split('/').pop()!
  return await taskHandler.delete(request, taskId)
}

export const GET = requireOnboarding(getHandler)
export const PATCH = requireOnboarding(patchHandler)
export const DELETE = requireOnboarding(deleteHandler)