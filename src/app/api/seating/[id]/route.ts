import { requireOnboarding, AuthenticatedRequest } from '@/lib/auth/middleware'
import { SeatingHandler } from '@/features/seating/api/seating.handler'

const seatingHandler = new SeatingHandler()

async function getHandler(request: AuthenticatedRequest) {
  const url = new URL(request.url)
  const tableId = url.pathname.split('/').pop()!
  return await seatingHandler.getTableById(request, tableId)
}

async function patchHandler(request: AuthenticatedRequest) {
  const url = new URL(request.url)
  const tableId = url.pathname.split('/').pop()!
  return await seatingHandler.updateTable(request, tableId)
}

async function deleteHandler(request: AuthenticatedRequest) {
  const url = new URL(request.url)
  const tableId = url.pathname.split('/').pop()!
  return await seatingHandler.deleteTable(request, tableId)
}

export const GET = requireOnboarding(getHandler)
export const PATCH = requireOnboarding(patchHandler)
export const DELETE = requireOnboarding(deleteHandler)

