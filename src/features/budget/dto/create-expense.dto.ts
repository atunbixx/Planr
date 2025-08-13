/**
 * Create Budget Expense DTO - Input validation for expense creation
 */

import { z } from 'zod'
import { MoneyAmountSchema } from '@/shared/validation/schemas'
import { PaymentStatus } from '@/shared/types/common'

export const CreateBudgetExpenseRequestSchema = z.object({
  // Basic Information
  description: z.string().min(1, 'Expense description is required').max(200),
  amount: MoneyAmountSchema,
  currency: z.string().length(3).default('USD'),
  
  // Category Association
  categoryId: z.string().uuid('Category ID is required'),
  
  // Vendor Association
  vendorId: z.string().uuid().optional(),
  vendorName: z.string().max(100).optional(), // For manual vendor entry
  
  // Payment Details
  paymentStatus: z.enum([
    PaymentStatus.PENDING,
    PaymentStatus.PAID,
    PaymentStatus.PARTIAL,
    PaymentStatus.OVERDUE,
    PaymentStatus.CANCELLED,
    PaymentStatus.REFUNDED
  ]).default(PaymentStatus.PENDING),
  paidAmount: MoneyAmountSchema.default(0),
  
  // Dates
  expenseDate: z.string().datetime(),
  dueDate: z.string().datetime().optional(),
  paidDate: z.string().datetime().optional(),
  
  // Payment Method
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
  
  // Transaction Details
  transactionId: z.string().optional(),
  confirmationNumber: z.string().optional(),
  receiptUrl: z.string().url().optional(),
  invoiceNumber: z.string().optional(),
  
  // Budget Impact
  isPlanned: z.boolean().default(true), // Was this expense planned/budgeted?
  isRecurring: z.boolean().default(false),
  recurringFrequency: z.enum(['weekly', 'monthly', 'quarterly', 'yearly']).optional(),
  recurringEndDate: z.string().datetime().optional(),
  
  // Tax and Fees
  taxAmount: MoneyAmountSchema.optional(),
  tipAmount: MoneyAmountSchema.optional(),
  serviceCharges: MoneyAmountSchema.optional(),
  
  // Approval Workflow
  requiresApproval: z.boolean().default(false),
  approvedBy: z.string().optional(),
  approvedDate: z.string().datetime().optional(),
  
  // Metadata
  notes: z.string().max(1000).optional(),
  tags: z.array(z.string().max(50)).default([]),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  
  // Import/External
  importedFrom: z.string().optional(),
  externalId: z.string().optional()
})

export type CreateBudgetExpenseRequest = z.infer<typeof CreateBudgetExpenseRequestSchema>

// Internal DTO for database operations
export const CreateBudgetExpenseDataSchema = CreateBudgetExpenseRequestSchema.extend({
  id: z.string().uuid(),
  coupleId: z.string().uuid(),
  remainingAmount: z.number(), // Calculated: amount - paidAmount
  isOverdue: z.boolean().default(false), // Calculated based on dueDate
  createdAt: z.date(),
  updatedAt: z.date()
})

export type CreateBudgetExpenseData = z.infer<typeof CreateBudgetExpenseDataSchema>

// Bulk expense creation for vendor contracts
export const BulkCreateExpensesRequestSchema = z.object({
  categoryId: z.string().uuid(),
  vendorId: z.string().uuid().optional(),
  baseExpense: z.object({
    description: z.string().min(1).max(200),
    vendorName: z.string().max(100).optional(),
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
    notes: z.string().max(1000).optional(),
    tags: z.array(z.string().max(50)).default([])
  }),
  paymentSchedule: z.array(z.object({
    description: z.string().max(200),
    amount: MoneyAmountSchema,
    dueDate: z.string().datetime(),
    isDeposit: z.boolean().default(false),
    percentage: z.number().min(0).max(100).optional() // Percentage of total contract
  })).min(1),
  totalAmount: MoneyAmountSchema,
  currency: z.string().length(3).default('USD')
})

export type BulkCreateExpensesRequest = z.infer<typeof BulkCreateExpensesRequestSchema>

// Quick expense templates
export const ExpenseTemplate = {
  VENUE_DEPOSIT: {
    description: 'Venue Deposit',
    percentage: 50,
    requiresApproval: true,
    priority: 'high'
  },
  VENUE_FINAL: {
    description: 'Venue Final Payment',
    percentage: 50,
    requiresApproval: true,
    priority: 'high'
  },
  CATERING_DEPOSIT: {
    description: 'Catering Deposit',
    percentage: 25,
    requiresApproval: true,
    priority: 'high'
  },
  CATERING_PROGRESS: {
    description: 'Catering Progress Payment',
    percentage: 50,
    requiresApproval: true,
    priority: 'medium'
  },
  CATERING_FINAL: {
    description: 'Catering Final Payment',
    percentage: 25,
    requiresApproval: true,
    priority: 'high'
  },
  PHOTOGRAPHY_DEPOSIT: {
    description: 'Photography Booking Deposit',
    percentage: 30,
    requiresApproval: false,
    priority: 'medium'
  },
  PHOTOGRAPHY_FINAL: {
    description: 'Photography Final Payment',
    percentage: 70,
    requiresApproval: false,
    priority: 'medium'
  }
} as const

// Expense import from bank/credit card statements
export const ImportExpensesRequestSchema = z.object({
  importType: z.enum(['csv', 'bank_statement', 'credit_card', 'manual']),
  expenses: z.array(z.object({
    description: z.string(),
    amount: z.number(),
    date: z.string(),
    vendor: z.string().optional(),
    category: z.string().optional(),
    paymentMethod: z.string().optional(),
    transactionId: z.string().optional(),
    rawData: z.record(z.string(), z.any()).optional()
  })),
  defaultCategoryId: z.string().uuid().optional(),
  autoMatch: z.boolean().default(true), // Auto-match vendors and categories
  validateOnly: z.boolean().default(false)
})

export type ImportExpensesRequest = z.infer<typeof ImportExpensesRequestSchema>