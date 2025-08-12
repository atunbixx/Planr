import { z } from 'zod'
import { BusinessError } from '@/core/errors'

// Vendor status enum
export enum VendorStatus {
  POTENTIAL = 'potential',
  CONTACTED = 'contacted',
  QUOTE_REQUESTED = 'quote_requested',
  IN_DISCUSSION = 'in_discussion',
  BOOKED = 'booked',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed'
}

// Vendor value objects
export class Money {
  constructor(
    public readonly amount: number,
    public readonly currency: string = 'USD'
  ) {
    if (amount < 0) {
      throw new BusinessError('Amount cannot be negative')
    }
  }
  
  add(other: Money): Money {
    if (this.currency !== other.currency) {
      throw new BusinessError('Cannot add money with different currencies')
    }
    return new Money(this.amount + other.amount, this.currency)
  }
  
  subtract(other: Money): Money {
    if (this.currency !== other.currency) {
      throw new BusinessError('Cannot subtract money with different currencies')
    }
    if (this.amount < other.amount) {
      throw new BusinessError('Insufficient funds')
    }
    return new Money(this.amount - other.amount, this.currency)
  }
  
  equals(other: Money): boolean {
    return this.amount === other.amount && this.currency === other.currency
  }
}

export class ContactInfo {
  constructor(
    public readonly name?: string,
    public readonly email?: string,
    public readonly phone?: string,
    public readonly website?: string
  ) {
    if (email && !z.string().email().safeParse(email).success) {
      throw new BusinessError('Invalid email format')
    }
    if (website && !z.string().url().safeParse(website).success) {
      throw new BusinessError('Invalid website URL')
    }
  }
}

// Vendor aggregate root
export class Vendor {
  private _id: string
  private _coupleId: string
  private _categoryId: string
  private _businessName: string
  private _contactInfo: ContactInfo
  private _status: VendorStatus
  private _estimatedCost?: Money
  private _actualCost?: Money
  private _contractSigned: boolean
  private _notes?: string
  private _createdAt: Date
  private _updatedAt: Date
  
  constructor(data: {
    id: string
    coupleId: string
    categoryId: string
    businessName: string
    contactInfo: ContactInfo
    status?: VendorStatus
    estimatedCost?: Money
    actualCost?: Money
    contractSigned?: boolean
    notes?: string
    createdAt?: Date
    updatedAt?: Date
  }) {
    this._id = data.id
    this._coupleId = data.coupleId
    this._categoryId = data.categoryId
    this._businessName = data.businessName
    this._contactInfo = data.contactInfo
    this._status = data.status || VendorStatus.POTENTIAL
    this._estimatedCost = data.estimatedCost
    this._actualCost = data.actualCost
    this._contractSigned = data.contractSigned || false
    this._notes = data.notes
    this._createdAt = data.createdAt || new Date()
    this._updatedAt = data.updatedAt || new Date()
  }
  
  // Getters
  get id(): string { return this._id }
  get coupleId(): string { return this._coupleId }
  get categoryId(): string { return this._categoryId }
  get businessName(): string { return this._businessName }
  get contactInfo(): ContactInfo { return this._contactInfo }
  get status(): VendorStatus { return this._status }
  get estimatedCost(): Money | undefined { return this._estimatedCost }
  get actualCost(): Money | undefined { return this._actualCost }
  get contractSigned(): boolean { return this._contractSigned }
  get notes(): string | undefined { return this._notes }
  get createdAt(): Date { return this._createdAt }
  get updatedAt(): Date { return this._updatedAt }
  
  // Business methods
  updateContactInfo(contactInfo: ContactInfo): void {
    this._contactInfo = contactInfo
    this._updatedAt = new Date()
  }
  
  updateStatus(status: VendorStatus): void {
    // Validate state transitions
    if (!this.isValidStatusTransition(this._status, status)) {
      throw new BusinessError(
        `Invalid status transition from ${this._status} to ${status}`
      )
    }
    
    this._status = status
    this._updatedAt = new Date()
    
    // Auto-update contract status for booked vendors
    if (status === VendorStatus.BOOKED && !this._contractSigned) {
      this._contractSigned = true
    }
  }
  
