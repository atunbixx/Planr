/**
 * Payment Schedule DTOs - Payment timeline and installment management
 */

import { z } from 'zod'
import { MoneyAmountSchema } from '@/shared/validation/schemas'
import { PaymentStatus } from '@/shared/types/common'

// Payment Schedule Creation
export const CreatePaymentScheduleRequestSchema = z.object({
  // Basic Information
  name: z.string().min(1, 'Schedule name is required').max(100),
  description: z.string().max(500).optional(),
  
  // Associated Records
  categoryId: z.string().uuid('Category ID is required'),
  vendorId: z.string().uuid().optional(),
  contractId: z.string().uuid().optional(),
  
  // Schedule Details
  totalAmount: MoneyAmountSchema,
  currency: z.string().length(3).default('USD'),
  
  // Payment Structure
  paymentType: z.enum([
    'milestone', // Pay on specific milestones
    'installment', // Regular installments
    'percentage', // Percentage-based payments
    'custom' // Custom schedule
  ]).default('milestone'),
  
  // Installment Configuration (for installment type)
  installmentCount: z.number().int().min(1).optional(),
  installmentFrequency: z.enum(['weekly', 'monthly', 'quarterly']).optional(),
  firstPaymentDate: z.string().datetime().optional(),
  
  // Auto-generation Options
  autoGenerate: z.boolean().default(false),
  generateFrom: z.enum(['contract_date', 'wedding_date', 'custom_date']).optional(),
  
  // Payment Terms
  earlyPaymentDiscount: z.number().min(0).max(100).optional(), // Percentage
  latePaymentFee: MoneyAmountSchema.optional(),
  gracePeriodDays: z.number().int().min(0).default(0),
  
  // Metadata
  notes: z.string().max(1000).optional(),
  isActive: z.boolean().default(true),
  
  // Manual Payments (if not auto-generating)
  payments: z.array(z.object({
    description: z.string().min(1, 'Payment description is required').max(200),
    amount: MoneyAmountSchema,
    dueDate: z.string().datetime(),
    isDeposit: z.boolean().default(false),
    milestone: z.string().max(100).optional(),
    percentage: z.number().min(0).max(100).optional(),
    notes: z.string().max(500).optional()
  })).optional()
})

export type CreatePaymentScheduleRequest = z.infer<typeof CreatePaymentScheduleRequestSchema>

// Payment Schedule Response
export const PaymentScheduleResponseSchema = z.object({
  id: z.string().uuid(),
  
  // Basic Information
  name: z.string(),
  description: z.string().optional(),
  
  // Associated Records
  categoryId: z.string().uuid(),
  categoryName: z.string(),
  vendorId: z.string().uuid().optional(),
  vendorName: z.string().optional(),
  contractId: z.string().uuid().optional(),
  
  // Schedule Details
  totalAmount: z.number(),
  paidAmount: z.number(),
  remainingAmount: z.number(),
  currency: z.string(),
  
  // Schedule Status
  paymentType: z.enum(['milestone', 'installment', 'percentage', 'custom']),
  status: z.enum(['draft', 'active', 'completed', 'cancelled', 'overdue']),
  completionPercentage: z.number().min(0).max(100),
  
  // Payment Terms
  earlyPaymentDiscount: z.number().optional(),
  latePaymentFee: z.number().optional(),
  gracePeriodDays: z.number().int(),
  
  // Schedule Statistics
  totalPayments: z.number().int(),
  completedPayments: z.number().int(),
  overduePayments: z.number().int(),
  upcomingPayments: z.number().int(),
  
  // Next Payment
  nextPaymentDate: z.string().optional(), // ISO datetime string
  nextPaymentAmount: z.number().optional(),
  nextPaymentDescription: z.string().optional(),
  
  // Timeline
  startDate: z.string().optional(), // ISO datetime string
  endDate: z.string().optional(), // ISO datetime string
  
  // Metadata
  notes: z.string().optional(),
  isActive: z.boolean(),
  
  // Audit fields
  coupleId: z.string().uuid(),
  createdAt: z.string(), // ISO datetime string
  updatedAt: z.string()  // ISO datetime string
})

export type PaymentScheduleResponse = z.infer<typeof PaymentScheduleResponseSchema>

// Individual Payment in Schedule
export const ScheduledPaymentResponseSchema = z.object({
  id: z.string().uuid(),
  scheduleId: z.string().uuid(),
  
  // Payment Details
  description: z.string(),
  amount: z.number(),
  dueDate: z.string(), // ISO datetime string
  
  // Status
  status: z.enum([
    PaymentStatus.PENDING,
    PaymentStatus.PAID,
    PaymentStatus.PARTIAL,
    PaymentStatus.OVERDUE,
    PaymentStatus.CANCELLED
  ]),
  paidAmount: z.number(),
  remainingAmount: z.number(),
  
  // Payment Information
  paidDate: z.string().optional(), // ISO datetime string
  paymentMethod: z.enum([
    'cash',
    'check',
    'credit_card',
    'debit_card',
    'bank_transfer',
    'paypal',
    'venmo',
    'zelle',
    'other'
  ]).optional(),
  transactionId: z.string().optional(),
  confirmationNumber: z.string().optional(),
  
  // Schedule Context
  isDeposit: z.boolean(),
  milestone: z.string().optional(),
  percentage: z.number().optional(),
  sequenceNumber: z.number().int(),
  
  // Status Flags
  isOverdue: z.boolean(),
  daysPastDue: z.number().int(),
  daysUntilDue: z.number().int(),
  
  // Fees and Adjustments
  lateFees: z.number().optional(),
  discountApplied: z.number().optional(),
  adjustmentReason: z.string().optional(),
  
  // Metadata
  notes: z.string().optional(),
  
  // Audit fields
  createdAt: z.string(), // ISO datetime string
  updatedAt: z.string()  // ISO datetime string
})

