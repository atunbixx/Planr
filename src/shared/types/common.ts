/**
 * Common Types - Shared across all features
 */

export interface BaseEntity {
  id: string
  createdAt: Date
  updatedAt: Date
}

export interface PaginationParams {
  page?: number
  pageSize?: number
  cursor?: string
}

export interface PaginationMeta {
  page: number
  pageSize: number
  total: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: PaginationMeta
}

export interface SortParams {
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface FilterParams {
  search?: string
  status?: string
  dateFrom?: string
  dateTo?: string
}

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
  code?: string
}

export interface IdempotencyMeta {
  key: string
  processed: boolean
  processedAt?: Date
  result?: any
}

// Status Enums - Single source of truth
export const RsvpStatus = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  DECLINED: 'declined',
  MAYBE: 'maybe',
  CANCELLED: 'cancelled'
} as const

export const VendorStatus = {
  POTENTIAL: 'potential',
  CONTACTED: 'contacted',
  QUOTED: 'quoted',
  BOOKED: 'booked',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
} as const

export const PaymentStatus = {
  PENDING: 'pending',
  PAID: 'paid',
  PARTIAL: 'partial',
  OVERDUE: 'overdue',
  CANCELLED: 'cancelled',
  REFUNDED: 'refunded'
} as const

export const Priority = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent'
} as const

export const TaskStatus = {
  TODO: 'todo',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
} as const

export type RsvpStatusType = typeof RsvpStatus[keyof typeof RsvpStatus]
export type VendorStatusType = typeof VendorStatus[keyof typeof VendorStatus]
export type PaymentStatusType = typeof PaymentStatus[keyof typeof PaymentStatus]
export type PriorityType = typeof Priority[keyof typeof Priority]
export type TaskStatusType = typeof TaskStatus[keyof typeof TaskStatus]