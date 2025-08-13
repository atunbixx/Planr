/**
 * Update Budget Expense DTO - Input validation for expense updates
 */

import { z } from 'zod'
import { MoneyAmountSchema } from '@/shared/validation/schemas'
import { PaymentStatus } from '@/shared/types/common'

export const UpdateBudgetExpenseRequestSchema = z.object({
  // Basic Information Updates
  description: z.string().min(1).max(200).optional(),
  amount: MoneyAmountSchema.optional(),
  currency: z.string().length(3).optional(),
  
  // Category Association Updates
  categoryId: z.string().uuid().optional(),
  
  // Vendor Association Updates
  vendorId: z.string().uuid().optional(),
  vendorName: z.string().max(100).optional(),
  
  // Payment Details Updates
  paymentStatus: z.enum([
    PaymentStatus.PENDING,
    PaymentStatus.PAID,
    PaymentStatus.PARTIAL,
    PaymentStatus.OVERDUE,
    PaymentStatus.CANCELLED,
    PaymentStatus.REFUNDED
  ]).optional(),
  paidAmount: MoneyAmountSchema.optional(),
  
  // Dates Updates
  expenseDate: z.string().datetime().optional(),
  dueDate: z.string().datetime().optional(),
  paidDate: z.string().datetime().optional(),
  
  // Payment Method Updates
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
  
  // Transaction Details Updates
  transactionId: z.string().optional(),
  confirmationNumber: z.string().optional(),
  receiptUrl: z.string().url().optional(),
  invoiceNumber: z.string().optional(),
  
  // Budget Impact Updates
  isPlanned: z.boolean().optional(),
  isRecurring: z.boolean().optional(),
  recurringFrequency: z.enum(['weekly', 'monthly', 'quarterly', 'yearly']).optional(),
  recurringEndDate: z.string().datetime().optional(),
  
  // Tax and Fees Updates
  taxAmount: MoneyAmountSchema.optional(),
  tipAmount: MoneyAmountSchema.optional(),
  serviceCharges: MoneyAmountSchema.optional(),
  
  // Approval Workflow Updates
  requiresApproval: z.boolean().optional(),
  approvedBy: z.string().optional(),
  approvedDate: z.string().datetime().optional(),
  
  // Metadata Updates
  notes: z.string().max(1000).optional(),
  tags: z.array(z.string().max(50)).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  
  // External Updates
  externalId: z.string().optional()
}).strict()

export type UpdateBudgetExpenseRequest = z.infer<typeof UpdateBudgetExpenseRequestSchema>

// Internal DTO for database operations
export const UpdateBudgetExpenseDataSchema = UpdateBudgetExpenseRequestSchema.extend({
  // Calculated fields that might be updated
  remainingAmount: z.number().optional(),
  isOverdue: z.boolean().optional(),
  updatedAt: z.date()
})

export type UpdateBudgetExpenseData = z.infer<typeof UpdateBudgetExpenseDataSchema>

// Patch validation - at least one field must be provided
export const PatchBudgetExpenseRequestSchema = UpdateBudgetExpenseRequestSchema.refine(
  (data) => Object.values(data).some(value => value !== undefined),
  {
    message: "At least one field must be provided for update",
    path: ["root"]
  }
)

export type PatchBudgetExpenseRequest = z.infer<typeof PatchBudgetExpenseRequestSchema>

// Payment update schema (for recording payments)
export const PaymentUpdateRequestSchema = z.object({
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
  receiptUrl: z.string().url().optional(),
  notes: z.string().max(500).optional(),
  markAsPaid: z.boolean().default(true) // Auto-update status to paid if fully paid
})

export type PaymentUpdateRequest = z.infer<typeof PaymentUpdateRequestSchema>

// Bulk payment update for multiple expenses
export const BulkPaymentUpdateRequestSchema = z.object({
  expenseIds: z.array(z.string().uuid()).min(1).max(50),
  payment: PaymentUpdateRequestSchema,
  reason: z.string().max(500).optional()
})

export type BulkPaymentUpdateRequest = z.infer<typeof BulkPaymentUpdateRequestSchema>

// Expense approval schema
export const ExpenseApprovalRequestSchema = z.object({
  approved: z.boolean(),
  approverNotes: z.string().max(1000).optional(),
  approvedAmount: MoneyAmountSchema.optional(), // Can approve partial amount
  reason: z.string().max(500).optional()
})

export type ExpenseApprovalRequest = z.infer<typeof ExpenseApprovalRequestSchema>

// Expense split schema (for shared expenses)
export const SplitExpenseRequestSchema = z.object({
  originalExpenseId: z.string().uuid(),
  splits: z.array(z.object({
    description: z.string().min(1).max(200),
    amount: MoneyAmountSchema,
    categoryId: z.string().uuid(),
    notes: z.string().max(500).optional()
  })).min(2),
  deleteOriginal: z.boolean().default(false),
  reason: z.string().max(500).optional()
})

export type SplitExpenseRequest = z.infer<typeof SplitExpenseRequestSchema>

// Recurring expense update schema
export const RecurringExpenseUpdateSchema = z.object({
  frequency: z.enum(['weekly', 'monthly', 'quarterly', 'yearly']),
  endDate: z.string().datetime().optional(),
  nextAmount: MoneyAmountSchema.optional(),
  autoCreate: z.boolean().default(true),
  reminderDays: z.number().int().min(0).max(30).default(7)
})

export type RecurringExpenseUpdate = z.infer<typeof RecurringExpenseUpdateSchema>