"use client"

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { SettingsClient, type Preferences, type WeddingDetails } from '@/lib/api/settings.client'

export function useWeddingDetails() {
  return useQuery({
    queryKey: ['settings', 'wedding-details'],
    queryFn: () => SettingsClient.getWeddingDetails(),
    staleTime: 30_000,
  })
}

export function usePreferences() {
  return useQuery({
    queryKey: ['settings', 'preferences'],
    queryFn: () => SettingsClient.getPreferences(),
    staleTime: 30_000,
  })
}

export function useUpdateWeddingDetails() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: WeddingDetails) => SettingsClient.updateWeddingDetails(data),
    onSuccess: (updated) => {
      qc.setQueryData(['settings', 'wedding-details'], updated)
    }
  })
}

export function useUpdatePreferences() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Preferences) => SettingsClient.updatePreferences(data),
    onSuccess: (updated) => {
      qc.setQueryData(['settings', 'preferences'], updated)
    }
  })
}