export type ScheduledPaymentResponse = z.infer<typeof ScheduledPaymentResponseSchema>

// Payment Schedule with Payments
export const PaymentScheduleDetailResponseSchema = PaymentScheduleResponseSchema.extend({
  payments: z.array(ScheduledPaymentResponseSchema)
})

export type PaymentScheduleDetailResponse = z.infer<typeof PaymentScheduleDetailResponseSchema>

// Payment Schedule Templates
export const PaymentScheduleTemplateSchema = z.object({
  templateName: z.string(),
  description: z.string().optional(),
  paymentType: z.enum(['milestone', 'installment', 'percentage', 'custom']),
  defaultPayments: z.array(z.object({
    description: z.string(),
    percentage: z.number().min(0).max(100),
    dayOffset: z.number().int(), // Days from start date
    milestone: z.string().optional()
  })),
  recommendedFor: z.array(z.string()), // Category types
  notes: z.string().optional()
})

export type PaymentScheduleTemplate = z.infer<typeof PaymentScheduleTemplateSchema>

// Common Payment Schedule Templates
export const PAYMENT_SCHEDULE_TEMPLATES = {
  VENUE_STANDARD: {
    templateName: 'Standard Venue Payments',
    paymentType: 'milestone',
    defaultPayments: [
      { description: 'Booking Deposit', percentage: 25, dayOffset: 0, milestone: 'Contract Signed' },
      { description: 'Second Payment', percentage: 50, dayOffset: -60, milestone: '60 Days Before Wedding' },
      { description: 'Final Payment', percentage: 25, dayOffset: -7, milestone: '1 Week Before Wedding' }
    ],
    recommendedFor: ['venue']
  },
  CATERING_PROGRESSIVE: {
    templateName: 'Progressive Catering Payments',
    paymentType: 'milestone',
    defaultPayments: [
      { description: 'Booking Deposit', percentage: 20, dayOffset: 0, milestone: 'Contract Signed' },
      { description: 'Menu Confirmation', percentage: 30, dayOffset: -90, milestone: 'Menu Finalized' },
      { description: 'Guest Count Confirmation', percentage: 30, dayOffset: -14, milestone: 'Final Guest Count' },
      { description: 'Final Payment', percentage: 20, dayOffset: -1, milestone: 'Day Before Wedding' }
    ],
    recommendedFor: ['catering']
  },
  PHOTOGRAPHY_SIMPLE: {
    templateName: 'Simple Photography Payments',
    paymentType: 'milestone',
    defaultPayments: [
      { description: 'Booking Deposit', percentage: 40, dayOffset: 0, milestone: 'Contract Signed' },
      { description: 'Final Payment', percentage: 60, dayOffset: -30, milestone: '30 Days Before Wedding' }
    ],
    recommendedFor: ['photography', 'videography']
  },
  MONTHLY_INSTALLMENTS: {
    templateName: 'Monthly Installments',
    paymentType: 'installment',
    defaultPayments: [], // Generated automatically
    recommendedFor: ['any']
  }
} as const

// Update Payment Schedule
export const UpdatePaymentScheduleRequestSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  totalAmount: MoneyAmountSchema.optional(),
  earlyPaymentDiscount: z.number().min(0).max(100).optional(),
  latePaymentFee: MoneyAmountSchema.optional(),
  gracePeriodDays: z.number().int().min(0).optional(),
  notes: z.string().max(1000).optional(),
  isActive: z.boolean().optional()
}).strict()

export type UpdatePaymentScheduleRequest = z.infer<typeof UpdatePaymentScheduleRequestSchema>

// Record Payment for Scheduled Payment
export const RecordScheduledPaymentRequestSchema = z.object({
  paidAmount: MoneyAmountSchema,
  paymentDate: z.string().datetime(),
  paymentMethod: z.enum([
    'cash',
    'check',
    'credit_card',
    'debit_card',
    'bank_transfer',
    'paypal',
    'venmo',
    'zelle',
    'other'
  ]),
  transactionId: z.string().optional(),
  confirmationNumber: z.string().optional(),
  notes: z.string().max(500).optional(),
  applyEarlyDiscount: z.boolean().default(false),
  lateFeeWaived: z.boolean().default(false)
})

export type RecordScheduledPaymentRequest = z.infer<typeof RecordScheduledPaymentRequestSchema>