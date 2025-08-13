/**
 * Strict API Contracts - Single source of truth for API response types
 * These interfaces MUST be used by all API handlers and frontend components
 */

// Base API Response wrapper
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  errors?: ValidationError[]
  timestamp: string
}

export interface ValidationError {
  field: string
  message: string
}

export interface PaginationMeta {
  page: number
  pageSize: number
  total: number
  totalPages: number
}

// ============================================================================
// COUPLE CONTRACTS
// ============================================================================

export interface CoupleResponse {
  id: string
  partner1Name: string
  partner2Name: string | null
  weddingDate: string | null // ISO string
  venueName: string | null
  venueLocation: string | null
  guestCountEstimate: number | null
  totalBudget: number | null
  currency: string | null
  weddingStyle: string | null
  onboardingCompleted: boolean
  createdAt: string | null // ISO string
  updatedAt: string | null // ISO string
}

export interface CreateCoupleRequest {
  partner1Name: string
  partner2Name?: string
  weddingDate?: string // ISO string
  venueName?: string
  venueLocation?: string
  guestCountEstimate?: number
  totalBudget?: number
  currency?: string
  weddingStyle?: string
}

export interface UpdateCoupleRequest {
  partner1Name?: string
  partner2Name?: string
  weddingDate?: string // ISO string
  venueName?: string
  venueLocation?: string
  guestCountEstimate?: number
  totalBudget?: number
  currency?: string
  weddingStyle?: string
}

// ============================================================================
// BUDGET CONTRACTS
// ============================================================================

export interface BudgetSummaryResponse {
  totalBudget: number
  totalAllocated: number
  totalSpent: number
  totalRemaining: number
  spentPercentage: number
  categories: BudgetCategoryWithExpenses[]
  recentExpenses: BudgetExpenseWithCategory[]
}

export interface BudgetCategoryWithExpenses {
  id: string
  name: string
  icon: string
  color: string
  allocatedAmount: number
  spentAmount: number
  priority: string
  industryAveragePercentage: number
  percentageOfTotal: number
  expenses: BudgetExpenseData[]
}

export interface BudgetExpenseWithCategory {
  id: string
  description: string
  amount: number
  dueDate: string | null // ISO string
  paymentStatus: string
  category: {
    name: string
    icon: string
    color: string
  } | null
}

export interface BudgetExpenseData {
  id: string
  description: string
  amount: number
  dueDate: string | null // ISO string
  paymentStatus: string
}

export interface BudgetCategoryResponse {
  id: string
  name: string
  icon: string
  color: string
  allocatedAmount: number
  spentAmount: number
  priority: string
  industryAveragePercentage: number
}

export interface CreateBudgetCategoryRequest {
  name: string
  icon?: string
  color?: string
  allocatedAmount: number
  priority?: string
  industryAveragePercentage?: number
}

export interface UpdateBudgetCategoryRequest {
  name?: string
  icon?: string
  color?: string
  allocatedAmount?: number
  priority?: string
  industryAveragePercentage?: number
}

export interface CreateBudgetExpenseRequest {
  categoryId: string
  description: string
  amount: number
  dueDate?: string // ISO string
  paymentStatus?: string
  vendorId?: string
  expenseType?: string
}

export interface UpdateBudgetExpenseRequest {
  categoryId?: string
  description?: string
  amount?: number
  dueDate?: string // ISO string
  paymentStatus?: string
  vendorId?: string
  expenseType?: string
}

export interface UpdateTotalBudgetRequest {
  totalBudget: number
}

// ============================================================================
// VENDOR CONTRACTS
// ============================================================================

export interface VendorsResponse {
  vendors: VendorResponse[]
  categories: VendorCategoryResponse[]
  stats: VendorStatsResponse
  costs: VendorCostsResponse
  pagination: PaginationMeta
}

export interface VendorResponse {
  id: string
  businessName: string
  contactName: string | null
  email: string | null
  phone: string | null
  website: string | null
  address: string | null
  categoryId: string | null
  status: string
  priority: string
  rating: number | null
  estimatedCost: number | null
  actualCost: number | null
  contractSigned: boolean
  notes: string | null
  createdAt: string | null // ISO string
  updatedAt: string | null // ISO string
  category?: VendorCategoryResponse | null
}

