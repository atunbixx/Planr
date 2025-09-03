import { requireOnboarding, AuthenticatedRequest } from '@/lib/auth/middleware'
import { NotificationRepository } from '@/features/notifications/repo/notification.repository'

export const runtime = 'nodejs'

async function getHandler(_req: AuthenticatedRequest) {
  const repo = new NotificationRepository()
  let timer: any

  const stream = new ReadableStream({
    start: async (controller) => {
      const encoder = new TextEncoder()
      // Immediately send a ping and initial unread count
      const send = (data: any) => controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))

      const userId = (_req as any).user!.id as string
      let lastUnread = -1

      const tick = async () => {
        try {
          const { unread } = await repo.list(userId, { limit: 1, offset: 0, unreadOnly: true })
          if (unread !== lastUnread) {
            lastUnread = unread
            send({ unread })
          } else {
            // keep-alive ping
            send({ ping: true })
          }
        } catch {
          // noop
        }
      }

      await tick()
      timer = setInterval(tick, 5000)
    },
    cancel: () => { if (timer) clearInterval(timer) }
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    }
  })
}

export const GET = requireOnboarding(getHandler)

