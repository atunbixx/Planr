/**
 * Guest Service - Use-case orchestration with transaction boundaries
 */

import { withTransaction } from '@/core/db/transaction'
import { GuestRepository } from '@/lib/repositories/GuestRepository'
import { CoupleRepository } from '@/lib/repositories/CoupleRepository'
import { hasPermission } from '@/core/auth/permissions'
import { 
  CreateGuestRequest, 
  UpdateGuestRequest, 
  GuestSearchRequest, 
  BulkCreateGuestsRequest,
  BulkUpdateGuestsRequest,
  TableAssignmentUpdate,
  RsvpUpdateRequest
} from '../dto'
import { 
  GuestResponse, 
  GuestSummaryResponse, 
  GuestStatsResponse, 
  GuestsPaginatedResponse,
  TableAssignmentResponse,
  ImportValidationResult
} from '../dto'
import { ApiError } from '@/shared/validation/errors'
import { generateId, generateInvitationCode } from '@/shared/utils/id'
import { getCurrentUser } from '@/core/auth/user'

export class GuestService {
  private guestRepo = new GuestRepository()
  private coupleRepo = new CoupleRepository()

  /**
   * Create a new guest
   * Use Case: User adds a guest to their wedding
   */
  async createGuest(request: CreateGuestRequest): Promise<GuestResponse> {
    return withTransaction(async (tx) => {
      const user = await getCurrentUser()
      if (!user) {
        throw new ApiError('Unauthorized', 401)
      }

      // Get user's couple profile
      const couple = await this.coupleRepo.findByUserId(user.id)
      if (!couple) {
        throw new ApiError('Couple profile not found. Please complete onboarding first.', 404)
      }

      // Check for duplicate guest by name and email
      const existingGuest = await this.guestRepo.findByCoupleAndNameEmail(
        couple.id, 
        request.name, 
        request.email
      )
      if (existingGuest) {
        throw new ApiError('Guest with this name and email already exists', 409)
      }

      // Create guest data
      const guestData = {
        ...request,
        id: generateId(),
        coupleId: couple.id,
        invitationCode: generateInvitationCode(),
        createdAt: new Date(),
        updatedAt: new Date()
      }

      // Save to database
      const guest = await this.guestRepo.create(guestData, tx)
      
      return this.mapToResponse(guest)
    })
  }

  /**
   * Bulk create guests
   * Use Case: Import guests from CSV/Excel
   */
  async bulkCreateGuests(request: BulkCreateGuestsRequest): Promise<{ 
    created: GuestSummaryResponse[],
    errors: ImportValidationResult 
  }> {
    return withTransaction(async (tx) => {
      const user = await getCurrentUser()
      if (!user) {
        throw new ApiError('Unauthorized', 401)
      }

      const couple = await this.coupleRepo.findByUserId(user.id)
      if (!couple) {
        throw new ApiError('Couple profile not found', 404)
      }

      // Validate guests and check for duplicates
      const validation = await this.validateGuestImport(couple.id, request.guests)
      
      if (request.validateOnly) {
        return { created: [], errors: validation }
      }

      if (validation.invalidRows > 0 && !request.overwriteExisting) {
        throw new ApiError('Import contains errors. Please fix or enable overwrite.', 400)
      }

      const createdGuests: any[] = []
      const errors = [...validation.errors]

      // Process valid guests
      for (let i = 0; i < request.guests.length; i++) {
        const guestRequest = request.guests[i]
        
        try {
          const existingGuest = await this.guestRepo.findByCoupleAndNameEmail(
            couple.id, 
            guestRequest.name, 
            guestRequest.email
          )

          if (existingGuest && !request.overwriteExisting) {
            errors.push({
              row: i + 1,
              message: 'Guest already exists',
              data: guestRequest
            })
            continue
          }

          const guestData = {
            ...guestRequest,
            id: generateId(),
            coupleId: couple.id,
            invitationCode: generateInvitationCode(),
            createdAt: new Date(),
            updatedAt: new Date()
          }

          const guest = existingGuest && request.overwriteExisting
            ? await this.guestRepo.update(existingGuest.id, guestData, tx)
            : await this.guestRepo.create(guestData, tx)

          createdGuests.push(guest)
        } catch (error) {
          errors.push({
            row: i + 1,
            message: error instanceof Error ? error.message : 'Unknown error',
            data: guestRequest
          })
        }
      }

      return {
        created: createdGuests.map(guest => this.mapToSummaryResponse(guest)),
        errors: {
          ...validation,
          errors
        }
      }
    })
  }

