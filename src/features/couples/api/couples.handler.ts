/**
 * Couples API Handler - Enterprise API pattern with validation and error handling
 */

import { NextRequest } from 'next/server'
import { CoupleService } from '../service'
import { 
  CreateCoupleRequestSchema, 
  UpdateCoupleRequestSchema,
  CoupleSearchRequestSchema 
} from '../dto'
import { validateRequest, createApiResponse, handleApiError } from '@/shared/validation/middleware'
import { ApiError } from '@/shared/validation/errors'
import { getCurrentUser } from '@/core/auth/user'

export class CouplesApiHandler {
  private coupleService = new CoupleService()

  /**
   * POST /api/couples - Create couple profile
   */
  async createCouple(request: NextRequest) {
    try {
      const body = await request.json()
      const validatedData = await validateRequest(CreateCoupleRequestSchema, body)
      
      const couple = await this.coupleService.createCouple(validatedData)
      
      return createApiResponse({
        data: couple,
        message: 'Couple profile created successfully',
        status: 201
      })
    } catch (error) {
      return handleApiError(error)
    }
  }

  /**
   * GET /api/couples/me - Get current user's couple profile
   */
  async getCurrentCouple(request: NextRequest) {
    try {
      const user = await getCurrentUser()
      if (!user) {
        throw new ApiError('Unauthorized', 401)
      }

      const couple = await this.coupleService.getCoupleByUserId(user.id)
      
      return createApiResponse({
        data: couple,
        message: couple ? 'Couple profile retrieved' : 'No couple profile found'
      })
    } catch (error) {
      return handleApiError(error)
    }
  }

  /**
   * GET /api/couples/:id - Get couple by ID
   */
  async getCoupleById(request: NextRequest, params: { id: string }) {
    try {
      const { id } = params
      
      // For now, we'll get by user ID - in future this could be couple ID
      const couple = await this.coupleService.getCoupleByUserId(id)
      
      if (!couple) {
        throw new ApiError('Couple not found', 404)
      }
      
      return createApiResponse({
        data: couple,
        message: 'Couple profile retrieved'
      })
    } catch (error) {
      return handleApiError(error)
    }
  }

  /**
   * PATCH /api/couples/:id - Update couple profile
   */
  async updateCouple(request: NextRequest, params: { id: string }) {
    try {
      const { id } = params
      const body = await request.json()
      const validatedData = await validateRequest(UpdateCoupleRequestSchema, body)
      
      const couple = await this.coupleService.updateCouple(id, validatedData)
      
      return createApiResponse({
        data: couple,
        message: 'Couple profile updated successfully'
      })
    } catch (error) {
      return handleApiError(error)
    }
  }

  /**
   * DELETE /api/couples/:id - Delete couple profile
   */
  async deleteCouple(request: NextRequest, params: { id: string }) {
    try {
      const { id } = params
      
      await this.coupleService.deleteCouple(id)
      
      return createApiResponse({
        message: 'Couple profile deleted successfully',
        status: 204
      })
    } catch (error) {
      return handleApiError(error)
    }
  }

  /**
   * GET /api/couples - Search couples (Admin only)
   */
  async searchCouples(request: NextRequest) {
    try {
      const { searchParams } = new URL(request.url)
      const queryData = {
        search: searchParams.get('search') || undefined,
        planningPhase: searchParams.get('planningPhase') || undefined,
        weddingDateFrom: searchParams.get('weddingDateFrom') || undefined,
        weddingDateTo: searchParams.get('weddingDateTo') || undefined,
        page: parseInt(searchParams.get('page') || '1'),
        pageSize: parseInt(searchParams.get('pageSize') || '20'),
        sortBy: searchParams.get('sortBy') || 'weddingDate',
        sortOrder: searchParams.get('sortOrder') || 'asc'
      }
      
      const validatedQuery = await validateRequest(CoupleSearchRequestSchema, queryData)
      const result = await this.coupleService.searchCouples(validatedQuery)
      
      return createApiResponse({
        data: result.data,
        meta: {
          pagination: result.pagination
        },
        message: 'Couples retrieved successfully'
      })
    } catch (error) {
      return handleApiError(error)
    }
  }

  /**
   * GET /api/couples/stats - Get couple statistics (Admin only)
   */
  async getCoupleStats(request: NextRequest) {
    try {
      const stats = await this.coupleService.getCoupleStats()
      
      return createApiResponse({
        data: stats,
        message: 'Couple statistics retrieved'
      })
    } catch (error) {
      return handleApiError(error)
    }
  }

  /**
   * GET /api/couples/upcoming - Get upcoming weddings
   */
  async getUpcomingWeddings(request: NextRequest) {
    try {
      const { searchParams } = new URL(request.url)
      const days = parseInt(searchParams.get('days') || '30')
      
      const weddings = await this.coupleService.getUpcomingWeddings(days)
      
      return createApiResponse({
        data: weddings,
        message: 'Upcoming weddings retrieved'
      })
    } catch (error) {
      return handleApiError(error)
    }
  }
}