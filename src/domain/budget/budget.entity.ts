import { BusinessError } from '@/core/errors'
import { Money } from '@/domain/vendor/vendor.entity'

// Budget-related enums
export enum BudgetPriority {
  ESSENTIAL = 'essential',
  IMPORTANT = 'important',
  NICE_TO_HAVE = 'nice_to_have'
}

export enum PaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  OVERDUE = 'overdue',
  CANCELLED = 'cancelled'
}

export enum ExpenseType {
  ESTIMATED = 'estimated',
  ACTUAL = 'actual',
  DEPOSIT = 'deposit',
  FINAL_PAYMENT = 'final_payment'
}

// Value objects
export class BudgetAllocation {
  constructor(
    public readonly allocated: Money,
    public readonly spent: Money = new Money(0, allocated.currency)
  ) {
    if (allocated.currency !== spent.currency) {
      throw new BusinessError('Currency mismatch in budget allocation')
    }
  }
  
  get remaining(): Money {
    try {
      return this.allocated.subtract(this.spent)
    } catch {
      // If spent > allocated, return negative amount
      return new Money(0, this.allocated.currency)
    }
  }
  
  get percentageUsed(): number {
    if (this.allocated.amount === 0) return 0
    return Math.round((this.spent.amount / this.allocated.amount) * 100)
  }
  
  get isOverBudget(): boolean {
    return this.spent.amount > this.allocated.amount
  }
  
  addExpense(amount: Money): BudgetAllocation {
    const newSpent = this.spent.add(amount)
    return new BudgetAllocation(this.allocated, newSpent)
  }
  
  updateAllocation(newAllocated: Money): BudgetAllocation {
    return new BudgetAllocation(newAllocated, this.spent)
  }
}

export class CategoryInfo {
  constructor(
    public readonly name: string,
    public readonly icon: string = '💰',
    public readonly color: string = '#667eea',
    public readonly priority: BudgetPriority = BudgetPriority.IMPORTANT
  ) {
    if (!name.trim()) {
      throw new BusinessError('Category name is required')
    }
    if (!color.match(/^#[0-9A-F]{6}$/i)) {
      throw new BusinessError('Invalid color format')
    }
  }
}

// Budget Category aggregate root
export class BudgetCategory {
  private _id: string
  private _coupleId: string
  private _info: CategoryInfo
  private _allocation: BudgetAllocation
  private _expenses: BudgetExpense[] = []
  private _createdAt: Date
  private _updatedAt: Date
  
  constructor(data: {
    id: string
    coupleId: string
    info: CategoryInfo
    allocation: BudgetAllocation
    expenses?: BudgetExpense[]
    createdAt?: Date
    updatedAt?: Date
  }) {
    this._id = data.id
    this._coupleId = data.coupleId
    this._info = data.info
    this._allocation = data.allocation
    this._expenses = data.expenses || []
    this._createdAt = data.createdAt || new Date()
    this._updatedAt = data.updatedAt || new Date()
  }
  
  // Getters
  get id(): string { return this._id }
  get coupleId(): string { return this._coupleId }
  get info(): CategoryInfo { return this._info }
  get allocation(): BudgetAllocation { return this._allocation }
  get expenses(): ReadonlyArray<BudgetExpense> { return [...this._expenses] }
  get createdAt(): Date { return this._createdAt }
  get updatedAt(): Date { return this._updatedAt }
  
  // Business methods
  updateInfo(info: CategoryInfo): void {
    this._info = info
    this._updatedAt = new Date()
  }
  
  updateAllocation(amount: Money): void {
    this._allocation = this._allocation.updateAllocation(amount)
    this._updatedAt = new Date()
  }
  
  addExpense(expense: BudgetExpense): void {
    // Validate expense belongs to this category
    if (expense.categoryId !== this._id) {
      throw new BusinessError('Expense does not belong to this category')
    }
    
    // Update spent amount if it's an actual expense
    if (expense.type === ExpenseType.ACTUAL || expense.type === ExpenseType.FINAL_PAYMENT) {
      this._allocation = this._allocation.addExpense(expense.amount)
    }
    
    this._expenses.push(expense)
    this._updatedAt = new Date()
  }
  
