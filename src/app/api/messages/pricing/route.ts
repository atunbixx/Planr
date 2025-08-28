import { NextRequest } from 'next/server'
import { createErrorResponse, createSuccessResponse } from '@/lib/api/response'
import { PricebookService } from '@/features/messaging/service/pricebook.service'

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const channel = url.searchParams.get('channel') as any
    const country = url.searchParams.get('country') || undefined
    const svc = new PricebookService()

    if (!channel) {
      // Return full pricebook list when no channel specified
      const channels = svc.getAvailableChannels()
      const rows = channels.flatMap(ch => {
        const pc = svc.getChannelPricing(ch)
        if (!pc) return []
        const list = [{ channel: ch, country: 'default', unitCost: pc.default, currency: svc.getMetadata().currency }]
        for (const [cc, cost] of Object.entries(pc.countries)) list.push({ channel: ch, country: cc, unitCost: cost, currency: svc.getMetadata().currency })
        return list
      })
      return createSuccessResponse(rows)
    }

    const valid = svc.validateChannelCountry(channel, country)
    if (!valid.valid) return createErrorResponse(valid.error || 'Invalid parameters', 400, 'VALIDATION_ERROR')
    const cost = svc.getCost(channel, country)
    return createSuccessResponse({ cost, currency: svc.getMetadata().currency, provider: 'auto', country, channel })
  } catch (e: any) {
    return createErrorResponse(e?.message || 'Internal error')
  }
}

