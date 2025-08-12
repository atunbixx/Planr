import { z } from 'zod'
import { BusinessError } from '@/core/errors'

// Guest-related enums
export enum AttendingStatus {
  PENDING = 'pending',
  YES = 'yes',
  NO = 'no',
  MAYBE = 'maybe'
}

export enum GuestSide {
  PARTNER1 = 'partner1',
  PARTNER2 = 'partner2',
  BOTH = 'both'
}

export enum MealPreference {
  STANDARD = 'standard',
  VEGETARIAN = 'vegetarian',
  VEGAN = 'vegan',
  GLUTEN_FREE = 'gluten_free',
  KOSHER = 'kosher',
  HALAL = 'halal',
  OTHER = 'other'
}

// Value objects
export class PersonName {
  constructor(
    public readonly firstName: string,
    public readonly lastName: string
  ) {
    if (!firstName.trim()) {
      throw new BusinessError('First name is required')
    }
    if (!lastName.trim()) {
      throw new BusinessError('Last name is required')
    }
  }
  
  get fullName(): string {
    return `${this.firstName} ${this.lastName}`
  }
  
  get initials(): string {
    return `${this.firstName[0]}${this.lastName[0]}`.toUpperCase()
  }
  
  equals(other: PersonName): boolean {
    return this.firstName === other.firstName && this.lastName === other.lastName
  }
}

export class ContactDetails {
  constructor(
    public readonly email?: string,
    public readonly phone?: string,
    public readonly address?: string
  ) {
    if (email && !z.string().email().safeParse(email).success) {
      throw new BusinessError('Invalid email format')
    }
  }
  
  hasContactInfo(): boolean {
    return !!(this.email || this.phone || this.address)
  }
}

export class DietaryInfo {
  constructor(
    public readonly preference: MealPreference = MealPreference.STANDARD,
    public readonly restrictions?: string,
    public readonly allergies?: string[]
  ) {}
  
  hasSpecialRequirements(): boolean {
    return this.preference !== MealPreference.STANDARD || 
           !!this.restrictions || 
           (this.allergies?.length ?? 0) > 0
  }
  
  getAllRestrictions(): string[] {
    const restrictions: string[] = []
    if (this.preference !== MealPreference.STANDARD) {
      restrictions.push(this.preference)
    }
    if (this.restrictions) {
      restrictions.push(this.restrictions)
    }
    if (this.allergies) {
      restrictions.push(...this.allergies)
    }
    return restrictions
  }
}

// Guest aggregate root
export class Guest {
  private _id: string
  private _coupleId: string
  private _name: PersonName
  private _contactDetails: ContactDetails
  private _side: GuestSide
  private _relationship?: string
  private _tableNumber?: number
  private _attendingStatus: AttendingStatus
  private _plusOneAllowed: boolean
  private _plusOneName?: PersonName
  private _dietaryInfo: DietaryInfo
  private _notes?: string
  private _invitationSent: boolean
  private _invitationSentAt?: Date
  private _rsvpReceivedAt?: Date
  private _createdAt: Date
  private _updatedAt: Date
  
  constructor(data: {
    id: string
    coupleId: string
    name: PersonName
    contactDetails: ContactDetails
    side: GuestSide
    relationship?: string
    tableNumber?: number
    attendingStatus?: AttendingStatus
    plusOneAllowed?: boolean
    plusOneName?: PersonName
    dietaryInfo?: DietaryInfo
    notes?: string
    invitationSent?: boolean
    invitationSentAt?: Date
    rsvpReceivedAt?: Date
    createdAt?: Date
    updatedAt?: Date
  }) {
    this._id = data.id
    this._coupleId = data.coupleId
    this._name = data.name
    this._contactDetails = data.contactDetails
    this._side = data.side
    this._relationship = data.relationship
    this._tableNumber = data.tableNumber
    this._attendingStatus = data.attendingStatus || AttendingStatus.PENDING
    this._plusOneAllowed = data.plusOneAllowed || false
    this._plusOneName = data.plusOneName
    this._dietaryInfo = data.dietaryInfo || new DietaryInfo()
    this._notes = data.notes
    this._invitationSent = data.invitationSent || false
    this._invitationSentAt = data.invitationSentAt
    this._rsvpReceivedAt = data.rsvpReceivedAt
    this._createdAt = data.createdAt || new Date()
    this._updatedAt = data.updatedAt || new Date()
  }
  
  // Getters
  get id(): string { return this._id }
  get coupleId(): string { return this._coupleId }
  get name(): PersonName { return this._name }
  get contactDetails(): ContactDetails { return this._contactDetails }
  get side(): GuestSide { return this._side }
  get relationship(): string | undefined { return this._relationship }
  get tableNumber(): number | undefined { return this._tableNumber }
  get attendingStatus(): AttendingStatus { return this._attendingStatus }
  get plusOneAllowed(): boolean { return this._plusOneAllowed }
  get plusOneName(): PersonName | undefined { return this._plusOneName }
  get dietaryInfo(): DietaryInfo { return this._dietaryInfo }
  get notes(): string | undefined { return this._notes }
  get invitationSent(): boolean { return this._invitationSent }
  get invitationSentAt(): Date | undefined { return this._invitationSentAt }
  get rsvpReceivedAt(): Date | undefined { return this._rsvpReceivedAt }
  get createdAt(): Date { return this._createdAt }
  get updatedAt(): Date { return this._updatedAt }
  
