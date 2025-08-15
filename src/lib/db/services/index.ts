// Export all services
export { BaseService } from './base.service'
export { CoupleService } from './couple.service'
export { PhotoService } from './photo.service'

// Create singleton instances
import { CoupleService } from './couple.service'
import { PhotoService } from './photo.service'

export const coupleService = new CoupleService()
export const photoService = new PhotoService()