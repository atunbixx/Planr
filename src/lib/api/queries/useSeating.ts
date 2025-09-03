"use client"

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { SeatingClient } from '@/lib/api/seating.client'
import type { TableWithSeats } from '@/contracts/seating'

export function useSeating() {
  return useQuery({
    queryKey: ['seating'],
    queryFn: async () => await SeatingClient.listTables(),
    staleTime: 30_000,
  })
}

export function useCreateTable() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: any) => SeatingClient.createTable(payload),
    onSuccess: (created) => {
      qc.setQueryData<TableWithSeats[]>(['seating'], (prev) => prev ? [...prev, created] : [created])
    },
  })
}

export function useUpdateTable() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) => SeatingClient.updateTable(id, payload),
    onSuccess: (updated) => {
      qc.setQueryData<TableWithSeats[]>(['seating'], (prev) => prev ? prev.map(t => t.id === updated.id ? updated : t) : [updated])
    },
  })
}

export function useDeleteTable() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => SeatingClient.deleteTable(id),
    onSuccess: (_, id) => {
      qc.setQueryData<TableWithSeats[]>(['seating'], (prev) => prev ? prev.filter(t => t.id !== id) : prev)
    },
  })
}

export function useAssignSeat() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ seatId, guestId }: { seatId: string; guestId: string | null }) => SeatingClient.assignSeat(seatId, guestId),
    onMutate: async ({ seatId, guestId }) => {
      await qc.cancelQueries({ queryKey: ['seating'] })
      const prev = qc.getQueryData<TableWithSeats[]>(['seating'])
      qc.setQueryData<TableWithSeats[]>(['seating'], (tables) => {
        if (!tables) return tables
        return tables.map(t => ({
          ...t,
          seats: (t.seats || []).map((s) => {
            if (s.id === seatId) return { ...s, guestId }
            if (guestId && s.guestId === guestId) return { ...s, guestId: null }
            return s
          })
        }))
      })
      return { prev }
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(['seating'], ctx.prev)
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['seating'] })
    }
  })
}

export function useAutoAssign() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (groupByRelationship: boolean = true) => SeatingClient.autoAssign(groupByRelationship),
    onSuccess: (tables) => {
      qc.setQueryData<TableWithSeats[]>(['seating'], tables)
    }
  })
}

