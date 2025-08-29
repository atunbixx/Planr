"use client"

import { useQuery } from '@tanstack/react-query'
import { GuestsClient, type LegacyGuest } from '@/lib/api/guests.client'

export function useGuests() {
  return useQuery({
    queryKey: ['guests', { limit: 1000 }],
    queryFn: async () => {
      const res = await GuestsClient.listGuests({ limit: 1000 })
      return res.guests as LegacyGuest[]
    },
    staleTime: 30_000,
  })
}