  /**
   * Get guest by ID
   * Use Case: View guest details
   */
  async getGuestById(guestId: string): Promise<GuestResponse> {
    const user = await getCurrentUser()
    if (!user) {
      throw new ApiError('Unauthorized', 401)
    }

    const guest = await this.guestRepo.findById(guestId)
    if (!guest) {
      throw new ApiError('Guest not found', 404)
    }

    // Check ownership
    const couple = await this.coupleRepo.findByUserId(user.id)
    if (!couple || (guest.coupleId !== couple.id && !hasPermission(user, 'guest:read_all'))) {
      throw new ApiError('Forbidden', 403)
    }

    return this.mapToResponse(guest)
  }

  /**
   * Update guest
   * Use Case: Update guest details, RSVP status, table assignment, etc.
   */
  async updateGuest(guestId: string, request: UpdateGuestRequest): Promise<GuestResponse> {
    return withTransaction(async (tx) => {
      const user = await getCurrentUser()
      if (!user) {
        throw new ApiError('Unauthorized', 401)
      }

      // Verify ownership
      const existingGuest = await this.guestRepo.findById(guestId)
      if (!existingGuest) {
        throw new ApiError('Guest not found', 404)
      }

      const couple = await this.coupleRepo.findByUserId(user.id)
      if (!couple || (existingGuest.coupleId !== couple.id && !hasPermission(user, 'guest:write_all'))) {
        throw new ApiError('Forbidden', 403)
      }

      // Check for name/email conflicts if those are being updated
      if (request.name || request.email) {
        const name = request.name || existingGuest.name
        const email = request.email || existingGuest.email
        
        const conflictGuest = await this.guestRepo.findByCoupleAndNameEmail(
          existingGuest.coupleId,
          name,
          email
        )
        
        if (conflictGuest && conflictGuest.id !== guestId) {
          throw new ApiError('Guest with this name and email already exists', 409)
        }
      }

      // Auto-set RSVP date if status is being updated
      const updateData = {
        ...request,
        ...(request.rsvpStatus && !existingGuest.rsvpDate ? { rsvpDate: new Date().toISOString() } : {}),
        updatedAt: new Date()
      }

      const updatedGuest = await this.guestRepo.update(guestId, updateData, tx)
      return this.mapToResponse(updatedGuest)
    })
  }

  /**
   * Update RSVP status
   * Use Case: Guest responds to invitation via public link
   */
  async updateRsvp(invitationCode: string, request: RsvpUpdateRequest): Promise<GuestResponse> {
    return withTransaction(async (tx) => {
      const guest = await this.guestRepo.findByInvitationCode(invitationCode)
      if (!guest) {
        throw new ApiError('Invalid invitation code', 404)
      }

      const updateData = {
        rsvpStatus: request.rsvpStatus,
        rsvpDate: new Date().toISOString(),
        ceremonyAttending: request.ceremonyAttending ?? guest.ceremonyAttending,
        receptionAttending: request.receptionAttending ?? guest.receptionAttending,
        dietaryRestrictions: request.dietaryRestrictions ?? guest.dietaryRestrictions,
        mealChoice: request.mealChoice,
        allergies: request.allergies,
        plusOneName: request.plusOneName,
        plusOneEmail: request.plusOneEmail,
        rsvpNotes: request.notes,
        updatedAt: new Date()
      }

      const updatedGuest = await this.guestRepo.update(guest.id, updateData, tx)
      return this.mapToResponse(updatedGuest)
    })
  }

  /**
   * Delete guest
   * Use Case: Remove guest from wedding
   */
  async deleteGuest(guestId: string): Promise<void> {
    return withTransaction(async (tx) => {
      const user = await getCurrentUser()
      if (!user) {
        throw new ApiError('Unauthorized', 401)
      }

      // Verify ownership
      const guest = await this.guestRepo.findById(guestId)
      if (!guest) {
        throw new ApiError('Guest not found', 404)
      }

      const couple = await this.coupleRepo.findByUserId(user.id)
      if (!couple || (guest.coupleId !== couple.id && !hasPermission(user, 'guest:delete_all'))) {
        throw new ApiError('Forbidden', 403)
      }

      await this.guestRepo.delete(guestId, tx)
    })
  }

  /**
   * Get guests for current user's couple
   * Use Case: Load guest list on guests page
   */
  async getGuestsForCouple(searchRequest?: Partial<GuestSearchRequest>): Promise<GuestsPaginatedResponse> {
    const user = await getCurrentUser()
    if (!user) {
      throw new ApiError('Unauthorized', 401)
    }

    const couple = await this.coupleRepo.findByUserId(user.id)
    if (!couple) {
      throw new ApiError('Couple profile not found', 404)
    }

    const searchParams = {
      ...searchRequest,
      coupleId: couple.id
    }

    const result = await this.guestRepo.search(searchParams)
    
    return {
      data: result.data.map(guest => this.mapToSummaryResponse(guest)),
      pagination: result.pagination
    }
  }