  removeExpense(expenseId: string): void {
    const expenseIndex = this._expenses.findIndex(e => e.id === expenseId)
    if (expenseIndex === -1) {
      throw new BusinessError('Expense not found')
    }
    
    const expense = this._expenses[expenseIndex]
    
    // Recalculate spent amount
    this.recalculateSpent()
    
    this._expenses.splice(expenseIndex, 1)
    this._updatedAt = new Date()
  }
  
  private recalculateSpent(): void {
    const totalSpent = this._expenses
      .filter(e => e.type === ExpenseType.ACTUAL || e.type === ExpenseType.FINAL_PAYMENT)
      .reduce((sum, e) => sum + e.amount.amount, 0)
    
    const spent = new Money(totalSpent, this._allocation.allocated.currency)
    this._allocation = new BudgetAllocation(this._allocation.allocated, spent)
  }
  
  // Domain logic
  getTotalEstimated(): Money {
    const total = this._expenses
      .filter(e => e.type === ExpenseType.ESTIMATED)
      .reduce((sum, e) => sum + e.amount.amount, 0)
    return new Money(total, this._allocation.allocated.currency)
  }
  
  getPendingPayments(): BudgetExpense[] {
    return this._expenses.filter(e => e.paymentStatus === PaymentStatus.PENDING)
  }
  
  getOverduePayments(): BudgetExpense[] {
    return this._expenses.filter(e => e.paymentStatus === PaymentStatus.OVERDUE)
  }
  
  getUtilizationStatus(): 'under' | 'on_track' | 'warning' | 'over' {
    const percentage = this._allocation.percentageUsed
    if (percentage < 70) return 'under'
    if (percentage <= 90) return 'on_track'
    if (percentage <= 100) return 'warning'
    return 'over'
  }
  
  // Convert to persistence model
  toPersistence(): any {
    return {
      id: this._id,
      coupleId: this._coupleId,
      name: this._info.name,
      icon: this._info.icon,
      color: this._info.color,
      priority: this._info.priority,
      allocatedAmount: this._allocation.allocated.amount,
      spentAmount: this._allocation.spent.amount,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt
    }
  }
  
  // Create from persistence model
  static fromPersistence(data: any, expenses: any[] = []): BudgetCategory {
    const budgetExpenses = expenses.map(e => BudgetExpense.fromPersistence(e))
    
    return new BudgetCategory({
      id: data.id,
      coupleId: data.coupleId,
      info: new CategoryInfo(
        data.name,
        data.icon,
        data.color,
        data.priority
      ),
      allocation: new BudgetAllocation(
        new Money(data.allocatedAmount || 0),
        new Money(data.spentAmount || 0)
      ),
      expenses: budgetExpenses,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt
    })
  }
}

// Budget Expense entity
export class BudgetExpense {
  private _id: string
  private _coupleId: string
  private _categoryId: string
  private _vendorId?: string
  private _vendorName?: string
  private _description: string
  private _amount: Money
  private _type: ExpenseType
  private _paymentStatus: PaymentStatus
  private _paymentMethod?: string
  private _dueDate?: Date
  private _paidDate?: Date
  private _receiptUrl?: string
  private _notes?: string
  private _createdAt: Date
  private _updatedAt: Date
  
  constructor(data: {
    id: string
    coupleId: string
    categoryId: string
    vendorId?: string
    vendorName?: string
    description: string
    amount: Money
    type: ExpenseType
    paymentStatus?: PaymentStatus
    paymentMethod?: string
    dueDate?: Date
    paidDate?: Date
    receiptUrl?: string
    notes?: string
    createdAt?: Date
    updatedAt?: Date
  }) {
    this._id = data.id
    this._coupleId = data.coupleId
    this._categoryId = data.categoryId
    this._vendorId = data.vendorId
    this._vendorName = data.vendorName
    this._description = data.description
    this._amount = data.amount
    this._type = data.type
    this._paymentStatus = data.paymentStatus || PaymentStatus.PENDING
    this._paymentMethod = data.paymentMethod
    this._dueDate = data.dueDate
    this._paidDate = data.paidDate
    this._receiptUrl = data.receiptUrl
    this._notes = data.notes
    this._createdAt = data.createdAt || new Date()
    this._updatedAt = data.updatedAt || new Date()
  }
  
