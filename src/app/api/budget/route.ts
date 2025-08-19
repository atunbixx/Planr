import { requireOnboarding, AuthenticatedRequest } from '@/lib/auth/middleware'
import { BudgetHandler } from '@/features/budget/api/budget.handler'

// GET /api/budget - List all budget items for the authenticated user
const handler = new BudgetHandler()

async function getHandler(request: AuthenticatedRequest) {
  return handler.list(request as any, request.user!.id)
}

async function postHandler(request: AuthenticatedRequest) {
  return handler.create(request as any, request.user!.id)
}

export const GET = requireOnboarding(getHandler)
export const POST = requireOnboarding(postHandler)
