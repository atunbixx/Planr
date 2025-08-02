// Export all API services
export { couplesApi } from './couples'
export { vendorsApi } from './vendors'
export { budgetApi } from './budget'
export { photosApi } from './photos'
export { messagesApi } from './messages'

// Re-export types
export type { CoupleWithDetails } from './couples'
export type { 
  VendorWithDetails, 
  VendorFilters, 
  VendorComparison 
} from './vendors'
export type { 
  BudgetOverview, 
  BudgetCategoryDetail, 
  BudgetItemDetail,
  BudgetAnalytics,
  BudgetFilters
} from './budget'
export type {
  Photo,
  Album,
  PhotoFilters,
  PhotoUploadOptions,
  PhotoAnalytics
} from './photos'
export type {
  Message,
  Conversation,
  Participant,
  MessageFilters,
  ConversationFilters,
  SendMessageData,
  TypingIndicator
} from './messages'