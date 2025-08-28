import { api } from '@/lib/api/fetcher'

type Envelope<T> = { success: boolean; data?: T; error?: { message: string } }

export type MessageItem = {
  id: string
  userId: string
  channel: string
  recipient: string
  subject?: string | null
  content?: string | null
  provider?: string | null
  providerMessageId?: string | null
  status: 'sent'|'queued'|'failed'|'delivered'
  cost: number
  currency: string
  createdAt: string
  deliveredAt?: string | null
}

export const MessagesHistoryClient = {
  async list(params?: { limit?: number; offset?: number; status?: string; channel?: string }): Promise<{ items: MessageItem[]; total: number; limit: number; offset: number }>{
    const qs = new URLSearchParams()
    if (params?.limit) qs.set('limit', String(params.limit))
    if (params?.offset) qs.set('offset', String(params.offset))
    if (params?.status) qs.set('status', params.status)
    if (params?.channel) qs.set('channel', params.channel)
    const env = await api.get<Envelope<any>>(`/api/messages/history${qs.toString() ? `?${qs.toString()}` : ''}`)
    if (!env.success) throw new Error(env.error?.message || 'Failed to load message history')
    return env.data
  }
}

