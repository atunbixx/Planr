import { User, Couple, Vendor, Guest, Photo, BudgetCategory, BudgetExpense } from '@prisma/client'

// Base API Response types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
  metadata?: {
    total?: number
    page?: number
    limit?: number
  }
}

export interface ApiError {
  message: string
  code?: string
  statusCode: number
  details?: any
}

// Authentication context types
export interface AuthContext {
  userId: string
  user: User
  couple: Couple | null // Can be null if user hasn't completed onboarding
}

export interface AuthenticatedRequest {
  auth: AuthContext
}

// Common query parameters
export interface PaginationParams {
  page?: number
  limit?: number
  sort?: string
  order?: 'asc' | 'desc'
}

export interface FilterParams {
  search?: string
  category?: string
  status?: string
  dateFrom?: string
  dateTo?: string
}

// Feature-specific types
export interface VendorWithRelations extends Vendor {
  expenses?: BudgetExpense[]
  _count?: {
    expenses: number
  }
}

export interface PhotoWithAlbum extends Photo {
  album?: {
    id: string
    name: string
  }
}

export interface GuestWithRSVP extends Guest {
  rsvpStatus?: string
  dietaryRestrictions?: string[]
  plusOneName?: string
}

export interface BudgetCategoryWithExpenses extends BudgetCategory {
  expenses: BudgetExpense[]
  _sum?: {
    expenses: {
      amount: number
    }
  }
}

// Statistics types
export interface VendorStats {
  total: number
  potential: number
  contacted: number
  quoted: number
  booked: number
  completed: number
}

export interface BudgetStats {
  totalBudget: number
  totalSpent: number
  totalEstimated: number
  remainingBudget: number
  percentageUsed: number
}

export interface PhotoStats {
  total: number
  withAlbums: number
  recent: number
}

export interface GuestStats {
  total: number
  confirmed: number
  declined: number
  pending: number
  plusOnes: number
}

// Request body types
export interface CreateVendorRequest {
  businessName: string
  contactName?: string
  email?: string
  phone?: string
  website?: string
  category: string
  status?: 'potential' | 'contacted' | 'quoted' | 'booked' | 'completed'
  estimatedCost?: number
  actualCost?: number
  contractSigned?: boolean
  notes?: string
}

export interface UpdateVendorRequest extends Partial<CreateVendorRequest> {}

export interface CreateExpenseRequest {
  categoryId: string
  vendorId?: string
  description: string
  amount: number
  date: string
  isPaid: boolean
  notes?: string
}

export interface CreatePhotoRequest {
  url: string
  publicId: string
  albumId?: string
  caption?: string
  tags?: string[]
}

export interface BulkPhotoUploadRequest {
  photos: CreatePhotoRequest[]
}

// Webhook types
export interface WebhookEvent {
  id: string
  type: string
  created: number
  data: any
}