  setEstimatedCost(cost: Money): void {
    if (this._actualCost && cost.amount > this._actualCost.amount) {
      throw new BusinessError(
        'Estimated cost cannot be higher than actual cost'
      )
    }
    this._estimatedCost = cost
    this._updatedAt = new Date()
  }
  
  setActualCost(cost: Money): void {
    this._actualCost = cost
    this._updatedAt = new Date()
  }
  
  signContract(): void {
    if (this._status !== VendorStatus.BOOKED) {
      throw new BusinessError(
        'Can only sign contract for booked vendors'
      )
    }
    this._contractSigned = true
    this._updatedAt = new Date()
  }
  
  cancel(reason?: string): void {
    if (this._status === VendorStatus.COMPLETED) {
      throw new BusinessError('Cannot cancel completed vendor')
    }
    
    this._status = VendorStatus.CANCELLED
    if (reason) {
      this._notes = `${this._notes || ''}\nCancellation reason: ${reason}`
    }
    this._updatedAt = new Date()
  }
  
  // Domain logic
  private isValidStatusTransition(from: VendorStatus, to: VendorStatus): boolean {
    const validTransitions: Record<VendorStatus, VendorStatus[]> = {
      [VendorStatus.POTENTIAL]: [
        VendorStatus.CONTACTED,
        VendorStatus.CANCELLED
      ],
      [VendorStatus.CONTACTED]: [
        VendorStatus.QUOTE_REQUESTED,
        VendorStatus.IN_DISCUSSION,
        VendorStatus.CANCELLED
      ],
      [VendorStatus.QUOTE_REQUESTED]: [
        VendorStatus.IN_DISCUSSION,
        VendorStatus.BOOKED,
        VendorStatus.CANCELLED
      ],
      [VendorStatus.IN_DISCUSSION]: [
        VendorStatus.BOOKED,
        VendorStatus.CANCELLED
      ],
      [VendorStatus.BOOKED]: [
        VendorStatus.COMPLETED,
        VendorStatus.CANCELLED
      ],
      [VendorStatus.CANCELLED]: [],
      [VendorStatus.COMPLETED]: []
    }
    
    return validTransitions[from].includes(to)
  }
  
  // Calculate cost variance
  getCostVariance(): Money | null {
    if (!this._estimatedCost || !this._actualCost) {
      return null
    }
    
    try {
      return this._actualCost.subtract(this._estimatedCost)
    } catch {
      // If actual < estimated, return negative variance
      const variance = this._estimatedCost.amount - this._actualCost.amount
      return new Money(Math.abs(variance), this._estimatedCost.currency)
    }
  }
  
  // Check if vendor is active
  isActive(): boolean {
    return ![
      VendorStatus.CANCELLED,
      VendorStatus.COMPLETED
    ].includes(this._status)
  }
  
  // Convert to persistence model
  toPersistence(): any {
    return {
      id: this._id,
      coupleId: this._coupleId,
      categoryId: this._categoryId,
      name: this._businessName,
      contactName: this._contactInfo.name,
      email: this._contactInfo.email,
      phone: this._contactInfo.phone,
      website: this._contactInfo.website,
      status: this._status,
      estimatedCost: this._estimatedCost?.amount,
      actualCost: this._actualCost?.amount,
      contractSigned: this._contractSigned,
      notes: this._notes,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt
    }
  }
  
  // Create from persistence model
  static fromPersistence(data: any): Vendor {
    return new Vendor({
      id: data.id,
      coupleId: data.coupleId,
      categoryId: data.categoryId,
      businessName: data.name,
      contactInfo: new ContactInfo(
        data.contactName,
        data.email,
        data.phone,
        data.website
      ),
      status: data.status,
      estimatedCost: data.estimatedCost ? new Money(data.estimatedCost) : undefined,
      actualCost: data.actualCost ? new Money(data.actualCost) : undefined,
      contractSigned: data.contractSigned,
      notes: data.notes,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt
    })
  }
}