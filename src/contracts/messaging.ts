import { z } from 'zod'

export const SendMessageDto = z.object({
  channel: z.enum(['email','sms','whatsapp']),
  to: z.string(),
  subject: z.string().optional(),
  body: z.string(),
  templateId: z.string().optional(),
  country: z.string().length(2).optional(),
})

export const MessagingResultDto = z.object({
  accepted: z.number(),
  failed: z.number(),
  provider: z.string(),
  costCredits: z.number(),
  ids: z.array(z.string()),
})

export const PricebookItemDto = z.object({
  channel: z.enum(['email','sms','whatsapp']),
  country: z.string(),
  unitCost: z.number(),
  currency: z.string(),
})

export const PricebookResponseDto = z.array(PricebookItemDto)

export type SendMessage = z.infer<typeof SendMessageDto>
export type MessagingResult = z.infer<typeof MessagingResultDto>
export type PricebookItem = z.infer<typeof PricebookItemDto>