  /**
   * Get guest statistics
   * Use Case: Dashboard analytics, RSVP tracking
   */
  async getGuestStats(): Promise<GuestStatsResponse> {
    const user = await getCurrentUser()
    if (!user) {
      throw new ApiError('Unauthorized', 401)
    }

    const couple = await this.coupleRepo.findByUserId(user.id)
    if (!couple) {
      throw new ApiError('Couple profile not found', 404)
    }

    return await this.guestRepo.getStatsByCouple(couple.id)
  }

  /**
   * Bulk update guests
   * Use Case: Mass table assignments, status updates
   */
  async bulkUpdateGuests(request: BulkUpdateGuestsRequest): Promise<GuestSummaryResponse[]> {
    return withTransaction(async (tx) => {
      const user = await getCurrentUser()
      if (!user) {
        throw new ApiError('Unauthorized', 401)
      }

      const couple = await this.coupleRepo.findByUserId(user.id)
      if (!couple) {
        throw new ApiError('Couple profile not found', 404)
      }

      // Verify ownership of all guests
      const guests = await Promise.all(
        request.guestIds.map(id => this.guestRepo.findById(id))
      )

      const invalidGuests = guests.filter(g => !g || g.coupleId !== couple.id)
      if (invalidGuests.length > 0) {
        throw new ApiError('Some guests not found or access denied', 403)
      }

      // Perform bulk update
      const updateData = {
        ...request.updates,
        updatedAt: new Date()
      }

      const updatedGuests = await this.guestRepo.bulkUpdate(request.guestIds, updateData, tx)
      
      return updatedGuests.map(guest => this.mapToSummaryResponse(guest))
    })
  }

  /**
   * Update table assignments
   * Use Case: Seating arrangement management
   */
  async updateTableAssignments(request: TableAssignmentUpdate): Promise<GuestSummaryResponse[]> {
    return withTransaction(async (tx) => {
      const user = await getCurrentUser()
      if (!user) {
        throw new ApiError('Unauthorized', 401)
      }

      const couple = await this.coupleRepo.findByUserId(user.id)
      if (!couple) {
        throw new ApiError('Couple profile not found', 404)
      }

      const updatedGuests: any[] = []

      for (const assignment of request.assignments) {
        const guest = await this.guestRepo.findById(assignment.guestId)
        if (!guest || guest.coupleId !== couple.id) {
          throw new ApiError(`Guest ${assignment.guestId} not found or access denied`, 403)
        }

        const updateData = {
          tableNumber: assignment.tableNumber,
          seatNumber: assignment.seatNumber,
          updatedAt: new Date()
        }

        const updatedGuest = await this.guestRepo.update(assignment.guestId, updateData, tx)
        updatedGuests.push(updatedGuest)
      }

      return updatedGuests.map(guest => this.mapToSummaryResponse(guest))
    })
  }

  /**
   * Get table assignments overview
   * Use Case: Seating chart visualization
   */
  async getTableAssignments(): Promise<TableAssignmentResponse[]> {
    const user = await getCurrentUser()
    if (!user) {
      throw new ApiError('Unauthorized', 401)
    }

    const couple = await this.coupleRepo.findByUserId(user.id)
    if (!couple) {
      throw new ApiError('Couple profile not found', 404)
    }

    return await this.guestRepo.getTableAssignmentsByCouple(couple.id)
  }

  /**
   * Validate guest import data
   */
  private async validateGuestImport(coupleId: string, guests: CreateGuestRequest[]): Promise<ImportValidationResult> {
    const errors: any[] = []
    const warnings: any[] = []
    let validRows = 0
    let duplicates = 0

    for (let i = 0; i < guests.length; i++) {
      const guest = guests[i]
      let hasErrors = false

      // Required field validation
      if (!guest.name || guest.name.trim().length === 0) {
        errors.push({ row: i + 1, field: 'name', message: 'Name is required' })
        hasErrors = true
      }

      if (!guest.relationship || guest.relationship.trim().length === 0) {
        errors.push({ row: i + 1, field: 'relationship', message: 'Relationship is required' })
        hasErrors = true
      }

      // Email validation
      if (guest.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guest.email)) {
        errors.push({ row: i + 1, field: 'email', message: 'Invalid email format' })
        hasErrors = true
      }

      // Check for duplicates in the import
      const duplicateInImport = guests.findIndex((g, idx) => 
        idx !== i && g.name === guest.name && g.email === guest.email
      )
      if (duplicateInImport !== -1) {
        warnings.push({ 
          row: i + 1, 
          message: `Duplicate of row ${duplicateInImport + 1}` 
        })
        duplicates++
      }

      // Check for duplicates in database
      if (guest.name && guest.email) {
        const existingGuest = await this.guestRepo.findByCoupleAndNameEmail(
          coupleId, 
          guest.name, 
          guest.email
        )
        if (existingGuest) {
          warnings.push({ 
            row: i + 1, 
            message: 'Guest already exists in database' 
          })
          duplicates++
        }
      }

      if (!hasErrors) {
        validRows++
      }
    }

