import { apiClient } from '../base/client'
import { ApiResponse, PaginatedResponse, QueryParams } from '../types'
import { 
  BudgetCategory, 
  BudgetCategoryInsert, 
  BudgetCategoryUpdate,
  BudgetItem,
  BudgetItemInsert,
  BudgetItemUpdate
} from '@/types/database'

export interface BudgetOverview {
  couple_id: string
  total_budget: number
  total_allocated: number
  total_spent: number
  total_remaining: number
  categories: BudgetCategoryDetail[]
}

export interface BudgetCategoryDetail extends BudgetCategory {
  allocated_amount: number
  spent_amount: number
  remaining_amount: number
  percentage_used: number
  items?: BudgetItemDetail[]
  item_count: number
}

export interface BudgetItemDetail extends BudgetItem {
  category?: BudgetCategory
  vendor?: {
    id: string
    name: string
    category: string
  }
  payments?: {
    id: string
    amount: number
    date: string
    status: 'pending' | 'paid' | 'overdue'
  }[]
}

export interface BudgetAnalytics {
  overview: {
    total_budget: number
    allocated: number
    unallocated: number
    spent: number
    remaining: number
    overspend: number
  }
  by_category: {
    category: string
    allocated: number
    spent: number
    percentage: number
  }[]
  by_month: {
    month: string
    planned: number
    actual: number
  }[]
  top_expenses: BudgetItemDetail[]
  alerts: {
    type: 'overspend' | 'unallocated' | 'payment_due'
    message: string
    severity: 'info' | 'warning' | 'error'
    data?: any
  }[]
}

export interface BudgetFilters extends QueryParams {
  category_id?: string
  vendor_id?: string
  status?: 'planned' | 'committed' | 'paid'
  min_amount?: number
  max_amount?: number
  date_from?: string
  date_to?: string
}

class BudgetApiService {
  private basePath = '/budget'

  // Get budget overview
  async getOverview(): Promise<ApiResponse<BudgetOverview>> {
    return apiClient.get<BudgetOverview>(this.basePath)
  }

  // Get budget analytics
  async getAnalytics(): Promise<ApiResponse<BudgetAnalytics>> {
    return apiClient.get<BudgetAnalytics>(`${this.basePath}/analytics`)
  }

  // Categories CRUD
  async getCategories(): Promise<ApiResponse<BudgetCategoryDetail[]>> {
    return apiClient.get<BudgetCategoryDetail[]>(`${this.basePath}/categories`)
  }

  async getCategory(id: string): Promise<ApiResponse<BudgetCategoryDetail>> {
    return apiClient.get<BudgetCategoryDetail>(`${this.basePath}/categories/${id}`)
  }

  async createCategory(
    data: BudgetCategoryInsert
  ): Promise<ApiResponse<BudgetCategory>> {
    return apiClient.post<BudgetCategory>(`${this.basePath}/categories`, data)
  }

  async updateCategory(
    id: string,
    data: BudgetCategoryUpdate
  ): Promise<ApiResponse<BudgetCategory>> {
    return apiClient.patch<BudgetCategory>(
      `${this.basePath}/categories/${id}`,
      data
    )
  }

  async deleteCategory(id: string): Promise<ApiResponse<{ success: boolean }>> {
    return apiClient.delete<{ success: boolean }>(
      `${this.basePath}/categories/${id}`
    )
  }

  // Items CRUD
  async getItems(
    filters?: BudgetFilters
  ): Promise<ApiResponse<PaginatedResponse<BudgetItemDetail>>> {
    const params = new URLSearchParams()
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, String(value))
        }
      })
    }
    
    return apiClient.get<PaginatedResponse<BudgetItemDetail>>(
      `${this.basePath}/items?${params}`
    )
  }

  async getItem(id: string): Promise<ApiResponse<BudgetItemDetail>> {
    return apiClient.get<BudgetItemDetail>(`${this.basePath}/items/${id}`)
  }

  async createItem(data: BudgetItemInsert): Promise<ApiResponse<BudgetItem>> {
    return apiClient.post<BudgetItem>(`${this.basePath}/items`, data)
  }

  async updateItem(
    id: string,
    data: BudgetItemUpdate
  ): Promise<ApiResponse<BudgetItem>> {
    return apiClient.patch<BudgetItem>(`${this.basePath}/items/${id}`, data)
  }

  async deleteItem(id: string): Promise<ApiResponse<{ success: boolean }>> {
    return apiClient.delete<{ success: boolean }>(`${this.basePath}/items/${id}`)
  }

  // Bulk operations
  async bulkCreateItems(
    items: BudgetItemInsert[]
  ): Promise<ApiResponse<BudgetItem[]>> {
    return apiClient.post<BudgetItem[]>(`${this.basePath}/items/bulk`, { items })
  }

  async bulkUpdateItems(
    updates: { id: string; data: BudgetItemUpdate }[]
  ): Promise<ApiResponse<BudgetItem[]>> {
    return apiClient.patch<BudgetItem[]>(`${this.basePath}/items/bulk`, {
      updates
    })
  }

  // Payment tracking
  async recordPayment(
    itemId: string,
    payment: {
      amount: number
      date: string
      method?: string
      reference?: string
      notes?: string
    }
  ): Promise<ApiResponse<{ id: string }>> {
    return apiClient.post<{ id: string }>(
      `${this.basePath}/items/${itemId}/payments`,
      payment
    )
  }

  // Budget templates
  async getTemplates(
    type?: 'small' | 'medium' | 'large'
  ): Promise<ApiResponse<{
    templates: {
      id: string
      name: string
      type: string
      total_budget: number
      categories: {
        name: string
        percentage: number
        suggested_amount: number
      }[]
    }[]
  }>> {
    const params = type ? `?type=${type}` : ''
    return apiClient.get(`${this.basePath}/templates${params}`)
  }

  async applyTemplate(
    templateId: string,
    totalBudget: number
  ): Promise<ApiResponse<{ success: boolean; categories_created: number }>> {
    return apiClient.post(`${this.basePath}/templates/${templateId}/apply`, {
      total_budget: totalBudget
    })
  }

  // Export budget
  async exportBudget(
    format: 'csv' | 'xlsx' | 'pdf'
  ): Promise<ApiResponse<{ url: string }>> {
    return apiClient.get(`${this.basePath}/export?format=${format}`)
  }

  // Budget recommendations
  async getRecommendations(): Promise<ApiResponse<{
    recommendations: {
      type: 'save' | 'reallocate' | 'warning'
      title: string
      description: string
      potential_savings?: number
      action?: {
        label: string
        category_id?: string
        suggested_amount?: number
      }
    }[]
  }>> {
    return apiClient.get(`${this.basePath}/recommendations`)
  }
}

export const budgetApi = new BudgetApiService()