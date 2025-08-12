// Types
export interface ChecklistItem {
  id: string
  coupleId: string
  title: string
  description?: string
  category: string
  timeframe: string
  priority: 'high' | 'medium' | 'low'
  isCompleted: boolean
  completedAt?: Date
  dueDate?: Date
  notes?: string
  sortOrder?: number
  createdAt: Date
  updatedAt: Date
}

export interface ChecklistStats {
  total: number
  completed: number
  pending: number
  byTimeframe: Record<string, { total: number; completed: number }>
}

export interface ChecklistResponse {
  items: ChecklistItem[]
  stats: ChecklistStats
}

// API Client
export class ChecklistAPIClient {
  private baseUrl = '/api/checklist'

  async getChecklist(): Promise<ChecklistResponse> {
    try {
      const response = await fetch(this.baseUrl)
      if (!response.ok) {
        throw new Error(`Failed to fetch checklist: ${response.statusText}`)
      }
      return response.json()
    } catch (error) {
      console.error('Error fetching checklist:', error)
      throw error
    }
  }

  async createItem(data: {
    title: string
    description?: string
    category?: string
    timeframe?: string
    priority?: 'high' | 'medium' | 'low'
    dueDate?: string
  }): Promise<ChecklistItem> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      if (!response.ok) {
        throw new Error(`Failed to create checklist item: ${response.statusText}`)
      }
      return response.json()
    } catch (error) {
      console.error('Error creating checklist item:', error)
      throw error
    }
  }

  async updateItem(itemId: string, data: Partial<{
    title: string
    description: string
    category: string
    timeframe: string
    priority: 'high' | 'medium' | 'low'
    isCompleted: boolean
    dueDate: string
    notes: string
  }>): Promise<ChecklistItem> {
    try {
      const response = await fetch(`${this.baseUrl}/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      if (!response.ok) {
        throw new Error(`Failed to update checklist item: ${response.statusText}`)
      }
      return response.json()
    } catch (error) {
      console.error('Error updating checklist item:', error)
      throw error
    }
  }

  async deleteItem(itemId: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/${itemId}`, {
        method: 'DELETE'
      })
      if (!response.ok) {
        throw new Error(`Failed to delete checklist item: ${response.statusText}`)
      }
    } catch (error) {
      console.error('Error deleting checklist item:', error)
      throw error
    }
  }

  async toggleComplete(itemId: string): Promise<ChecklistItem> {
    try {
      const response = await fetch(`${this.baseUrl}/${itemId}/toggle`, {
        method: 'POST'
      })
      if (!response.ok) {
        throw new Error(`Failed to toggle checklist item: ${response.statusText}`)
      }
      return response.json()
    } catch (error) {
      console.error('Error toggling checklist item:', error)
      throw error
    }
  }

  async initializeDefaults(): Promise<ChecklistItem[]> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ initializeDefaults: true })
      })
      if (!response.ok) {
        throw new Error(`Failed to initialize default checklist: ${response.statusText}`)
      }
      return response.json()
    } catch (error) {
      console.error('Error initializing default checklist:', error)
      throw error
    }
  }

  async reorderItems(items: { id: string; sortOrder: number }[]): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/reorder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items })
      })
      if (!response.ok) {
        throw new Error(`Failed to reorder checklist: ${response.statusText}`)
      }
    } catch (error) {
      console.error('Error reordering checklist:', error)
      throw error
    }
  }

  // Utility method to get items by timeframe
  async getItemsByTimeframe(timeframe: string): Promise<ChecklistItem[]> {
    try {
      const { items } = await this.getChecklist()
      return items.filter(item => item.timeframe === timeframe)
    } catch (error) {
      console.error('Error fetching items by timeframe:', error)
      throw error
    }
  }

  // Utility method to get high priority incomplete items
  async getHighPriorityItems(): Promise<ChecklistItem[]> {
    try {
      const { items } = await this.getChecklist()
      return items.filter(item => item.priority === 'high' && !item.isCompleted)
    } catch (error) {
      console.error('Error fetching high priority items:', error)
      throw error
    }
  }

  // Utility method to get overdue items
  async getOverdueItems(): Promise<ChecklistItem[]> {
    try {
      const { items } = await this.getChecklist()
      const now = new Date()
      return items.filter(item => 
        !item.isCompleted && 
        item.dueDate && 
        new Date(item.dueDate) < now
      )
    } catch (error) {
      console.error('Error fetching overdue items:', error)
      throw error
    }
  }
}

// Export singleton instance
export const checklistAPI = new ChecklistAPIClient()