"use client"

import { useQuery } from '@tanstack/react-query'
import { GuestsClient } from '@/lib/api/guests.client'
import type { GuestResponse } from '@/features/guests/dto/guest.dto'

export function useGuests() {
  return useQuery({
    queryKey: ['guests', { limit: 1000 }],
    queryFn: async () => {
      const res = await GuestsClient.listGuests({ limit: 1000 })
      return res.guests as GuestResponse[]
    },
    staleTime: 30_000,
  })
}
