/**
 * Field Mapping Configuration
 * This file serves as the single source of truth for all database field names
 * to prevent mismatches between the Prisma schema and API implementations
 * 
 * CRITICAL: This solves the snake_case vs camelCase issue once and for all
 * by providing automatic transformation utilities
 */

export const FIELD_MAPPINGS = {
  // User Model Fields
  user: {
    id: 'id',
    supabaseUserId: 'supabase_user_id', // Not clerkId or clerk_user_id!
    email: 'email',
    firstName: 'firstName',
    lastName: 'lastName',
    phone: 'phone',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
    preferences: 'preferences'
  },

  // Couple Model Fields
  couple: {
    id: 'id',
    userId: 'userId', // Primary user who created the couple
    partner1UserId: 'partner1_user_id', // Optional partner 1 user ID
    partner2UserId: 'partner2_user_id', // Optional partner 2 user ID
    partner1Name: 'partner1Name',
    partner2Name: 'partner2Name',
    weddingDate: 'weddingDate',
    venueName: 'venueName',
    venueLocation: 'venueLocation',
    guestCountEstimate: 'guestCountEstimate',
    totalBudget: 'totalBudget',
    currency: 'currency',
    weddingStyle: 'weddingStyle',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
    budgetTotal: 'budget_total', // Legacy field
    onboardingCompleted: 'onboardingCompleted'
  },

  // Guest Model Fields (Primary model - use this!)
  guest: {
    id: 'id',
    coupleId: 'coupleId',
    firstName: 'firstName',
    lastName: 'lastName',
    email: 'email',
    phone: 'phone',
    address: 'address',
    relationship: 'relationship',
    side: 'side',
    plusOneAllowed: 'plusOneAllowed',
    plusOneName: 'plusOneName',
    dietaryRestrictions: 'dietaryRestrictions',
    notes: 'notes',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
    attendingCount: 'attendingCount',
    invitationSentAt: 'invitationSentAt',
    rsvpDeadline: 'rsvpDeadline'
  },

  // Wedding Guests Model (Legacy - do not use for new code!)
  weddingGuests: {
    // This model exists in the database but should not be used
    // Use the Guest model instead
    _deprecated: true,
    _useInstead: 'guest'
  },

  // Vendor Model Fields
  vendor: {
    id: 'id',
    coupleId: 'coupleId',
    name: 'name',
    contactName: 'contactName',
    phone: 'phone',
    email: 'email',
    website: 'website',
    address: 'address',
    categoryId: 'categoryId',
    status: 'status',
    priority: 'priority',
    rating: 'rating',
    estimatedCost: 'estimatedCost',
    actualCost: 'actualCost',
    notes: 'notes',
    meetingDate: 'meetingDate',
    contractSigned: 'contractSigned',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  },

  // Budget Category Fields
  budgetCategory: {
    id: 'id',
    coupleId: 'coupleId',
    name: 'name',
    icon: 'icon',
    color: 'color',
    allocatedAmount: 'allocatedAmount',
    spentAmount: 'spentAmount',
    priority: 'priority',
    percentageOfTotal: 'percentageOfTotal',
    industryAveragePercentage: 'industryAveragePercentage',
    marketTrends: 'marketTrends',
    vendorInsights: 'vendorInsights',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  },

  // Budget Expense Fields
  budgetExpense: {
    id: 'id',
    coupleId: 'coupleId',
    categoryId: 'categoryId',
    vendorId: 'vendorId',
    description: 'description',
    amount: 'amount',
    expenseType: 'expenseType',
    paymentStatus: 'paymentStatus',
    paymentMethod: 'paymentMethod',
    dueDate: 'dueDate',
    paidDate: 'paidDate',
    receiptUrl: 'receiptUrl',
    notes: 'notes',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  },

  // Checklist Item Fields
  checklistItem: {
    id: 'id',
    coupleId: 'coupleId',
    title: 'title',
    description: 'description',
    category: 'category',
    timeframe: 'timeframe',
    priority: 'priority',
    dueDate: 'dueDate',
    isCompleted: 'isCompleted',
    completedAt: 'completedAt',
    notes: 'notes',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  },

  // Photo Fields
  photo: {
    id: 'id',
    coupleId: 'coupleId',
    albumId: 'albumId',
    filename: 'filename',
    originalName: 'originalName',
    cloudinaryId: 'cloudinaryId',
    cloudinaryPublicId: 'cloudinaryPublicId',
    cloudinarySecureUrl: 'cloudinarySecureUrl',
    cloudinaryUrl: 'cloudinaryUrl',
    title: 'title',
    description: 'description',
    fileSize: 'fileSize',
    width: 'width',
    height: 'height',
    format: 'format',
    tags: 'tags',
    isFavorite: 'isFavorite',
    isPrivate: 'isPrivate',
    shared: 'shared',
    sortOrder: 'sortOrder',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  },

  // Photo Album Fields
  photoAlbum: {
    id: 'id',
    coupleId: 'coupleId',
    name: 'name',
    description: 'description',
    coverPhotoId: 'coverPhotoId',
    isPublic: 'isPublic',
    sortOrder: 'sortOrder',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  }
} as const

