import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
})

// Helper functions for common operations
export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error) throw error
  return user
}

export const getCurrentCouple = async () => {
  const user = await getCurrentUser()
  if (!user) return null

  const { data: couple, error } = await supabase
    .from('couples')
    .select('*')
    .or(`partner1_user_id.eq.${user.id},partner2_user_id.eq.${user.id}`)
    .single()

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching couple:', error)
    throw error
  }

  return couple
}

// Activity logging helper with bulletproof error handling
export const logActivity = async (
  coupleId: string,
  userId: string,
  actionType: Database['public']['Enums']['activity_type'],
  entityType: string,
  entityId: string,
  entityName?: string,
  details?: any
) => {
  try {
    const { data, error } = await supabase.rpc('log_wedding_activity', {
      p_couple_id: coupleId,
      p_user_id: userId,
      p_action_type: actionType,
      p_entity_type: entityType,
      p_entity_id: entityId,
      p_entity_name: entityName,
      p_details: details || {}
    })

    if (error) {
      console.warn('Activity logging failed but continuing:', error)
      return null
    }

    return data
  } catch (err) {
    console.warn('Activity logging exception but continuing:', err)
    return null
  }
}