import { createClient } from '@supabase/supabase-js'

// Create a function to get the Supabase admin client
export function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase admin environment variables')
  }
  
  return createClient(supabaseUrl, supabaseServiceKey)
}