/**
 * Enhanced Field Transformation Layer
 * Provides automatic snake_case <-> camelCase conversion for API boundaries
 * 
 * @deprecated This file will be replaced by the new casing utilities in @/lib/utils/casing.ts
 * The new utilities provide better type safety and automatic field mapping detection.
 * Use this for legacy compatibility during the migration period.
 */

// Model-specific field mappings (database field -> API field)
export const fieldMappings = {
  Guest: {
    couple_id: 'coupleId',
    first_name: 'firstName', 
    last_name: 'lastName',
    dietary_restrictions: 'dietaryRestrictions',
    plus_one_allowed: 'plusOneAllowed',
    plus_one_name: 'plusOneName',
    table_number: 'tableNumber',
    rsvp_status: 'rsvpStatus',
    attending_count: 'attendingCount',
    invitation_sent_at: 'invitationSentAt',
    rsvp_deadline: 'rsvpDeadline',
    rsvp_responded_at: 'rsvpRespondedAt',
    created_at: 'createdAt',
    updated_at: 'updatedAt'
  },
  
  Couple: {
    user_id: 'userId',
    partner1_user_id: 'partner1UserId',
    partner2_user_id: 'partner2UserId', 
    partner1_name: 'partner1Name',
    partner2_name: 'partner2Name',
    partner1_email: 'partner1Email',
    partner2_email: 'partner2Email',
    wedding_date: 'weddingDate',
    venue_name: 'venueName',
    venue_location: 'venueLocation',
    guest_count_estimate: 'guestCountEstimate',
    total_budget: 'totalBudget',
    budget_total: 'budgetTotal', // legacy
    wedding_style: 'weddingStyle',
    onboarding_completed: 'onboardingCompleted',
    created_at: 'createdAt',
    updated_at: 'updatedAt'
  },
  
  Vendor: {
    couple_id: 'coupleId',
    name: 'businessName', // Database uses 'name' but frontend expects 'businessName'
    business_name: 'businessName',
    contact_name: 'contactName',
    category_id: 'categoryId',
    estimated_cost: 'estimatedCost',
    actual_cost: 'actualCost',
    meeting_date: 'meetingDate',
    contract_signed: 'contractSigned',
    created_at: 'createdAt',
    updated_at: 'updatedAt'
  },
  
  BudgetCategory: {
    couple_id: 'coupleId',
    allocated_amount: 'allocatedAmount',
    spent_amount: 'spentAmount',
    percentage_of_total: 'percentageOfTotal',
    industry_average_percentage: 'industryAveragePercentage',
    market_trends: 'marketTrends',
    vendor_insights: 'vendorInsights',
    created_at: 'createdAt',
    updated_at: 'updatedAt'
  },
  
  BudgetExpense: {
    couple_id: 'coupleId',
    category_id: 'categoryId',
    vendor_id: 'vendorId',
    expense_type: 'expenseType',
    payment_status: 'paymentStatus',
    payment_method: 'paymentMethod',
    due_date: 'dueDate',
    paid_date: 'paidDate',
    receipt_url: 'receiptUrl',
    created_at: 'createdAt',
    updated_at: 'updatedAt'
  },
  
  ChecklistItem: {
    couple_id: 'coupleId',
    due_date: 'dueDate',
    is_completed: 'isCompleted',
    completed_at: 'completedAt',
    created_at: 'createdAt',
    updated_at: 'updatedAt'
  },
  
  Photo: {
    couple_id: 'coupleId',
    album_id: 'albumId',
    original_name: 'originalName',
    cloudinary_id: 'cloudinaryId',
    cloudinary_public_id: 'cloudinaryPublicId',
    cloudinary_secure_url: 'cloudinarySecureUrl',
    cloudinary_url: 'cloudinaryUrl',
    file_size: 'fileSize',
    is_favorite: 'isFavorite',
    is_private: 'isPrivate',
    sort_order: 'sortOrder',
    created_at: 'createdAt',
    updated_at: 'updatedAt'
  },
  
  PhotoAlbum: {
    couple_id: 'coupleId',
    cover_photo_id: 'coverPhotoId',
    is_public: 'isPublic',
    sort_order: 'sortOrder',
    created_at: 'createdAt',
    updated_at: 'updatedAt'
  },
  
  TimelineItem: {
    couple_id: 'coupleId',
    start_time: 'startTime',
    end_time: 'endTime',
    vendor_ids: 'vendorIds',
    created_at: 'createdAt',
    updated_at: 'updatedAt'
  },
  
  PaymentSchedule: {
    expense_id: 'expenseId',
    due_date: 'dueDate',
    is_paid: 'isPaid',
    paid_date: 'paidDate',
    payment_method: 'paymentMethod',
    confirmation_number: 'confirmationNumber',
    created_at: 'createdAt',
    updated_at: 'updatedAt'
  },
  
  VendorContract: {
    vendor_id: 'vendorId',
    contract_type: 'contractType',
    contract_value: 'contractValue',
    payment_terms: 'paymentTerms',
    payment_schedule: 'paymentSchedule',
    start_date: 'startDate',
    end_date: 'endDate',
    signed_date: 'signedDate',
    payment_status: 'paymentStatus',
    deposit_amount: 'depositAmount',
    deposit_paid_date: 'depositPaidDate',
    final_payment_date: 'finalPaymentDate',
    file_url: 'fileUrl',
    created_at: 'createdAt',
    updated_at: 'updatedAt'
  }
} as const

