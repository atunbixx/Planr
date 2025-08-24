"use client"

import AuthClient from '@/lib/auth/client'
import { CreateTableInput, UpdateTableInput, TableFilterInput, AssignGuestToSeatInput, TableResponse, SeatingChartResponse, SeatingStatsResponse } from '@/features/seating/dto/seating.dto'

// API response envelope
type ApiEnvelope<T> = {
  success: boolean
  data?: T
  error?: { message: string; details?: any }
}

export class SeatingClient {
  private static authHeaders() {
    const token = AuthClient.getToken()
    const headers: Record<string,string> = { 'Content-Type': 'application/json' }
    if (token) headers['Authorization'] = `Bearer ${token}`
    return headers
  }

  /**
   * Get complete seating chart with tables and statistics
   */
  static async getSeatingChart(filters?: TableFilterInput): Promise<SeatingChartResponse> {
    const params = new URLSearchParams()
    
    if (filters?.shape) params.append('shape', filters.shape)
    if (filters?.minCapacity) params.append('minCapacity', filters.minCapacity.toString())
    if (filters?.maxCapacity) params.append('maxCapacity', filters.maxCapacity.toString())
    if (filters?.limit) params.append('limit', filters.limit.toString())
    if (filters?.offset) params.append('offset', filters.offset.toString())

    const url = `/api/seating${params.toString() ? `?${params.toString()}` : ''}`
    
    const response = await fetch(url, {
      method: 'GET',
      headers: this.authHeaders()
    })

    const result: ApiEnvelope<SeatingChartResponse> = await response.json()
    
    if (!result.success) {
      throw new Error(result.error?.message || 'Failed to fetch seating chart')
    }

    return result.data!
  }

  /**
   * Get a single table by ID
   */
  static async getTableById(tableId: string): Promise<TableResponse> {
    const response = await fetch(`/api/seating/tables/${tableId}`, {
      method: 'GET',
      headers: this.authHeaders()
    })

    const result: ApiEnvelope<TableResponse> = await response.json()
    
    if (!result.success) {
      throw new Error(result.error?.message || 'Failed to fetch table')
    }

    return result.data!
  }

  /**
   * Create a new table
   */
  static async createTable(data: CreateTableInput): Promise<TableResponse> {
    const response = await fetch('/api/seating/tables', {
      method: 'POST',
      headers: this.authHeaders(),
      body: JSON.stringify(data)
    })

    const result: ApiEnvelope<TableResponse> = await response.json()
    
    if (!result.success) {
      throw new Error(result.error?.message || 'Failed to create table')
    }

    return result.data!
  }

  /**
   * Update an existing table
   */
  static async updateTable(tableId: string, data: UpdateTableInput): Promise<TableResponse> {
    const response = await fetch(`/api/seating/tables/${tableId}`, {
      method: 'PATCH',
      headers: this.authHeaders(),
      body: JSON.stringify(data)
    })

    const result: ApiEnvelope<TableResponse> = await response.json()
    
    if (!result.success) {
      throw new Error(result.error?.message || 'Failed to update table')
    }

    return result.data!
  }

  /**
   * Delete a table
   */
  static async deleteTable(tableId: string): Promise<boolean> {
    const response = await fetch(`/api/seating/tables/${tableId}`, {
      method: 'DELETE',
      headers: this.authHeaders()
    })

    const result: ApiEnvelope<{ deleted: boolean }> = await response.json()
    
    if (!result.success) {
      throw new Error(result.error?.message || 'Failed to delete table')
    }

    return result.data!.deleted
  }

  /**
   * Assign guest to seat
   */
  static async assignGuestToSeat(seatId: string, data: AssignGuestToSeatInput): Promise<boolean> {
    const response = await fetch(`/api/seating/seats/${seatId}/assign`, {
      method: 'POST',
      headers: this.authHeaders(),
      body: JSON.stringify(data)
    })

    const result: ApiEnvelope<{ assigned: boolean }> = await response.json()
    
    if (!result.success) {
      throw new Error(result.error?.message || 'Failed to assign guest to seat')
    }

    return result.data!.assigned
  }

  /**
   * Unassign guest from seat
   */
  static async unassignGuestFromSeat(seatId: string): Promise<boolean> {
    return this.assignGuestToSeat(seatId, { guestId: null })
  }

  /**
   * Get seating statistics
   */
  static async getStats(): Promise<SeatingStatsResponse> {
    const response = await fetch('/api/seating/stats', {
      method: 'GET',
      headers: this.authHeaders()
    })

    const result: ApiEnvelope<SeatingStatsResponse> = await response.json()
    
    if (!result.success) {
      throw new Error(result.error?.message || 'Failed to fetch seating statistics')
    }

    return result.data!
  }

  /**
   * Get available table shapes
   */
  static getAvailableShapes(): { [key: string]: string } {
    return {
      'round': 'Round',
      'rectangle': 'Rectangle',
      'square': 'Square',
      'oval': 'Oval'
    }
  }

  /**
   * Get default table dimensions by shape
   */
  static getDefaultDimensions(shape: string): { width?: number; height?: number; diameter?: number; capacity: number } {
    switch (shape) {
      case 'round':
        return { diameter: 60, capacity: 8 }
      case 'rectangle':
        return { width: 96, height: 36, capacity: 8 }
      case 'square':
        return { width: 48, height: 48, capacity: 8 }
      case 'oval':
        return { width: 84, height: 48, capacity: 8 }
      default:
        return { diameter: 60, capacity: 8 }
    }
  }

  /**
   * Calculate seat positions around a table
   */
  static calculateSeatPositions(shape: string, capacity: number, dimensions: { width?: number; height?: number; diameter?: number }): Array<{ x: number; y: number }> {
    const positions: Array<{ x: number; y: number }> = []
    
    if (shape === 'round' || shape === 'oval') {
      const radius = shape === 'round' ? (dimensions.diameter || 60) / 2 : Math.max((dimensions.width || 84) / 2, (dimensions.height || 48) / 2)
      
      for (let i = 0; i < capacity; i++) {
        const angle = (2 * Math.PI * i) / capacity - Math.PI / 2 // Start from top
        positions.push({
          x: Math.cos(angle) * radius,
          y: Math.sin(angle) * radius
        })
      }
    } else {
      // Rectangle and square
      const width = dimensions.width || 48
      const height = dimensions.height || 48
      const perimeter = 2 * (width + height)
      const spacing = perimeter / capacity
      
      for (let i = 0; i < capacity; i++) {
        const distance = i * spacing
        let x, y
        
        if (distance <= width) {
          // Top edge
          x = distance - width / 2
          y = -height / 2
        } else if (distance <= width + height) {
          // Right edge
          x = width / 2
          y = (distance - width) - height / 2
        } else if (distance <= 2 * width + height) {
          // Bottom edge
          x = width / 2 - (distance - width - height)
          y = height / 2
        } else {
          // Left edge
          x = -width / 2
          y = height / 2 - (distance - 2 * width - height)
        }
        
        positions.push({ x, y })
      }
    }
    
    return positions
  }

  /**
   * Generate table colors for visual differentiation
   */
  static getTableColors(): string[] {
    return [
      '#3B82F6', // Blue
      '#10B981', // Green
      '#F59E0B', // Yellow
      '#EF4444', // Red
      '#8B5CF6', // Purple
      '#06B6D4', // Cyan
      '#F97316', // Orange
      '#84CC16', // Lime
      '#EC4899', // Pink
      '#6B7280'  // Gray
    ]
  }
}