export interface VendorCategoryResponse {
  id: string
  name: string
  icon: string
  color: string
  description: string | null
}

export interface VendorStatsResponse {
  total: number
  potential: number
  contacted: number
  quoted: number
  booked: number
  completed: number
  totalEstimatedCost: number
  totalActualCost: number
}

export interface VendorCostsResponse {
  estimated: number
  actual: number
}

export interface CreateVendorRequest {
  businessName: string
  contactName?: string
  email?: string
  phone?: string
  website?: string
  address?: string
  categoryId?: string
  status?: string
  priority?: string
  rating?: number
  estimatedCost?: number
  actualCost?: number
  contractSigned?: boolean
  notes?: string
}

export interface UpdateVendorRequest {
  businessName?: string
  contactName?: string
  email?: string
  phone?: string
  website?: string
  address?: string
  categoryId?: string
  status?: string
  priority?: string
  rating?: number
  estimatedCost?: number
  actualCost?: number
  contractSigned?: boolean
  notes?: string
}

export interface VendorFiltersRequest {
  status?: string
  categoryId?: string
  priority?: string
  contractSigned?: boolean
  search?: string
  page?: number
  pageSize?: number
}

// ============================================================================
// GUEST CONTRACTS
// ============================================================================

export interface GuestsResponse {
  guests: GuestResponse[]
  stats: GuestStatsResponse
  pagination: PaginationMeta
}

export interface GuestResponse {
  id: string
  firstName: string
  lastName: string
  email: string | null
  phone: string | null
  address: string | null
  plusOneAllowed: boolean
  plusOneName: string | null
  tableNumber: number | null
  dietaryRestrictions: string | null
  notes: string | null
  rsvpStatus: string
  rsvpDeadline: string | null // ISO string
  invitationSentAt: string | null // ISO string
  attendingCount: number
  createdAt: string | null // ISO string
  updatedAt: string | null // ISO string
  invitation?: InvitationResponse | null
}

export interface InvitationResponse {
  id: string
  invitationCode: string | null
  status: string
  attendingCount: number | null
  plusOneAttending: boolean | null
  plusOneName: string | null
  dietaryRestrictions: string | null
  rsvpNotes: string | null
  invitedAt: string | null // ISO string
  respondedAt: string | null // ISO string
  rsvpDeadline: string | null // ISO string
}

export interface GuestStatsResponse {
  total: number
  confirmed: number
  declined: number
  pending: number
  notInvited: number
  totalAttending: number
}

export interface CreateGuestRequest {
  firstName: string
  lastName: string
  email?: string
  phone?: string
  address?: string
  plusOneAllowed?: boolean
  plusOneName?: string
  tableNumber?: number
  dietaryRestrictions?: string
  notes?: string
  rsvpDeadline?: string // ISO string
}

export interface UpdateGuestRequest {
  firstName?: string
  lastName?: string
  email?: string
  phone?: string
  address?: string
  plusOneAllowed?: boolean
  plusOneName?: string
  tableNumber?: number
  dietaryRestrictions?: string
  notes?: string
  rsvpDeadline?: string // ISO string
}

export interface UpdateRsvpRequest {
  status: string
  attendingCount?: number
}

export interface GuestFiltersRequest {
  rsvpStatus?: string
  tableNumber?: number
  plusOneAllowed?: boolean
  search?: string
  page?: number
  pageSize?: number
}

// ============================================================================
// DASHBOARD CONTRACTS
// ============================================================================

export interface DashboardStatsResponse {
  wedding: WeddingStatsResponse
  guests: GuestStatsResponse
  budget: BudgetStatsResponse
  vendors: VendorStatsResponse
  checklist: ChecklistStatsResponse
  photos: PhotoStatsResponse
  messages: MessageStatsResponse
}

export interface WeddingStatsResponse {
  date: string | null // ISO string
  daysUntil: number | null
  venue: {
    name: string | null
    location: string | null
  }
  guestCount: number
}