export type ModelName = keyof typeof fieldMappings

/**
 * Transform database format to API format (snake_case to camelCase)
 */
export function toApiFormat<T extends Record<string, any>>(
  data: T | T[] | null | undefined,
  model: ModelName
): any {
  if (!data) return data
  
  // Handle arrays
  if (Array.isArray(data)) {
    return data.map(item => toApiFormat(item, model))
  }
  
  const mappings = fieldMappings[model]
  if (!mappings) {
    console.warn(`No field mappings found for model: ${model}`)
    return data
  }
  
  const transformed: any = {}
  
  for (const [key, value] of Object.entries(data)) {
    // Check if this field has a specific mapping
    const apiField = mappings[key as keyof typeof mappings] || key
    
    // Handle nested objects and arrays
    if (value && typeof value === 'object' && !(value instanceof Date)) {
      if (Array.isArray(value)) {
        transformed[apiField] = value
      } else {
        // For nested objects, just copy as-is (could be enhanced)
        transformed[apiField] = value
      }
    } else {
      transformed[apiField] = value
    }
  }
  
  return transformed
}

/**
 * Transform API format to database format (camelCase to snake_case)
 */
export function toDbFormat<T extends Record<string, any>>(
  data: T | null | undefined,
  model: ModelName
): any {
  if (!data) return data
  
  const mappings = fieldMappings[model]
  if (!mappings) {
    console.warn(`No field mappings found for model: ${model}`)
    return data
  }
  
  const transformed: any = {}
  
  // Create reverse mapping (API field -> DB field)
  const reverseMappings: Record<string, string> = {}
  for (const [dbField, apiField] of Object.entries(mappings)) {
    reverseMappings[apiField as string] = dbField
  }
  
  for (const [key, value] of Object.entries(data)) {
    // Check if this field has a specific mapping
    const dbField = reverseMappings[key] || key
    
    // Handle nested objects and arrays
    if (value && typeof value === 'object' && !(value instanceof Date)) {
      if (Array.isArray(value)) {
        transformed[dbField] = value
      } else {
        // For nested objects, just copy as-is
        transformed[dbField] = value
      }
    } else {
      transformed[dbField] = value
    }
  }
  
  return transformed
}

/**
 * Generic snake_case to camelCase conversion
 */
export function snakeToCamel(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
}

/**
 * Generic camelCase to snake_case conversion
 */
export function camelToSnake(str: string): string {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`)
}

/**
 * Transform any object from snake_case to camelCase (generic)
 */
export function transformToCamelCase<T extends Record<string, any>>(obj: T): T {
  if (!obj || typeof obj !== 'object') return obj
  if (obj instanceof Date) return obj
  if (Array.isArray(obj)) {
    return obj.map(item => transformToCamelCase(item)) as any
  }
  
  const transformed: any = {}
  for (const [key, value] of Object.entries(obj)) {
    const camelKey = snakeToCamel(key)
    transformed[camelKey] = transformToCamelCase(value)
  }
  return transformed
}

/**
 * Transform any object from camelCase to snake_case (generic)
 */
export function transformToSnakeCase<T extends Record<string, any>>(obj: T): T {
  if (!obj || typeof obj !== 'object') return obj
  if (obj instanceof Date) return obj
  if (Array.isArray(obj)) {
    return obj.map(item => transformToSnakeCase(item)) as any
  }
  
  const transformed: any = {}
  for (const [key, value] of Object.entries(obj)) {
    const snakeKey = camelToSnake(key)
    transformed[snakeKey] = transformToSnakeCase(value)
  }
  return transformed
}

/**
 * Create a transforming wrapper for database results
 */
export function createModelTransformer<T>(model: ModelName) {
  return {
    toApi: (data: T | T[] | null | undefined) => toApiFormat(data, model),
    toDb: (data: T | null | undefined) => toDbFormat(data, model)
  }
}