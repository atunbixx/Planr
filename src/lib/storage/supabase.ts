let supabaseLib: any | null | undefined
let supabaseClient: any | null | undefined

export function isSupabaseEnabled() {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.SUPABASE_STORAGE_BUCKET)
}

export function getSupabaseAdmin(): any | null {
  if (!isSupabaseEnabled()) return null
  if (supabaseClient === undefined) {
    try {
      // Lazy require to avoid dependency when not configured
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      supabaseLib = require('@supabase/supabase-js')
      supabaseClient = supabaseLib.createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
        auth: { persistSession: false },
      })
    } catch (_) {
      supabaseClient = null
    }
  }
  return supabaseClient || null
}

export async function uploadBufferToSupabase(key: string, buffer: Buffer, contentType?: string) {
  const sb = getSupabaseAdmin()
  if (!sb) throw new Error('Supabase not configured')
  const bucket = process.env.SUPABASE_STORAGE_BUCKET as string
  const { error } = await sb.storage.from(bucket).upload(key, buffer, { contentType, upsert: true })
  if (error) throw error
  return getSupabasePublicUrl(key)
}

export function getSupabasePublicUrl(key: string) {
  const sb = getSupabaseAdmin()
  if (!sb) return null
  const bucket = process.env.SUPABASE_STORAGE_BUCKET as string
  const { data } = sb.storage.from(bucket).getPublicUrl(key)
  return data?.publicUrl || null
}

