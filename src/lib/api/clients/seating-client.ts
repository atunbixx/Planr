import { TableShape, SeatingPreferenceType } from '@prisma/client'

// Types
export interface SeatingLayout {
  id: string
  name: string
  eventId: string
  venueLayout?: any
  notes?: string
  isActive: boolean
  tables?: Table[]
  _count?: {
    tables: number
  }
}

export interface Table {
  id: string
  layoutId: string
  name: string
  capacity: number
  shape: TableShape
  x: number
  y: number
  width: number
  height: number
  rotation: number
  assignments?: SeatingAssignment[]
  _count?: {
    assignments: number
  }
}

export interface SeatingAssignment {
  id: string
  tableId: string
  guestId: string
  seatNumber: number
  guest?: {
    id: string
    name: string
    email?: string
    dietaryRestrictions?: string
  }
}

export interface SeatingPreference {
  id: string
  layoutId: string
  guestId1?: string
  guestId2?: string
  preferenceType: SeatingPreferenceType
  notes?: string
  priority: number
}

// API Client
export class SeatingAPIClient {
  private baseUrl = '/api/seating'

  // Layout Management
  async getLayouts(): Promise<SeatingLayout[]> {
    try {
      const response = await fetch(`${this.baseUrl}/layouts`)
      if (!response.ok) {
        throw new Error(`Failed to fetch layouts: ${response.statusText}`)
      }
      return response.json()
    } catch (error) {
      console.error('Error fetching seating layouts:', error)
      throw error
    }
  }

  async getLayout(layoutId: string): Promise<SeatingLayout> {
    try {
      const response = await fetch(`${this.baseUrl}/layouts/${layoutId}`)
      if (!response.ok) {
        throw new Error(`Failed to fetch layout: ${response.statusText}`)
      }
      return response.json()
    } catch (error) {
      console.error('Error fetching seating layout:', error)
      throw error
    }
  }

  async createLayout(data: {
    name: string
    eventId: string
    venueLayout?: any
    notes?: string
  }): Promise<SeatingLayout> {
    try {
      const response = await fetch(`${this.baseUrl}/layouts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      if (!response.ok) {
        throw new Error(`Failed to create layout: ${response.statusText}`)
      }
      return response.json()
    } catch (error) {
      console.error('Error creating seating layout:', error)
      throw error
    }
  }

  async updateLayout(layoutId: string, data: Partial<{
    name: string
    venueLayout: any
    notes: string
    isActive: boolean
  }>): Promise<SeatingLayout> {
    try {
      const response = await fetch(`${this.baseUrl}/layouts/${layoutId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      if (!response.ok) {
        throw new Error(`Failed to update layout: ${response.statusText}`)
      }
      return response.json()
    } catch (error) {
      console.error('Error updating seating layout:', error)
      throw error
    }
  }

  async deleteLayout(layoutId: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/layouts/${layoutId}`, {
        method: 'DELETE'
      })
      if (!response.ok) {
        throw new Error(`Failed to delete layout: ${response.statusText}`)
      }
    } catch (error) {
      console.error('Error deleting seating layout:', error)
      throw error
    }
  }

  // Table Management
  async getTables(layoutId: string): Promise<Table[]> {
    try {
      const response = await fetch(`${this.baseUrl}/tables?layoutId=${layoutId}`)
      if (!response.ok) {
        throw new Error(`Failed to fetch tables: ${response.statusText}`)
      }
      return response.json()
    } catch (error) {
      console.error('Error fetching tables:', error)
      throw error
    }
  }

  async createTable(data: {
    layoutId: string
    name: string
    capacity: number
    shape: TableShape
    x: number
    y: number
    width?: number
    height?: number
    rotation?: number
  }): Promise<Table> {
    try {
      const response = await fetch(`${this.baseUrl}/tables`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      if (!response.ok) {
        throw new Error(`Failed to create table: ${response.statusText}`)
      }
      return response.json()
    } catch (error) {
      console.error('Error creating table:', error)
      throw error
    }
  }

  async updateTable(tableId: string, data: Partial<Table>): Promise<Table> {
    try {
      const response = await fetch(`${this.baseUrl}/tables/${tableId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      if (!response.ok) {
        throw new Error(`Failed to update table: ${response.statusText}`)
      }
      return response.json()
    } catch (error) {
      console.error('Error updating table:', error)
      throw error
    }
  }

  async deleteTable(tableId: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/tables/${tableId}`, {
        method: 'DELETE'
      })
      if (!response.ok) {
        throw new Error(`Failed to delete table: ${response.statusText}`)
      }
    } catch (error) {
      console.error('Error deleting table:', error)
      throw error
    }
  }

  // Guest Assignment
  async assignGuest(data: {
    tableId: string
    guestId: string
    seatNumber?: number
  }): Promise<SeatingAssignment> {
    try {
      const response = await fetch(`${this.baseUrl}/assignments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      if (!response.ok) {
        throw new Error(`Failed to assign guest: ${response.statusText}`)
      }
      return response.json()
    } catch (error) {
      console.error('Error assigning guest:', error)
      throw error
    }
  }

  async removeAssignment(assignmentId: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/assignments/${assignmentId}`, {
        method: 'DELETE'
      })
      if (!response.ok) {
        throw new Error(`Failed to remove assignment: ${response.statusText}`)
      }
    } catch (error) {
      console.error('Error removing assignment:', error)
      throw error
    }
  }

  // Preferences
  async createPreference(data: {
    layoutId: string
    guestId1?: string
    guestId2?: string
    preferenceType: SeatingPreferenceType
    notes?: string
    priority?: number
  }): Promise<SeatingPreference> {
    try {
      const response = await fetch(`${this.baseUrl}/preferences`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      if (!response.ok) {
        throw new Error(`Failed to create preference: ${response.statusText}`)
      }
      return response.json()
    } catch (error) {
      console.error('Error creating preference:', error)
      throw error
    }
  }

  async deletePreference(preferenceId: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/preferences/${preferenceId}`, {
        method: 'DELETE'
      })
      if (!response.ok) {
        throw new Error(`Failed to delete preference: ${response.statusText}`)
      }
    } catch (error) {
      console.error('Error deleting preference:', error)
      throw error
    }
  }

  // AI Optimization
  async optimizeSeating(layoutId: string): Promise<{
    assignments: SeatingAssignment[]
    score: number
    improvements: string[]
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/optimize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ layoutId })
      })
      if (!response.ok) {
        throw new Error(`Failed to optimize seating: ${response.statusText}`)
      }
      return response.json()
    } catch (error) {
      console.error('Error optimizing seating:', error)
      throw error
    }
  }

  // Export
  async exportSeatingChart(layoutId: string, format: 'pdf' | 'csv' = 'pdf'): Promise<Blob> {
    try {
      const response = await fetch(`${this.baseUrl}/export`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ layoutId, format })
      })
      if (!response.ok) {
        throw new Error(`Failed to export seating chart: ${response.statusText}`)
      }
      return response.blob()
    } catch (error) {
      console.error('Error exporting seating chart:', error)
      throw error
    }
  }
}

// Export singleton instance
export const seatingAPI = new SeatingAPIClient()