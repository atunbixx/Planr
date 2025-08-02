// =============================================
// BUDGET MANAGEMENT SYSTEM TYPES
// =============================================

// Enums
export type ExpenseStatus = 'planned' | 'committed' | 'partial' | 'paid' | 'cancelled' | 'refunded';

export type PaymentMethod = 
  | 'cash' 
  | 'check' 
  | 'credit_card' 
  | 'debit_card' 
  | 'bank_transfer' 
  | 'paypal' 
  | 'venmo' 
  | 'zelle' 
  | 'gift' 
  | 'other';

export type TransactionType = 'payment' | 'refund' | 'adjustment';

export type RecommendationType = 
  | 'overspend_warning' 
  | 'savings_opportunity' 
  | 'reallocation' 
  | 'vendor_alternative' 
  | 'timing_adjustment' 
  | 'package_downgrade';

export type Severity = 'info' | 'warning' | 'critical';

export type RuleType = 
  | 'category_limit' 
  | 'total_limit' 
  | 'payment_reminder' 
  | 'milestone_reached';

export type OptimizationType = 
  | 'vendor_alternative' 
  | 'timing_adjustment' 
  | 'package_downgrade' 
  | 'bulk_discount' 
  | 'seasonal_pricing';

// Core Types
export interface BudgetPeriod {
  id: string;
  couple_id: string;
  name: string;
  start_date: string;
  end_date: string;
  total_budget: number;
  currency: string;
  is_active: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface BudgetCategoryType {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  display_order: number;
  is_system: boolean;
  created_at: string;
}

export interface BudgetAllocation {
  id: string;
  period_id: string;
  category_type_id: string;
  allocated_amount: number;
  allocated_percentage?: number;
  priority: number;
  is_flexible: boolean;
  minimum_amount: number;
  maximum_amount?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
  // Joined data
  category_type?: BudgetCategoryType;
}

export interface BudgetItem {
  id: string;
  couple_id: string;
  period_id: string;
  category_type_id: string;
  vendor_id?: string;
  name: string;
  description?: string;
  estimated_amount: number;
  contracted_amount?: number;
  final_amount?: number;
  status: ExpenseStatus;
  due_date?: string;
  contract_date?: string;
  service_date?: string;
  is_deposit: boolean;
  is_gratuity: boolean;
  is_tax_included: boolean;
  requires_contract: boolean;
  contract_signed: boolean;
  tags?: string[];
  attachments?: Attachment[];
  created_at: string;
  updated_at: string;
  created_by?: string;
  // Joined data
  category_type?: BudgetCategoryType;
  vendor?: any; // Replace with Vendor type
  transactions?: BudgetTransaction[];
}

export interface BudgetTransaction {
  id: string;
  couple_id: string;
  budget_item_id: string;
  amount: number;
  transaction_type: TransactionType;
  payment_method?: PaymentMethod;
  payment_date: string;
  check_number?: string;
  reference_number?: string;
  card_last_four?: string;
  paid_by?: string;
  receipt_url?: string;
  notes?: string;
  is_reconciled: boolean;
  reconciled_date?: string;
  reconciled_by?: string;
  created_at: string;
  created_by?: string;
}

export interface BudgetSnapshot {
  id: string;
  couple_id: string;
  period_id: string;
  snapshot_date: string;
  total_budget: number;
  total_allocated: number;
  total_spent: number;
  total_committed: number;
  total_remaining: number;
  category_breakdown: CategoryBreakdown[];
  budget_health_score?: number;
  days_until_wedding?: number;
  created_at: string;
}

export interface BudgetRecommendation {
  id: string;
  couple_id: string;
  category_type_id?: string;
  recommendation_type: RecommendationType;
  severity: Severity;
  title: string;
  description: string;
  suggested_action?: string;
  potential_savings?: number;
  is_dismissed: boolean;
  dismissed_at?: string;
  is_applied: boolean;
  applied_at?: string;
  expires_at?: string;
  created_at: string;
}

export interface VendorPackage {
  id: string;
  vendor_id: string;
  package_name: string;
  description?: string;
  base_price: number;
  is_starting_price: boolean;
  included_items: string[];
  add_on_items: AddOnItem[];
  minimum_guests?: number;
  maximum_guests?: number;
  minimum_hours?: number;
  is_active: boolean;
  valid_from?: string;
  valid_until?: string;
  created_at: string;
  updated_at: string;
}

export interface VendorQuote {
  id: string;
  couple_id: string;
  vendor_id: string;
  package_id?: string;
  quote_number?: string;
  quote_date: string;
  valid_until?: string;
  base_amount: number;
  discount_amount: number;
  tax_amount: number;
  gratuity_amount: number;
  total_amount: number;
  custom_items: CustomItem[];
  deposit_amount?: number;
  deposit_due_date?: string;
  payment_schedule: PaymentScheduleItem[];
  is_accepted: boolean;
  accepted_date?: string;
  quote_document_url?: string;
  contract_url?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  // Joined data
  vendor?: any; // Replace with Vendor type
  package?: VendorPackage;
}

export interface BudgetRule {
  id: string;
  couple_id: string;
  rule_name: string;
  rule_type: RuleType;
  category_type_id?: string;
  threshold_percentage?: number;
  threshold_amount?: number;
  days_before_due?: number;
  send_email: boolean;
  send_push: boolean;
  block_new_expenses: boolean;
  is_active: boolean;
  last_triggered?: string;
  trigger_count: number;
  created_at: string;
  updated_at: string;
}

export interface BudgetOptimization {
  id: string;
  couple_id: string;
  optimization_type: OptimizationType;
  category_type_id?: string;
  current_scenario: any;
  suggested_scenario: any;
  potential_savings: number;
  confidence_score: number;
  is_reviewed: boolean;
  is_accepted: boolean;
  reviewed_at?: string;
  feedback?: string;
  created_at: string;
}

// Helper Types
export interface Attachment {
  url: string;
  name: string;
  type: string;
  size?: number;
}

export interface AddOnItem {
  name: string;
  price: number;
  description?: string;
}

export interface CustomItem {
  description: string;
  amount: number;
}

export interface PaymentScheduleItem {
  amount: number;
  due_date: string;
  description: string;
}

export interface CategoryBreakdown {
  category_type_id: string;
  category_name: string;
  allocated_amount: number;
  spent_amount: number;
  committed_amount: number;
  remaining_amount: number;
  percentage_used: number;
}

// View Types
export interface BudgetOverview {
  period_id: string;
  couple_id: string;
  period_name: string;
  total_budget: number;
  currency: string;
  is_active: boolean;
  total_allocated: number;
  unallocated: number;
  total_items: number;
  paid_items: number;
  total_paid: number;
  total_committed: number;
}

export interface CategorySpending {
  allocation_id: string;
  couple_id: string;
  period_id: string;
  category_type_id: string;
  category_name: string;
  icon?: string;
  color?: string;
  allocated_amount: number;
  allocated_percentage?: number;
  item_count: number;
  spent_amount: number;
  committed_amount: number;
  remaining_amount: number;
}

// Request/Response Types
export interface CreateBudgetPeriodRequest {
  couple_id: string;
  name: string;
  start_date: string;
  end_date: string;
  total_budget: number;
  currency?: string;
  notes?: string;
}

export interface CreateBudgetItemRequest {
  couple_id: string;
  period_id: string;
  category_type_id: string;
  vendor_id?: string;
  name: string;
  description?: string;
  estimated_amount: number;
  due_date?: string;
  is_deposit?: boolean;
  is_gratuity?: boolean;
  is_tax_included?: boolean;
  requires_contract?: boolean;
  tags?: string[];
}

export interface RecordPaymentRequest {
  couple_id: string;
  budget_item_id: string;
  amount: number;
  payment_method: PaymentMethod;
  payment_date?: string;
  check_number?: string;
  reference_number?: string;
  card_last_four?: string;
  paid_by?: string;
  receipt_url?: string;
  notes?: string;
}

export interface BudgetSummary {
  overview: BudgetOverview;
  categories: CategorySpending[];
  recent_transactions: BudgetTransaction[];
  active_recommendations: BudgetRecommendation[];
  upcoming_payments: BudgetItem[];
}

// Utility Types
export type BudgetHealthStatus = 'excellent' | 'good' | 'warning' | 'critical';

export interface BudgetHealth {
  status: BudgetHealthStatus;
  score: number;
  factors: {
    budget_utilization: number;
    payment_timeliness: number;
    category_balance: number;
    savings_achieved: number;
  };
}