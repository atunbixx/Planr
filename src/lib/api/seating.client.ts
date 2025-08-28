import { api } from '@/lib/api/fetcher'
import { TableWithSeatsDto, TableWithSeats, TableDto, Table, SeatDto, Seat } from '@/contracts/seating'

type Envelope<T> = { success: boolean; data?: T; error?: { message: string } }

export const SeatingClient = {
  async listTables(): Promise<TableWithSeats[]> {
    const env = await api.get<Envelope<{ tables: unknown[] }>>('/api/seating')
    if (!env.success) throw new Error(env.error?.message || 'Failed to list tables')
    const arr = (env.data?.tables || []).map((t) => TableWithSeatsDto.parse(t))
    return arr
  },
  async getTable(id: string): Promise<TableWithSeats | null> {
    const env = await api.get<Envelope<unknown>>(`/api/seating/${id}`)
    if (!env.success) throw new Error(env.error?.message || 'Failed to get table')
    if (!env.data) return null
    return TableWithSeatsDto.parse(env.data)
  },
  async createTable(payload: Partial<Table>): Promise<TableWithSeats> {
    const env = await api.post<Envelope<unknown>>('/api/seating', payload)
    if (!env.success) throw new Error(env.error?.message || 'Failed to create table')
    return TableWithSeatsDto.parse(env.data)
  },
  async updateTable(id: string, payload: Partial<Table>): Promise<TableWithSeats> {
    const env = await api.patch<Envelope<unknown>>(`/api/seating/${id}`, payload)
    if (!env.success) throw new Error(env.error?.message || 'Failed to update table')
    return TableWithSeatsDto.parse(env.data)
  },
  async deleteTable(id: string): Promise<boolean> {
    const env = await api.delete<Envelope<{ deleted: boolean }>>(`/api/seating/${id}`)
    if (!env.success) throw new Error(env.error?.message || 'Failed to delete table')
    return Boolean(env.data?.deleted)
  },
  async createSeats(tableId: string, capacity: number): Promise<Seat[]> {
    const env = await api.post<Envelope<{ seats: unknown[] }>>(`/api/seating/${tableId}/seats`, { capacity })
    if (!env.success) throw new Error(env.error?.message || 'Failed to create seats')
    return (env.data?.seats || []).map((s) => SeatDto.parse(s))
  },
  async assignSeat(seatId: string, guestId: string | null, notes?: string): Promise<Seat> {
    const env = await api.post<Envelope<unknown>>(`/api/seating/seats/${seatId}/assign`, { guestId, notes })
    if (!env.success) throw new Error(env.error?.message || 'Failed to assign seat')
    return SeatDto.parse(env.data)
  },
  async autoAssign(groupByRelationship = true): Promise<TableWithSeats[]> {
    const env = await api.post<Envelope<{ tables: unknown[] }>>(`/api/seating/auto-assign`, { groupByRelationship })
    if (!env.success) throw new Error(env.error?.message || 'Failed to auto-assign')
    return (env.data?.tables || []).map((t) => TableWithSeatsDto.parse(t))
  },
}