  // Business methods
  updateContactDetails(contactDetails: ContactDetails): void {
    this._contactDetails = contactDetails
    this._updatedAt = new Date()
  }
  
  updateDietaryInfo(dietaryInfo: DietaryInfo): void {
    this._dietaryInfo = dietaryInfo
    this._updatedAt = new Date()
  }
  
  assignToTable(tableNumber: number): void {
    if (tableNumber < 1) {
      throw new BusinessError('Table number must be positive')
    }
    this._tableNumber = tableNumber
    this._updatedAt = new Date()
  }
  
  removeFromTable(): void {
    this._tableNumber = undefined
    this._updatedAt = new Date()
  }
  
  allowPlusOne(allowed: boolean = true): void {
    this._plusOneAllowed = allowed
    if (!allowed) {
      this._plusOneName = undefined
    }
    this._updatedAt = new Date()
  }
  
  setPlusOneName(name: PersonName): void {
    if (!this._plusOneAllowed) {
      throw new BusinessError('Plus one is not allowed for this guest')
    }
    this._plusOneName = name
    this._updatedAt = new Date()
  }
  
  markInvitationSent(): void {
    this._invitationSent = true
    this._invitationSentAt = new Date()
    this._updatedAt = new Date()
  }
  
  recordRsvp(status: AttendingStatus, plusOneAttending?: boolean): void {
    const previousStatus = this._attendingStatus
    this._attendingStatus = status
    this._rsvpReceivedAt = new Date()
    
    // If declining, remove plus one
    if (status === AttendingStatus.NO) {
      this._plusOneName = undefined
    }
    
    // If plus one explicitly not attending, remove name
    if (plusOneAttending === false) {
      this._plusOneName = undefined
    }
    
    this._updatedAt = new Date()
    
    // Log status change
    if (previousStatus !== status) {
      const note = `RSVP status changed from ${previousStatus} to ${status}`
      this._notes = this._notes ? `${this._notes}\n${note}` : note
    }
  }
  
  // Domain logic
  getTotalAttending(): number {
    if (this._attendingStatus !== AttendingStatus.YES) {
      return 0
    }
    return 1 + (this._plusOneName ? 1 : 0)
  }
  
  canSendInvitation(): boolean {
    return !this._invitationSent && this._contactDetails.hasContactInfo()
  }
  
  hasResponded(): boolean {
    return !!this._rsvpReceivedAt
  }
  
  isAttending(): boolean {
    return this._attendingStatus === AttendingStatus.YES
  }
  
  needsFollowUp(): boolean {
    return this._invitationSent && 
           !this.hasResponded() && 
           this._attendingStatus === AttendingStatus.PENDING
  }
  
  getDaysSinceInvitation(): number | null {
    if (!this._invitationSentAt) return null
    const days = Math.floor(
      (new Date().getTime() - this._invitationSentAt.getTime()) / (1000 * 60 * 60 * 24)
    )
    return days
  }
  
  // Convert to persistence model
  toPersistence(): any {
    return {
      id: this._id,
      coupleId: this._coupleId,
      firstName: this._name.firstName,
      lastName: this._name.lastName,
      email: this._contactDetails.email,
      phone: this._contactDetails.phone,
      address: this._contactDetails.address,
      side: this._side,
      relationship: this._relationship,
      tableNumber: this._tableNumber,
      attendingStatus: this._attendingStatus,
      plusOneAllowed: this._plusOneAllowed,
      plusOneName: this._plusOneName ? this._plusOneName.fullName : undefined,
      mealPreference: this._dietaryInfo.preference,
      dietaryRestrictions: this._dietaryInfo.restrictions,
      allergies: this._dietaryInfo.allergies,
      notes: this._notes,
      invitationSent: this._invitationSent,
      invitationSentAt: this._invitationSentAt,
      rsvpReceivedAt: this._rsvpReceivedAt,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt
    }
  }
  
  // Create from persistence model
  static fromPersistence(data: any): Guest {
    let plusOneName: PersonName | undefined
    if (data.plusOneName) {
      const parts = data.plusOneName.split(' ')
      if (parts.length >= 2) {
        plusOneName = new PersonName(parts[0], parts.slice(1).join(' '))
      }
    }
    
    return new Guest({
      id: data.id,
      coupleId: data.coupleId,
      name: new PersonName(data.firstName, data.lastName),
      contactDetails: new ContactDetails(data.email, data.phone, data.address),
      side: data.side,
      relationship: data.relationship,
      tableNumber: data.tableNumber,
      attendingStatus: data.attendingStatus,
      plusOneAllowed: data.plusOneAllowed,
      plusOneName,
      dietaryInfo: new DietaryInfo(
        data.mealPreference,
        data.dietaryRestrictions,
        data.allergies
      ),
      notes: data.notes,
      invitationSent: data.invitationSent,
      invitationSentAt: data.invitationSentAt,
      rsvpReceivedAt: data.rsvpReceivedAt,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt
    })
  }
}