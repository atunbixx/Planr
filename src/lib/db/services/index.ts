// Export all services
export { BaseService } from './base.service'
export { CoupleService } from './couple.service'
export { VendorService } from './vendor.service'
export { PhotoService } from './photo.service'
export { BudgetService } from './budget.service'
export { GuestService } from './guest.service'

// Create singleton instances
import { CoupleService } from './couple.service'
import { VendorService } from './vendor.service'
import { PhotoService } from './photo.service'
import { BudgetService } from './budget.service'
import { GuestService } from './guest.service'

export const coupleService = new CoupleService()
export const vendorService = new VendorService()
export const photoService = new PhotoService()
export const budgetService = new BudgetService()
export const guestService = new GuestService()