  // Getters
  get id(): string { return this._id }
  get coupleId(): string { return this._coupleId }
  get categoryId(): string { return this._categoryId }
  get vendorId(): string | undefined { return this._vendorId }
  get vendorName(): string | undefined { return this._vendorName }
  get description(): string { return this._description }
  get amount(): Money { return this._amount }
  get type(): ExpenseType { return this._type }
  get paymentStatus(): PaymentStatus { return this._paymentStatus }
  get paymentMethod(): string | undefined { return this._paymentMethod }
  get dueDate(): Date | undefined { return this._dueDate }
  get paidDate(): Date | undefined { return this._paidDate }
  get receiptUrl(): string | undefined { return this._receiptUrl }
  get notes(): string | undefined { return this._notes }
  get createdAt(): Date { return this._createdAt }
  get updatedAt(): Date { return this._updatedAt }
  
  // Business methods
  markAsPaid(paidDate: Date = new Date(), paymentMethod?: string): void {
    if (this._paymentStatus === PaymentStatus.PAID) {
      throw new BusinessError('Expense is already paid')
    }
    
    this._paymentStatus = PaymentStatus.PAID
    this._paidDate = paidDate
    if (paymentMethod) {
      this._paymentMethod = paymentMethod
    }
    this._updatedAt = new Date()
  }
  
  markAsOverdue(): void {
    if (this._paymentStatus === PaymentStatus.PAID) {
      throw new BusinessError('Cannot mark paid expense as overdue')
    }
    
    this._paymentStatus = PaymentStatus.OVERDUE
    this._updatedAt = new Date()
  }
  
  updateAmount(amount: Money): void {
    this._amount = amount
    this._updatedAt = new Date()
  }
  
  attachReceipt(receiptUrl: string): void {
    this._receiptUrl = receiptUrl
    this._updatedAt = new Date()
  }
  
  // Domain logic
  isOverdue(): boolean {
    if (this._paymentStatus === PaymentStatus.PAID) return false
    if (!this._dueDate) return false
    return new Date() > this._dueDate
  }
  
  getDaysUntilDue(): number | null {
    if (!this._dueDate || this._paymentStatus === PaymentStatus.PAID) return null
    const days = Math.ceil(
      (this._dueDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    )
    return days
  }
  
  // Convert to persistence model
  toPersistence(): any {
    return {
      id: this._id,
      coupleId: this._coupleId,
      categoryId: this._categoryId,
      vendorId: this._vendorId,
      vendorName: this._vendorName,
      description: this._description,
      amount: this._amount.amount,
      expenseType: this._type,
      paymentStatus: this._paymentStatus,
      paymentMethod: this._paymentMethod,
      dueDate: this._dueDate,
      paidDate: this._paidDate,
      receiptUrl: this._receiptUrl,
      notes: this._notes,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt
    }
  }
  
  // Create from persistence model
  static fromPersistence(data: any): BudgetExpense {
    return new BudgetExpense({
      id: data.id,
      coupleId: data.coupleId,
      categoryId: data.categoryId,
      vendorId: data.vendorId,
      vendorName: data.vendorName,
      description: data.description,
      amount: new Money(data.amount || 0),
      type: data.expenseType,
      paymentStatus: data.paymentStatus,
      paymentMethod: data.paymentMethod,
      dueDate: data.dueDate,
      paidDate: data.paidDate,
      receiptUrl: data.receiptUrl,
      notes: data.notes,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt
    })
  }
}