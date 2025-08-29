export const IS_PROD = process.env.NODE_ENV === 'production'
export const USE_TEMP_STORAGE_FALLBACK = process.env.USE_TEMP_STORAGE_FALLBACK === 'true' && !IS_PROD
export const ALLOW_TEMP_SEED_ON_EMPTY = process.env.ALLOW_TEMP_SEED_ON_EMPTY === 'true' && !IS_PROD

export function boolEnv(name: string, defaultValue = false) {
  const v = process.env[name]
  if (v === 'true') return true
  if (v === 'false') return false
  return defaultValue
}