/**
 * Helper function to find a couple by user ID
 * This is the standard query that should be used across the application
 */
export const COUPLE_BY_USER_QUERY = (userId: string) => ({
  OR: [
    { [FIELD_MAPPINGS.couple.userId]: userId },
    { [FIELD_MAPPINGS.couple.partner1UserId]: userId },
    { [FIELD_MAPPINGS.couple.partner2UserId]: userId }
  ]
})

/**
 * Helper to validate that required fields exist in request data
 */
export function validateRequiredFields<T extends Record<string, any>>(
  data: T,
  requiredFields: (keyof T)[],
  modelName: string
): void {
  const missingFields = requiredFields.filter(field => !data[field])
  
  if (missingFields.length > 0) {
    throw new Error(
      `Missing required fields for ${modelName}: ${missingFields.join(', ')}`
    )
  }
}

/**
 * Maps frontend field names to database field names
 * Useful for handling legacy code or frontend conventions
 */
export const FRONTEND_TO_DB_MAPPINGS = {
  // Guest field mappings
  guest: {
    name: (name: string) => {
      const parts = name.split(' ')
      return {
        firstName: parts[0] || '',
        lastName: parts.slice(1).join(' ') || ''
      }
    }
  },
  
  // Couple field mappings
  couple: {
    venue: 'venueName',
    location: 'venueLocation',
    expectedGuests: 'guestCountEstimate',
    budgetTotal: 'totalBudget'
  }
} as const

/**
 * UNIVERSAL FIELD TRANSFORMATION UTILITIES
 * These functions handle the snake_case <-> camelCase conversion automatically
 */

/**
 * Converts snake_case to camelCase
 */
export function snakeToCamel(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
}

/**
 * Converts camelCase to snake_case
 */
export function camelToSnake(str: string): string {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`)
}

/**
 * Transforms object keys from snake_case to camelCase
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
 * Transforms object keys from camelCase to snake_case
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
 * Simple wrapper - for now just return the original client
 * Manual transformation will be more reliable
 */
export function createTransformingSupabaseClient(supabaseClient: any) {
  return supabaseClient
}

// Removed complex proxy implementation for now

/**
 * Middleware for API handlers to automatically transform request/response data
 */
export function withFieldTransformation(handler: Function) {
  return async (req: Request, ...args: any[]) => {
    // Transform request body from camelCase to snake_case
    if (req.method !== 'GET' && req.body) {
      const body = await req.json()
      req = new Request(req.url, {
        ...req,
        body: JSON.stringify(transformToSnakeCase(body))
      })
    }
    
    // Call the original handler
    const response = await handler(req, ...args)
    
    // Transform response from snake_case to camelCase
    if (response.ok && response.headers.get('content-type')?.includes('application/json')) {
      const data = await response.json()
      return new Response(
        JSON.stringify(transformToCamelCase(data)),
        response
      )
    }
    
    return response
  }
}