    return {
      totalRows: guests.length,
      validRows,
      invalidRows: guests.length - validRows,
      duplicates,
      errors,
      warnings,
      preview: guests.slice(0, 5).map((guest, i) => ({
        id: '', // Not created yet
        name: guest.name,
        email: guest.email,
        relationship: guest.relationship,
        side: guest.side,
        type: guest.type,
        rsvpStatus: guest.rsvpStatus,
        ceremonyAttending: guest.ceremonyAttending,
        receptionAttending: guest.receptionAttending,
        hasPlusOne: guest.hasPlusOne,
        tableNumber: guest.tableNumber,
        isVip: guest.isVip,
        invitationSent: false,
        giftReceived: guest.giftReceived,
        thankYouSent: guest.thankYouSent
      }))
    }
  }

  /**
   * Map database entity to API response
   */
  private mapToResponse(guest: any): GuestResponse {
    // Combine firstName and lastName into name
    const name = `${guest.firstName || ''} ${guest.lastName || ''}`.trim() || 'Guest'
    
    return {
      id: guest.id,
      name: name,
      email: guest.email || null,
      phone: guest.phone || null,
      relationship: guest.relationship || null,
      side: guest.side || 'both',
      type: guest.type || 'adult',
      ageGroup: guest.ageGroup || 'adult',
      address: guest.address || null,
      rsvpStatus: guest.rsvpStatus || 'pending',
      rsvpDate: guest.rsvpDate || null,
      rsvpNotes: guest.rsvpNotes || null,
      dietaryRestrictions: guest.dietaryRestrictions ? [guest.dietaryRestrictions] : [],
      mealChoice: guest.mealChoice || null,
      allergies: guest.allergies || null,
      ceremonyAttending: guest.ceremonyAttending || false,
      receptionAttending: guest.receptionAttending || false,
      hasPlusOne: guest.plusOneAllowed || false,
      plusOneName: guest.plusOneName || null,
      plusOneEmail: guest.plusOneEmail || null,
      needsAccommodation: guest.needsAccommodation || false,
      accommodationNotes: guest.accommodationNotes || null,
      needsTransportation: guest.needsTransportation || false,
      transportationNotes: guest.transportationNotes || null,
      tableNumber: guest.tableNumber || null,
      seatNumber: guest.seatNumber || null,
      giftReceived: guest.giftReceived || false,
      giftDescription: guest.giftDescription || null,
      thankYouSent: guest.thankYouSent || false,
      tags: guest.tags || [],
      notes: guest.notes || null,
      isVip: guest.isVip || false,
      priority: guest.priority || 'normal',
      invitationCode: guest.invitation?.invitationCode || null,
      invitationSent: guest.invitationSentAt ? true : false,
      invitationSentDate: guest.invitationSentAt || null,
      importedFrom: guest.importedFrom || null,
      externalId: guest.externalId || null,
      coupleId: guest.coupleId || null,
      createdAt: guest.createdAt ? guest.createdAt.toISOString() : new Date().toISOString(),
      updatedAt: guest.updatedAt ? guest.updatedAt.toISOString() : new Date().toISOString()
    }
  }

  /**
   * Map database entity to summary response
   */
  private mapToSummaryResponse(guest: any): GuestSummaryResponse {
    // Combine firstName and lastName into name
    const name = `${guest.firstName || ''} ${guest.lastName || ''}`.trim() || 'Guest'
    
    return {
      id: guest.id,
      name: name,
      email: guest.email || null,
      relationship: guest.relationship || null,
      side: guest.side || 'both',
      type: guest.type || 'adult', // Default to adult
      rsvpStatus: guest.rsvpStatus || 'pending',
      ceremonyAttending: guest.ceremonyAttending || false,
      receptionAttending: guest.receptionAttending || false,
      hasPlusOne: guest.plusOneAllowed || false, // Map from plusOneAllowed
      tableNumber: guest.tableNumber || null,
      isVip: guest.isVip || false,
      invitationCode: guest.invitation?.invitationCode || guest.invitationCode || null,
      invitationSent: guest.invitationSentAt ? true : false, // Check if invitation was sent
      giftReceived: guest.giftReceived || false,
      thankYouSent: guest.thankYouSent || false
    }
  }
}