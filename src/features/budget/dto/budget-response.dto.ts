/**
 * Budget Response DTOs - Output formats for API responses
 */

import { z } from 'zod'
import { PaginatedResponse } from '@/shared/types/common'
import { PaymentStatus } from '@/shared/types/common'

// Budget Category Response
export const BudgetCategoryResponseSchema = z.object({
  id: z.string().uuid(),
  
  // Basic Information
  name: z.string(),
  description: z.string().optional(),
  
  // Budget Allocation
  plannedAmount: z.number(),
  actualSpent: z.number(),
  remainingAmount: z.number(),
  percentageUsed: z.number(),
  currency: z.string(),
  
  // Category Details
  categoryType: z.enum([
    'venue',
    'catering',
    'photography',
    'videography',
    'music',
    'flowers',
    'attire',
    'rings',
    'transportation',
    'accommodation',
    'invitations',
    'favors',
    'decorations',
    'beauty',
    'honeymoon',
    'other'
  ]),
  
  // Priority and Status
  priority: z.enum(['low', 'medium', 'high', 'essential']),
  isEssential: z.boolean(),
  isOverBudget: z.boolean(),
  
  // Timeline
  needsByDate: z.string().optional(), // ISO datetime string
  finalPaymentDate: z.string().optional(), // ISO datetime string
  
  // Vendor Association
  vendorId: z.string().uuid().optional(),
  vendorName: z.string().optional(),
  
  // Buffer and Flexibility
  bufferPercentage: z.number(),
  bufferAmount: z.number(), // Calculated
  isFlexible: z.boolean(),
  
  // Tracking
  trackPayments: z.boolean(),
  allowOverspend: z.boolean(),
  
  // Statistics
  expenseCount: z.number().int(),
  paidExpenseCount: z.number().int(),
  pendingPayments: z.number(),
  
  // Metadata
  notes: z.string().optional(),
  tags: z.array(z.string()),
  
  // External References
  externalId: z.string().optional(),
  
  // Audit fields
  coupleId: z.string().uuid(),
  createdAt: z.string(), // ISO datetime string
  updatedAt: z.string()  // ISO datetime string
})

export type BudgetCategoryResponse = z.infer<typeof BudgetCategoryResponseSchema>

// Budget Expense Response
export const BudgetExpenseResponseSchema = z.object({
  id: z.string().uuid(),
  
  // Basic Information
  description: z.string(),
  amount: z.number(),
  paidAmount: z.number(),
  remainingAmount: z.number(),
  currency: z.string(),
  
  // Category and Vendor
  categoryId: z.string().uuid(),
  categoryName: z.string(),
  vendorId: z.string().uuid().optional(),
  vendorName: z.string().optional(),
  
  // Payment Details
  paymentStatus: z.enum([
    PaymentStatus.PENDING,
    PaymentStatus.PAID,
    PaymentStatus.PARTIAL,
    PaymentStatus.OVERDUE,
    PaymentStatus.CANCELLED,
    PaymentStatus.REFUNDED
  ]),
  
  // Dates
  expenseDate: z.string(), // ISO datetime string
  dueDate: z.string().optional(), // ISO datetime string
  paidDate: z.string().optional(), // ISO datetime string
  
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
  
  // Status Flags
  isPlanned: z.boolean(),
  isRecurring: z.boolean(),
  isOverdue: z.boolean(),
  requiresApproval: z.boolean(),
  isApproved: z.boolean(),
  
  // Tax and Fees
  taxAmount: z.number().optional(),
  tipAmount: z.number().optional(),
  serviceCharges: z.number().optional(),
  totalAmount: z.number(), // Calculated: amount + tax + tip + charges
  
  // Approval
  approvedBy: z.string().optional(),
  approvedDate: z.string().optional(), // ISO datetime string
  
  // Recurring Details
  recurringFrequency: z.enum(['weekly', 'monthly', 'quarterly', 'yearly']).optional(),
  recurringEndDate: z.string().optional(), // ISO datetime string
  nextRecurringDate: z.string().optional(), // ISO datetime string
  
  // Metadata
  notes: z.string().optional(),
  tags: z.array(z.string()),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  
  // Import Information
  importedFrom: z.string().optional(),
  externalId: z.string().optional(),
  
  // Audit fields
  coupleId: z.string().uuid(),
  createdAt: z.string(), // ISO datetime string
  updatedAt: z.string()  // ISO datetime string
})

export type BudgetExpenseResponse = z.infer<typeof BudgetExpenseResponseSchema>

