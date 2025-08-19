import { RepositoryResult, createErrorResult, createSuccessResult } from '@/lib/repositories/BaseRepository'
import { SeatingRepository, SeatingTable } from '../repo/seating.repository'

export class SeatingService {
  private repo: SeatingRepository

  constructor() {
    this.repo = new SeatingRepository()
  }

  async listTables(userId: string): Promise<RepositoryResult<SeatingTable[]>> {
    return this.repo.listTables(userId)
  }

  async createTable(userId: string, data: { name: string; capacity: number }): Promise<RepositoryResult<SeatingTable>> {
    if (!data || !data.name || typeof data.capacity !== 'number') {
      return createErrorResult('Invalid table payload', 'VALIDATION_ERROR', 400)
    }
    const name = data.name.trim() || 'Table'
    const capacity = Math.max(0, Math.floor(data.capacity))
    return this.repo.createTable(userId, { name, capacity })
  }

  async updateTable(userId: string, id: string, data: Partial<{ name: string; capacity: number }>): Promise<RepositoryResult<SeatingTable | null>> {
    const payload: Partial<{ name: string; capacity: number }> = {}
    if (typeof data.name === 'string') payload.name = data.name
    if (typeof data.capacity !== 'undefined') payload.capacity = Math.max(0, Math.floor(Number(data.capacity)))
    return this.repo.updateTable(userId, id, payload)
  }

  async deleteTable(userId: string, id: string): Promise<RepositoryResult<boolean>> {
    return this.repo.deleteTable(userId, id)
  }

  async assignGuests(userId: string, tableId: string, guestIds: string[]): Promise<RepositoryResult<SeatingTable | null>> {
    const ids = Array.isArray(guestIds) ? guestIds.filter(Boolean) : []
    if (!tableId || ids.length === 0) return createErrorResult('tableId and guestIds required', 'VALIDATION_ERROR', 400)
    return this.repo.assignGuests(userId, tableId, ids)
  }

  async unassignGuest(userId: string, guestId: string): Promise<RepositoryResult<boolean>> {
    if (!guestId) return createErrorResult('guestId required', 'VALIDATION_ERROR', 400)
    return this.repo.unassignGuest(userId, guestId)
  }

  async autoAssign(userId: string, allGuestIds: string[], groupByRelationship: boolean): Promise<RepositoryResult<SeatingTable[]>> {
    const ids = Array.isArray(allGuestIds) ? allGuestIds.filter(Boolean) : []
    return this.repo.autoAssign(userId, ids, !!groupByRelationship)
  }
}

