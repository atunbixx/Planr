// Utility functions for null-safe data access

/**
 * Safely access nested properties in objects
 * @example
 * const name = get(user, 'profile.name', 'Unknown')
 * const age = get(user, ['profile', 'age'], 0)
 */
export function get<T = any>(
  obj: any,
  path: string | string[],
  defaultValue?: T
): T {
  const pathArray = Array.isArray(path) ? path : path.split('.')
  
  let result = obj
  for (const key of pathArray) {
    if (result == null) {
      return defaultValue as T
    }
    result = result[key]
  }
  
  return result ?? defaultValue
}

/**
 * Check if a value is not null or undefined
 */
export function isNotNull<T>(value: T | null | undefined): value is T {
  return value != null
}

/**
 * Check if a value is null or undefined
 */
export function isNull(value: any): value is null | undefined {
  return value == null
}

/**
 * Safely parse JSON with a fallback value
 */
export function safeJsonParse<T = any>(
  json: string,
  fallback: T
): T {
  try {
    return JSON.parse(json)
  } catch {
    return fallback
  }
}

/**
 * Create a null-safe wrapper for an object
 */
export function createNullSafeProxy<T extends object>(
  obj: T | null | undefined,
  defaultValue: any = null
): T {
  if (!obj) {
    return new Proxy({} as T, {
      get: () => defaultValue
    })
  }
  
  return new Proxy(obj, {
    get: (target, prop) => {
      const value = target[prop as keyof T]
      if (value == null) {
        return defaultValue
      }
      if (typeof value === 'object' && value !== null) {
        return createNullSafeProxy(value, defaultValue)
      }
      return value
    }
  })
}

/**
 * Safe array operations
 */
export const SafeArray = {
  first<T>(arr: T[] | null | undefined): T | undefined {
    return arr?.[0]
  },
  
  last<T>(arr: T[] | null | undefined): T | undefined {
    return arr?.[arr.length - 1]
  },
  
  map<T, R>(
    arr: T[] | null | undefined,
    fn: (item: T, index: number) => R
  ): R[] {
    return arr?.map(fn) ?? []
  },
  
  filter<T>(
    arr: T[] | null | undefined,
    fn: (item: T, index: number) => boolean
  ): T[] {
    return arr?.filter(fn) ?? []
  },
  
  find<T>(
    arr: T[] | null | undefined,
    fn: (item: T, index: number) => boolean
  ): T | undefined {
    return arr?.find(fn)
  },
  
  slice<T>(
    arr: T[] | null | undefined,
    start?: number,
    end?: number
  ): T[] {
    return arr?.slice(start, end) ?? []
  },
  
  length(arr: any[] | null | undefined): number {
    return arr?.length ?? 0
  }
}

/**
 * Type guard to check if a value is defined
 */
export function isDefined<T>(value: T | undefined): value is T {
  return value !== undefined
}

/**
 * Type guard to check if a value is a non-empty string
 */
export function isNonEmptyString(value: any): value is string {
  return typeof value === 'string' && value.length > 0
}

/**
 * Type guard to check if a value is a number
 */
export function isNumber(value: any): value is number {
  return typeof value === 'number' && !isNaN(value)
}

/**
 * Ensure a value is an array
 */
export function ensureArray<T>(value: T | T[] | null | undefined): T[] {
  if (value == null) return []
  return Array.isArray(value) ? value : [value]
}

/**
 * Safely access and format currency values
 */
export function safeCurrency(
  value: any,
  currency = 'NGN',
  locale = 'en-NG'
): string {
  const num = Number(value)
  if (isNaN(num)) return '$0.00'
  
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency
  }).format(num)
}

/**
 * Safely access and format date values
 */
export function safeDate(
  value: any,
  fallback = 'No date'
): string {
  if (!value) return fallback
  
  try {
    const date = new Date(value)
    if (isNaN(date.getTime())) return fallback
    return date.toLocaleDateString()
  } catch {
    return fallback
  }
}

/**
 * Create a type-safe default object
 */
export function withDefaults<T extends object>(
  obj: Partial<T> | null | undefined,
  defaults: T
): T {
  if (!obj) return defaults
  
  return Object.assign({}, defaults, obj)
}