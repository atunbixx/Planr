import { createClient } from '@supabase/supabase-js'
import { transformToCamelCase, transformToSnakeCase } from '@/lib/db/field-mappings'

/**
 * Simple wrapper that provides manual transformation helpers
 * This is more reliable than complex proxy interception
 */
export function getTransformingSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!supabaseUrl) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL environment variable")
  }
  
  const key = supabaseServiceKey || supabaseAnonKey
  
  if (!key) {
    throw new Error("Missing both SUPABASE_SERVICE_ROLE_KEY and NEXT_PUBLIC_SUPABASE_ANON_KEY")
  }
  
  const client = createClient(supabaseUrl, key)
  
  return {
    // Expose the raw client for complex operations
    raw: client,
    
    // Helper for simple selects with automatic transformation
    async selectFrom(table: string, options: {
      select?: string
      where?: Record<string, any>
      eq?: [string, any][]
      limit?: number
      order?: [string, { ascending?: boolean }]
      single?: boolean
    } = {}) {
      let query = client.from(table)
      
      if (options.select) {
        query = query.select(options.select)
      } else {
        query = query.select('*')
      }
      
      // Apply eq filters with field name transformation
      if (options.eq) {
        options.eq.forEach(([field, value]) => {
          const snakeField = field.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`)
          query = query.eq(snakeField, value)
        })
      }
      
      // Apply other where conditions
      if (options.where) {
        Object.entries(options.where).forEach(([field, value]) => {
          const snakeField = field.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`)
          query = query.eq(snakeField, value)
        })
      }
      
      // Apply ordering
      if (options.order) {
        const [field, orderOptions] = options.order
        const snakeField = field.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`)
        query = query.order(snakeField, orderOptions)
      }
      
      // Apply limit
      if (options.limit) {
        query = query.limit(options.limit)
      }
      
      // Execute query
      const result = options.single ? await query.single() : await query
      
      // Transform results
      if (result.data) {
        result.data = Array.isArray(result.data)
          ? result.data.map(item => transformToCamelCase(item))
          : transformToCamelCase(result.data)
      }
      
      return result
    },
    
    // Helper for inserts
    async insertInto(table: string, data: any) {
      const snakeData = Array.isArray(data) 
        ? data.map(item => transformToSnakeCase(item))
        : transformToSnakeCase(data)
      
      const result = await client.from(table).insert(snakeData).select()
      
      if (result.data) {
        result.data = Array.isArray(result.data)
          ? result.data.map(item => transformToCamelCase(item))
          : transformToCamelCase(result.data)
      }
      
      return result
    },
    
    // Helper for updates
    async updateIn(table: string, data: any, where: Record<string, any>) {
      const snakeData = transformToSnakeCase(data)
      const snakeWhere = transformToSnakeCase(where)
      
      let query = client.from(table).update(snakeData)
      
      Object.entries(snakeWhere).forEach(([field, value]) => {
        query = query.eq(field, value)
      })
      
      const result = await query.select()
      
      if (result.data) {
        result.data = Array.isArray(result.data)
          ? result.data.map(item => transformToCamelCase(item))
          : transformToCamelCase(result.data)
      }
      
      return result
    }
  }
}