import { createClient } from '@supabase/supabase-js'
import { createTransformingSupabaseClient } from '@/lib/db/field-mappings'

/**
 * Creates a Supabase admin client with automatic field name transformation
 * This client automatically converts between snake_case (database) and camelCase (application)
 */
export function getSupabaseAdminTransformed() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!supabaseUrl) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL environment variable")
  }
  
  // Use service key if available, otherwise fallback to anon key
  const key = supabaseServiceKey || supabaseAnonKey
  
  if (!key) {
    throw new Error("Missing both SUPABASE_SERVICE_ROLE_KEY and NEXT_PUBLIC_SUPABASE_ANON_KEY")
  }
  
  const rawClient = createClient(supabaseUrl, key)
  return createTransformingSupabaseClient(rawClient)
}

// Export a singleton instance for reuse
let adminClient: ReturnType<typeof getSupabaseAdminTransformed> | null = null

export function getAdminClient() {
  if (!adminClient) {
    adminClient = getSupabaseAdminTransformed()
  }
  return adminClient
}