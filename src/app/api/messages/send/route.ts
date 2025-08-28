import { requireAuth, AuthenticatedRequest } from '@/lib/auth/middleware'
import { createErrorResponse, createSuccessResponse } from '@/lib/api/response'
import { prisma } from '@/lib/db/prisma'
import { z } from 'zod'
import { CreditRepository } from '@/features/messaging/repo/credit.repository'
import { MessagingService } from '@/features/messaging/service/messaging.service'

const BodySchema = z.object({
  channel: z.enum(['email','sms','whatsapp']),
  to: z.string().min(1),
  subject: z.string().optional(),
  content: z.string().min(1),
  templateId: z.string().optional(),
  country: z.string().length(2).optional(),
})

export const POST = requireAuth(async (req: AuthenticatedRequest) => {
  try {
    const parsed = BodySchema.safeParse(await req.json().catch(() => ({})))
    if (!parsed.success) {
      return createErrorResponse('Invalid payload', 400, 'VALIDATION_ERROR', parsed.error.issues)
    }
    const body = parsed.data
    const credits = new CreditRepository()
    const svc = new MessagingService(credits)
    const result = await svc.sendMessage({
      userId: req.user!.id,
      to: body.to,
      channel: body.channel,
      country: body.country as any,
      subject: body.subject,
      content: body.content,
      templateId: body.templateId,
    })
    if (!result.success) return createErrorResponse(result.error?.message || 'Failed to send', result.error?.statusCode || 500, result.error?.code)

    // Best-effort: persist message record (ignore errors)
    try {
      const r: any = result.data
      await prisma.message.create({
        data: {
          userId: req.user!.id,
          channel: body.channel,
          recipient: body.to,
          subject: body.subject || null,
          content: body.content || null,
          provider: r.provider || 'auto',
          providerMessageId: r.providerMessageId || null,
          status: (r.status || 'sent') as any,
          cost: typeof r.cost === 'number' ? r.cost : 0,
          currency: r.currency || 'credits',
          deliveredAt: r.status === 'delivered' ? (r.timestamp ? new Date(r.timestamp) : new Date()) : null,
          metadata: r.metadata || undefined,
        }
      })
    } catch {}

    return createSuccessResponse(result.data, 201)
  } catch (e: any) {
    return createErrorResponse(e?.message || 'Internal error')
  }
})
