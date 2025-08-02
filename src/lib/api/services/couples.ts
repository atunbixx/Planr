import { apiClient } from '../base/client'
import { ApiResponse } from '../types'
import { Couple, CoupleUpdate } from '@/types/database'

export interface CoupleWithDetails extends Couple {
  partner1?: {
    id: string
    email: string
    full_name?: string
    avatar_url?: string
  }
  partner2?: {
    id: string
    email: string
    full_name?: string
    avatar_url?: string
  }
  stats?: {
    total_guests: number
    confirmed_guests: number
    total_vendors: number
    booked_vendors: number
    tasks_completed: number
    tasks_total: number
    budget_spent: number
    budget_total: number
  }
}

class CouplesApiService {
  private basePath = '/couples'

  // Get current couple profile
  async getCurrentCouple(): Promise<ApiResponse<CoupleWithDetails>> {
    return apiClient.get<CoupleWithDetails>(`${this.basePath}/current`)
  }

  // Update couple profile
  async updateCouple(
    id: string,
    data: Partial<CoupleUpdate>
  ): Promise<ApiResponse<Couple>> {
    return apiClient.patch<Couple>(`${this.basePath}/${id}`, data)
  }

  // Update wedding details
  async updateWeddingDetails(
    id: string,
    details: {
      wedding_date?: string
      venue_name?: string
      venue_address?: string
      guest_count?: number
      theme?: string
      colors?: string[]
    }
  ): Promise<ApiResponse<Couple>> {
    return apiClient.patch<Couple>(`${this.basePath}/${id}/wedding`, details)
  }

  // Get couple statistics
  async getStats(id: string): Promise<ApiResponse<CoupleWithDetails['stats']>> {
    return apiClient.get<CoupleWithDetails['stats']>(`${this.basePath}/${id}/stats`)
  }

  // Upload couple photo
  async uploadPhoto(
    id: string,
    file: File,
    type: 'couple' | 'venue'
  ): Promise<ApiResponse<{ url: string }>> {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('type', type)
    
    return apiClient.upload<{ url: string }>(
      `${this.basePath}/${id}/photo`,
      formData
    )
  }

  // Invite partner
  async invitePartner(
    email: string,
    message?: string
  ): Promise<ApiResponse<{ success: boolean }>> {
    return apiClient.post<{ success: boolean }>(`${this.basePath}/invite`, {
      email,
      message
    })
  }

  // Accept partner invitation
  async acceptInvitation(
    token: string
  ): Promise<ApiResponse<{ couple: Couple }>> {
    return apiClient.post<{ couple: Couple }>(`${this.basePath}/invite/accept`, {
      token
    })
  }

  // Remove partner
  async removePartner(
    coupleId: string,
    partnerId: string
  ): Promise<ApiResponse<{ success: boolean }>> {
    return apiClient.delete<{ success: boolean }>(
      `${this.basePath}/${coupleId}/partners/${partnerId}`
    )
  }
}

export const couplesApi = new CouplesApiService()