import { BaseRepository, RepositoryResult, createErrorResult, createSuccessResult } from '@/lib/repositories/BaseRepository'
import { tempStorage } from '@/lib/db/temp-storage'

export type SeatingTable = {
  id: string
  userId: string
  name: string
  capacity: number
  guestIds: string[]
}

export class SeatingRepository extends BaseRepository {
  async listTables(userId: string): Promise<RepositoryResult<SeatingTable[]>> {
    try {
      const tables = await tempStorage.listSeating(userId)
      return createSuccessResult(tables as SeatingTable[])
    } catch (error: any) {
      return createErrorResult('Failed to list seating tables', 'SEATING_LIST_FAILED', 500)
    }
  }

  async createTable(userId: string, data: { name: string; capacity: number }): Promise<RepositoryResult<SeatingTable>> {
    try {
      const table = await tempStorage.createTable(userId, data)
      return createSuccessResult(table as SeatingTable)
    } catch (error: any) {
      return createErrorResult('Failed to create table', 'SEATING_CREATE_FAILED', 500)
    }
  }

  async updateTable(userId: string, id: string, data: Partial<{ name: string; capacity: number }>): Promise<RepositoryResult<SeatingTable | null>> {
    try {
      const updated = await tempStorage.updateTable(userId, id, data)
      return createSuccessResult((updated || null) as SeatingTable | null)
    } catch (error: any) {
      return createErrorResult('Failed to update table', 'SEATING_UPDATE_FAILED', 500)
    }
  }

  async deleteTable(userId: string, id: string): Promise<RepositoryResult<boolean>> {
    try {
      const ok = await tempStorage.deleteTable(userId, id)
      return createSuccessResult(ok)
    } catch (error: any) {
      return createErrorResult('Failed to delete table', 'SEATING_DELETE_FAILED', 500)
    }
  }

  async assignGuests(userId: string, tableId: string, guestIds: string[]): Promise<RepositoryResult<SeatingTable | null>> {
    try {
      const updated = await tempStorage.assignGuests(userId, tableId, guestIds)
      return createSuccessResult((updated || null) as SeatingTable | null)
    } catch (error: any) {
      return createErrorResult('Failed to assign guests', 'SEATING_ASSIGN_FAILED', 500)
    }
  }

  async unassignGuest(userId: string, guestId: string): Promise<RepositoryResult<boolean>> {
    try {
      const ok = await tempStorage.unassignGuest(userId, guestId)
      return createSuccessResult(ok)
    } catch (error: any) {
      return createErrorResult('Failed to unassign guest', 'SEATING_UNASSIGN_FAILED', 500)
    }
  }

  async autoAssign(userId: string, allGuestIds: string[], groupByRelationship: boolean): Promise<RepositoryResult<SeatingTable[]>> {
    try {
      const tables = await tempStorage.autoAssign(userId, allGuestIds, groupByRelationship)
      return createSuccessResult(tables as SeatingTable[])
    } catch (error: any) {
      return createErrorResult('Failed to auto-assign seating', 'SEATING_AUTOASSIGN_FAILED', 500)
    }
  }
}