export interface BudgetStatsResponse {
  totalBudget: number
  totalAllocated: number
  totalSpent: number
  remaining: number
  percentageSpent: number
  categoryCount: number
  expenseCount: number
}

export interface ChecklistStatsResponse {
  total: number
  completed: number
  pending: number
  completionPercentage: number
  dueSoon: number
}

export interface PhotoStatsResponse {
  totalPhotos: number
  totalAlbums: number
  favoriteCount: number
}

export interface MessageStatsResponse {
  total: number
  sent: number
  scheduled: number
  draft: number
  failed: number
}

export interface ActivityResponse {
  id: string
  type: 'guest' | 'expense' | 'message' | 'photo'
  title: string
  description: string
  timestamp: string // ISO string
  icon: string
  data: any
}

// ============================================================================
// SETTINGS CONTRACTS
// ============================================================================

export interface WeddingSettingsResponse {
  partnerOneName: string
  partnerTwoName: string
  weddingDate: string | null // ISO string
  venue: {
    name: string
    address: string
    city: string
    state: string
    country: string
  } | null
  ceremonyTime: string | null
  receptionTime: string | null
  guestCount: number
  budget: number
  theme: string
  primaryColor: string | null
  secondaryColor: string | null
  website: string | null
  hashtag: string | null
  story: string | null
}

export interface UpdateWeddingSettingsRequest {
  partnerOneName?: string
  partnerTwoName?: string
  weddingDate?: string // ISO string
  venue?: {
    name: string
    address: string
    city: string
    state: string
    country: string
    postalCode?: string
    coordinates?: {
      lat: number
      lng: number
    }
  }
  ceremonyTime?: string
  receptionTime?: string
  guestCount?: number
  budget?: number
  theme?: string
  primaryColor?: string
  secondaryColor?: string
  website?: string
  hashtag?: string
  story?: string
}

export interface UserPreferencesResponse {
  language: string
  timezone: string
  currency: string
  dateFormat: string
  timeFormat: string
  firstDayOfWeek: number
  emailNotifications: boolean
  smsNotifications: boolean
  pushNotifications: boolean
  reminderSettings: {
    enabled: boolean
    daysBefore: number
    timeOfDay: string
  }
  privacy: {
    showRsvpPublicly: boolean
    allowGuestUploads: boolean
    requirePhotoApproval: boolean
  }
}

export interface UpdateUserPreferencesRequest {
  language?: string
  timezone?: string
  currency?: string
  dateFormat?: string
  timeFormat?: string
  firstDayOfWeek?: number
  emailNotifications?: boolean
  smsNotifications?: boolean
  pushNotifications?: boolean
  reminderSettings?: {
    enabled: boolean
    daysBefore: number
    timeOfDay: string
  }
  privacy?: {
    showRsvpPublicly: boolean
    allowGuestUploads: boolean
    requirePhotoApproval: boolean
  }
}

// ============================================================================
// TYPE GUARDS AND VALIDATION UTILITIES
// ============================================================================

export function isApiResponse<T>(obj: any): obj is ApiResponse<T> {
  return obj && typeof obj.success === 'boolean' && typeof obj.timestamp === 'string'
}

export function isValidationError(obj: any): obj is ValidationError {
  return obj && typeof obj.field === 'string' && typeof obj.message === 'string'
}

// Status enums for consistency
export const VendorStatus = {
  POTENTIAL: 'potential',
  CONTACTED: 'contacted', 
  QUOTED: 'quoted',
  BOOKED: 'booked',
  COMPLETED: 'completed'
} as const

export const VendorPriority = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high'
} as const

export const PaymentStatus = {
  PENDING: 'pending',
  PAID: 'paid',
  OVERDUE: 'overdue',
  CANCELLED: 'cancelled'
} as const

export const RsvpStatus = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  DECLINED: 'declined',
  CANCELLED: 'cancelled'
} as const

export type VendorStatusType = typeof VendorStatus[keyof typeof VendorStatus]
export type VendorPriorityType = typeof VendorPriority[keyof typeof VendorPriority]
export type PaymentStatusType = typeof PaymentStatus[keyof typeof PaymentStatus]
export type RsvpStatusType = typeof RsvpStatus[keyof typeof RsvpStatus]