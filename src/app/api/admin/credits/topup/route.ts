import { requireSuperAdmin } from '@/lib/auth/admin'
import { createErrorResponse, createSuccessResponse } from '@/lib/api/response'
import { z } from 'zod'
import { prisma } from '@/lib/db/prisma'
import { CreditRepository } from '@/features/messaging/repo/credit.repository'

const Body = z.object({
  email: z.string().email().optional(),
  userId: z.string().uuid().optional(),
  amount: z.number().int().positive(),
}).refine(v => !!v.email || !!v.userId, { message: 'email or userId is required' })

export const POST = requireSuperAdmin(async (_req, ctx) => {
  try {
    const json = await _req.json().catch(() => ({}))
    const parsed = Body.safeParse(json)
    if (!parsed.success) return createErrorResponse('Invalid payload', 400, 'VALIDATION_ERROR', parsed.error.issues)
    const { email, userId, amount } = parsed.data
    let targetUserId = userId || ''
    if (email && !targetUserId) {
      const u = await prisma.user.findUnique({ where: { email }, select: { id: true } })
      if (!u) return createErrorResponse('User not found', 404, 'NOT_FOUND')
      targetUserId = u.id
    }
    const repo = new CreditRepository()
    const result = await repo.addCredits(targetUserId, amount)
    if (!result.success) return createErrorResponse(result.error?.message || 'Failed to add credits', result.error?.statusCode || 500, result.error?.code)
    return createSuccessResponse({ userId: targetUserId, credits: result.data!.credits }, 201)
  } catch (e: any) {
    return createErrorResponse(e?.message || 'Internal error')
  }
})

