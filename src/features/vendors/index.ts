/**
 * Vendors Feature Module - Complete feature barrel export
 */

// DTOs
export * from './dto'

// Repositories
export * from './repo'

// Services
export * from './service'

// API Handlers
export * from './api'

// Re-export for convenience
export { VendorsApiHandler } from './api/vendors.handler'
export { VendorService } from './service/vendor.service'
export { VendorRepository, VendorCategoryRepository } from './repo'