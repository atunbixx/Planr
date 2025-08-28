import { requireAuth, AuthenticatedRequest } from '@/lib/auth/middleware'
import { createErrorResponse, createSuccessResponse } from '@/lib/api/response'
import { z } from 'zod'
import { CreditRepository } from '@/features/messaging/repo/credit.repository'
import { prisma } from '@/lib/db/prisma'
import { MessagingService } from '@/features/messaging/service/messaging.service'

const MessageSchema = z.object({
  channel: z.enum(['email','sms','whatsapp']),
  to: z.string().min(1),
  subject: z.string().optional(),
  content: z.string().min(1),
  templateId: z.string().optional(),
  country: z.string().length(2).optional(),
})

const BodySchema = z.object({
  messages: z.array(MessageSchema).min(1).max(100)
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
    const mapped = body.messages.map(m => ({ userId: req.user!.id, to: m.to, channel: m.channel, country: m.country as any, subject: m.subject, content: m.content, templateId: m.templateId }))
    const result = await svc.sendBulkMessages({ userId: req.user!.id, messages: mapped as any })
    if (!result.success) return createErrorResponse(result.error?.message || 'Failed to send bulk', result.error?.statusCode || 500, result.error?.code)
    // Best-effort persist each result
    try {
      const now = new Date()
      for (const r of (result.data?.results || []) as any[]) {
        try {
          await prisma.message.create({
            data: {
              userId: req.user!.id,
              channel: r.channel || 'email',
              recipient: (r.metadata?.to || '') as string,
              subject: (r.metadata?.subject || null) as any,
              content: (r.metadata?.content || null) as any,
              provider: r.provider || 'auto',
              providerMessageId: r.providerMessageId || null,
              status: (r.status || 'sent') as any,
              cost: typeof r.cost === 'number' ? r.cost : 0,
              currency: r.currency || 'credits',
              deliveredAt: r.status === 'delivered' ? (r.timestamp ? new Date(r.timestamp) : now) : null,
              metadata: r.metadata || undefined,
            }
          })
        } catch {}
      }
    } catch {}
    return createSuccessResponse(result.data, 201)
  } catch (e: any) {
    return createErrorResponse(e?.message || 'Internal error')
  }
})
