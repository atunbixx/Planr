/**
 * Features Module - Central export for all feature modules
 */

// Feature Modules
export * from './couples'
export * from './vendors'
export * from './guests'
export * from './budget'

// Re-export handlers for easy access
export { CouplesApiHandler } from './couples'
export { VendorsApiHandler } from './vendors'
export { GuestsApiHandler } from './guests'
export { BudgetApiHandler } from './budget'

// Re-export services for easy access
export { CoupleService } from './couples'
export { VendorService } from './vendors'
export { GuestService } from './guests'
export { BudgetService } from './budget'