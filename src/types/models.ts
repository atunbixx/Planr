// Unified type definitions to resolve conflicts across the codebase

// Core Category type with all required fields
export interface Category {
  id: string
  name: string
  icon: string
  color: string
}

// Vendor type that matches both API and component requirements
export interface Vendor {
  id: string
  name: string
  businessName?: string
  contactName?: string
  email?: string
  phone?: string
  website?: string
  address?: string
  category: string
  categoryId?: string
  status: string
  priority?: string | null
  rating?: number
  estimatedCost?: number
  actualCost?: number
  notes?: string
  meetingDate?: Date | string | null
  contractSigned: boolean
  createdAt?: Date | string
  updatedAt?: Date | string
}

// Photo type with all fields
export interface Photo {
  id: string
  coupleId: string
  createdAt?: Date | string
  title?: string
  caption?: string
  imageUrl: string
  photoDate?: Date | string | null
  photographer?: string
  location?: string
  tags: string[]
  albumId?: string | null
  description?: string
  altText?: string
  cloudinaryPublicId?: string
  cloudinaryUrl?: string
  cloudinarySecureUrl?: string
  originalFilename?: string
  fileSize?: number
  width?: number
  height?: number
  format?: string
  eventType?: string
  isFavorite: boolean // Non-nullable to fix type conflicts
  isPrivate: boolean
  uploadedBy?: string
  updatedAt?: Date | string
  photoAlbums?: {
    id: string
    name: string
  } | null
}

// Album type with computed field
export interface Album {
  id: string
  coupleId: string
  name: string
  description?: string | null
  coverPhotoId?: string | null
  isPublic?: boolean | null
  isFeatured?: boolean | null
  isShared?: boolean | null
  sortOrder?: number | null
  createdAt?: Date | string | null
  updatedAt?: Date | string | null
  photo_count?: number // Computed field for UI
  photos?: Photo[] // Optional relation
}

// Expense type for budget module
export interface Expense {
  id: string
  coupleId: string
  description: string
  amount: number
  expenseDate?: Date | string | null
  expense_date?: Date | string | null // Support both field names
  dueDate?: Date | string | null
  paymentStatus?: string | null
  categoryId?: string
  category?: Category | null
  vendorId?: string | null
  vendor?: Vendor | null
  createdAt?: Date | string
  updatedAt?: Date | string
}

// Budget Category type
export interface BudgetCategory {
  id: string
  coupleId: string
  name: string
  icon?: string
  color?: string
  allocatedAmount?: number
  spentAmount?: number
  priority?: string
  createdAt?: Date | string
  updatedAt?: Date | string
}

// Guest type with all fields
export interface Guest {
  id: string
  coupleId: string
  firstName: string
  lastName: string
  email?: string | null
  phone?: string | null
  address?: string | null
  relationship?: string | null
  side?: string | null
  plusOneAllowed?: boolean | null
  plusOneName?: string | null
  dietaryRestrictions?: string | null
  notes?: string | null
  attendingCount?: number
  invitationSentAt?: Date | string | null
  rsvpDeadline?: Date | string | null
  createdAt?: Date | string | null
  updatedAt?: Date | string | null
  invitations?: Invitation[]
}

// Invitation type
export interface Invitation {
  id: string
  guestId: string
  couple_id: string
  invitationCode?: string | null
  status?: string | null
  attendingCount?: number | null
  plusOneAttending?: boolean | null
  plusOneName?: string | null
  dietaryRestrictions?: string | null
  rsvpNotes?: string | null
  invited_at?: Date | string | null
  respondedAt?: Date | string | null
  rsvpDeadline?: Date | string | null
  createdAt?: Date | string | null
  updatedAt?: Date | string | null
  guest?: Guest
}

// API Response type
export interface APIResponse<T = any> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
    details?: any
  }
  meta?: {
    pagination?: {
      page: number
      limit: number
      total: number
      totalPages: number
    }
    total?: number
  }
}

// Auth Context type
export interface AuthContext {
  userId: string // Supabase UUID
  email: string
  isAuthenticated: boolean
  couple?: {
    id: string
    partner1Name: string
    partner2Name?: string | null
    weddingDate?: Date | string | null
    venueName?: string | null
    totalBudget?: number | null
  }
}

// Export type guards
export const isVendor = (obj: any): obj is Vendor => {
  return obj && typeof obj.id === 'string' && typeof obj.name === 'string'
}

export const isPhoto = (obj: any): obj is Photo => {
  return obj && typeof obj.id === 'string' && typeof obj.imageUrl === 'string'
}

export const isGuest = (obj: any): obj is Guest => {
  return obj && typeof obj.id === 'string' && typeof obj.firstName === 'string'
}