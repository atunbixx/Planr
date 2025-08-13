/**
 * Couples Feature Module - Complete feature barrel export
 */

// DTOs
export * from './dto'

// Services
export * from './service'

// API Handlers
export * from './api'

// Re-export for convenience
export { CouplesApiHandler } from './api/couples.handler'
export { CoupleService } from './service/couple.service'