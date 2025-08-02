import { useCallback } from 'react'
import { useApiQuery, useApiMutation } from './base'
import { couplesApi, CoupleWithDetails } from '../services/couples'
import { CoupleUpdate } from '@/types/database'
import { QueryOptions, MutationOptions } from '../types'

// Get current couple
export function useCurrentCouple(options?: QueryOptions) {
  return useApiQuery(
    () => couplesApi.getCurrentCouple(),
    {
      refetchOnWindowFocus: true,
      ...options
    }
  )
}

// Update couple
export function useUpdateCouple(
  options?: MutationOptions<CoupleWithDetails, { id: string; data: Partial<CoupleUpdate> }>
) {
  return useApiMutation(
    ({ id, data }) => couplesApi.updateCouple(id, data),
    options
  )
}

// Update wedding details
export function useUpdateWeddingDetails(
  options?: MutationOptions<CoupleWithDetails, { 
    id: string; 
    details: Parameters<typeof couplesApi.updateWeddingDetails>[1] 
  }>
) {
  return useApiMutation(
    ({ id, details }) => couplesApi.updateWeddingDetails(id, details),
    options
  )
}

// Get couple stats
export function useCoupleStats(coupleId: string, options?: QueryOptions) {
  return useApiQuery(
    () => couplesApi.getStats(coupleId),
    {
      refetchInterval: 30000, // Refetch every 30 seconds
      ...options
    }
  )
}

// Upload photo
export function useUploadCouplePhoto(
  options?: MutationOptions<{ url: string }, { 
    id: string; 
    file: File; 
    type: 'couple' | 'venue' 
  }>
) {
  return useApiMutation(
    ({ id, file, type }) => couplesApi.uploadPhoto(id, file, type),
    options
  )
}

// Invite partner
export function useInvitePartner(
  options?: MutationOptions<{ success: boolean }, { 
    email: string; 
    message?: string 
  }>
) {
  return useApiMutation(
    ({ email, message }) => couplesApi.invitePartner(email, message),
    options
  )
}

// Accept invitation
export function useAcceptInvitation(
  options?: MutationOptions<{ couple: CoupleWithDetails }, { token: string }>
) {
  return useApiMutation(
    ({ token }) => couplesApi.acceptInvitation(token),
    options
  )
}

// Remove partner
export function useRemovePartner(
  options?: MutationOptions<{ success: boolean }, { 
    coupleId: string; 
    partnerId: string 
  }>
) {
  return useApiMutation(
    ({ coupleId, partnerId }) => couplesApi.removePartner(coupleId, partnerId),
    options
  )
}

// Composite hook for managing couple profile
export function useCoupleProfile() {
  const { data: couple, error, isLoading, refetch } = useCurrentCouple()
  
  const updateCouple = useUpdateCouple({
    onSuccess: () => {
      refetch()
    }
  })
  
  const updateWeddingDetails = useUpdateWeddingDetails({
    onSuccess: () => {
      refetch()
    }
  })
  
  const uploadPhoto = useUploadCouplePhoto({
    onSuccess: () => {
      refetch()
    }
  })

  return {
    couple,
    error,
    isLoading,
    refetch,
    updateCouple: updateCouple.mutate,
    updateWeddingDetails: updateWeddingDetails.mutate,
    uploadPhoto: uploadPhoto.mutate,
    isUpdating: updateCouple.isLoading || updateWeddingDetails.isLoading || uploadPhoto.isLoading
  }
}