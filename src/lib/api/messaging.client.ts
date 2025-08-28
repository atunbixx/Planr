import { api } from '@/lib/api/fetcher'
import { SendMessageDto, PricebookResponseDto, type SendMessage } from '@/contracts/messaging'

type Envelope<T> = { success: boolean; data?: T; error?: { message: string } }

export const MessagingClient = {
  async send(payload: SendMessage) {
    const result = await api.post<Envelope<any>>('/api/messages/send', {
      channel: payload.channel,
      to: payload.to,
      subject: payload.subject,
      content: payload.body,
      templateId: payload.templateId,
      country: payload.country,
    })
    if (!result.success) throw new Error(result.error?.message || 'Failed to send message')
    return result.data
  },
  async getPricing(channel: 'email'|'sms'|'whatsapp', country?: string) {
    const qs = new URLSearchParams()
    qs.set('channel', channel)
    if (country) qs.set('country', country)
    const result = await api.get<Envelope<any>>(`/api/messages/pricing?${qs.toString()}`)
    if (!result.success) throw new Error(result.error?.message || 'Failed to get pricing')
    return result.data
  },
  async getPricebook() {
    const result = await api.get<Envelope<any>>('/api/messages/pricing')
    if (!result.success) throw new Error(result.error?.message || 'Failed to load pricebook')
    const parsed = PricebookResponseDto.safeParse(result.data)
    if (!parsed.success) throw new Error('Invalid pricebook response')
    return parsed.data
  }
}

