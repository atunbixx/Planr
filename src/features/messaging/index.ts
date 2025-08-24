// Messaging Service Exports
export { MessagingService } from './service/messaging.service'
export type { 
  SendMessageRequest, 
  MessageSendResult, 
  BulkSendRequest, 
  BulkSendResult 
} from './service/messaging.service'

// Pricebook Service Exports
export { PricebookService } from './service/pricebook.service'
export type { 
  PricingInfo, 
  ProviderInfo, 
  TemplateInfo, 
  PricebookLimits, 
  MessageChannel, 
  CountryCode 
} from './service/pricebook.service'

// Adapter Exports
export { 
  BaseMessageAdapter, 
  AdapterFactory, 
  MemoryRateLimiter 
} from './adapters/base.adapter'
export type { 
  MessageAdapter, 
  MessageRequest, 
  MessageResult, 
  AdapterInfo, 
  DeliveryStatus, 
  RateLimiter 
} from './adapters/base.adapter'

export { ResendAdapter } from './adapters/resend.adapter'
export { TwilioAdapter } from './adapters/twilio.adapter'
export { SESAdapter } from './adapters/ses.adapter'
export { AdapterRegistry, adapterRegistry } from './adapters/registry'

// Repository Exports
export { CreditRepository } from './repo/credit.repository'
export type { 
  CreditBalance, 
  CreditTransaction, 
  CreditTransactionType 
} from './repo/credit.repository'