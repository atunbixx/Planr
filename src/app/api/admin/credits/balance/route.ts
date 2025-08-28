import { requireSuperAdmin } from '@/lib/auth/admin'
import { createErrorResponse, createSuccessResponse } from '@/lib/api/response'
import { prisma } from '@/lib/db/prisma'
import { CreditRepository } from '@/features/messaging/repo/credit.repository'

export const GET = requireSuperAdmin(async (req) => {
  try {
    const url = new URL(req.url)
    const email = url.searchParams.get('email')
    const userId = url.searchParams.get('userId')
    if (!email && !userId) return createErrorResponse('email or userId is required', 400, 'VALIDATION_ERROR')
    let id = userId || ''
    if (email && !id) {
      const u = await prisma.user.findUnique({ where: { email }, select: { id: true } })
      if (!u) return createErrorResponse('User not found', 404, 'NOT_FOUND')
      id = u.id
    }
    const repo = new CreditRepository()
    const result = await repo.getBalanceRecord(id)
    if (!result.success) return createErrorResponse(result.error?.message || 'Failed to fetch balance', result.error?.statusCode || 500, result.error?.code)
    return createSuccessResponse(result.data || { userId: id, credits: 0 })
  } catch (e: any) {
    return createErrorResponse(e?.message || 'Internal error')
  }
})