// Budget Summary Response
export const BudgetSummaryResponseSchema = z.object({
  // Overall Budget
  totalBudget: z.number(),
  totalSpent: z.number(),
  totalRemaining: z.number(),
  percentageUsed: z.number(),
  currency: z.string(),
  
  // Status Overview
  categoriesCount: z.number().int(),
  expensesCount: z.number().int(),
  overBudgetCategories: z.number().int(),
  
  // Payment Status
  paidExpenses: z.number().int(),
  pendingExpenses: z.number().int(),
  overdueExpenses: z.number().int(),
  totalPendingAmount: z.number(),
  totalOverdueAmount: z.number(),
  
  // Category Breakdown
  categoryBreakdown: z.array(z.object({
    categoryId: z.string().uuid(),
    categoryName: z.string(),
    categoryType: z.string(),
    plannedAmount: z.number(),
    actualSpent: z.number(),
    remainingAmount: z.number(),
    percentageUsed: z.number(),
    isOverBudget: z.boolean(),
    expenseCount: z.number().int()
  })),
  
  // Upcoming Payments
  upcomingPayments: z.array(z.object({
    expenseId: z.string().uuid(),
    description: z.string(),
    amount: z.number(),
    dueDate: z.string(),
    vendorName: z.string().optional(),
    categoryName: z.string(),
    daysUntilDue: z.number().int()
  })),
  
  // Budget Health
  budgetHealth: z.enum(['excellent', 'good', 'warning', 'critical']),
  budgetHealthScore: z.number().min(0).max(100),
  recommendations: z.array(z.string())
})

export type BudgetSummaryResponse = z.infer<typeof BudgetSummaryResponseSchema>

// Budget Analytics Response
export const BudgetAnalyticsResponseSchema = z.object({
  // Spending Trends
  monthlySpending: z.array(z.object({
    month: z.string(),
    planned: z.number(),
    actual: z.number()
  })),
  
  // Category Performance
  categoryPerformance: z.array(z.object({
    categoryName: z.string(),
    budgetAccuracy: z.number(), // How close actual spending is to planned
    varianceAmount: z.number(),
    variancePercentage: z.number()
  })),
  
  // Payment Patterns
  paymentPatterns: z.object({
    averagePaymentSize: z.number(),
    mostCommonPaymentMethod: z.string(),
    onTimePaymentRate: z.number(),
    averageDaysEarly: z.number()
  }),
  
  // Vendor Analysis
  vendorSpending: z.array(z.object({
    vendorName: z.string(),
    totalSpent: z.number(),
    expenseCount: z.number().int(),
    averageExpenseSize: z.number(),
    onTimePaymentRate: z.number()
  })),
  
  // Projections
  projectedTotal: z.number(),
  projectedOverage: z.number(),
  completionDate: z.string().optional(), // ISO date
  riskLevel: z.enum(['low', 'medium', 'high'])
})

export type BudgetAnalyticsResponse = z.infer<typeof BudgetAnalyticsResponseSchema>

// Paginated responses
export type BudgetCategoriesPaginatedResponse = PaginatedResponse<BudgetCategoryResponse>
export type BudgetExpensesPaginatedResponse = PaginatedResponse<BudgetExpenseResponse>

// Search/filter schemas
export const BudgetCategorySearchRequestSchema = z.object({
  search: z.string().optional(),
  categoryType: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'essential']).optional(),
  isEssential: z.boolean().optional(),
  isOverBudget: z.boolean().optional(),
  minAmount: z.number().min(0).optional(),
  maxAmount: z.number().min(0).optional(),
  needsByDateFrom: z.string().optional(),
  needsByDateTo: z.string().optional(),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(20),
  sortBy: z.enum(['name', 'plannedAmount', 'actualSpent', 'percentageUsed', 'priority', 'createdAt']).default('name'),
  sortOrder: z.enum(['asc', 'desc']).default('asc')
})

export type BudgetCategorySearchRequest = z.infer<typeof BudgetCategorySearchRequestSchema>

export const BudgetExpenseSearchRequestSchema = z.object({
  search: z.string().optional(),
  categoryId: z.string().uuid().optional(),
  vendorId: z.string().uuid().optional(),
  paymentStatus: z.enum([
    PaymentStatus.PENDING,
    PaymentStatus.PAID,
    PaymentStatus.PARTIAL,
    PaymentStatus.OVERDUE,
    PaymentStatus.CANCELLED,
    PaymentStatus.REFUNDED
  ]).optional(),
  paymentMethod: z.string().optional(),
  isPlanned: z.boolean().optional(),
  isRecurring: z.boolean().optional(),
  isOverdue: z.boolean().optional(),
  requiresApproval: z.boolean().optional(),
  minAmount: z.number().min(0).optional(),
  maxAmount: z.number().min(0).optional(),
  expenseDateFrom: z.string().optional(),
  expenseDateTo: z.string().optional(),
  dueDateFrom: z.string().optional(),
  dueDateTo: z.string().optional(),
  tags: z.array(z.string()).optional(),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(20),
  sortBy: z.enum(['description', 'amount', 'expenseDate', 'dueDate', 'paymentStatus', 'createdAt']).default('expenseDate'),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
})

export type BudgetExpenseSearchRequest = z.infer<typeof BudgetExpenseSearchRequestSchema>