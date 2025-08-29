export type CacheProfile = 'none' | 'short-private-swr' | 'short-public-swr'

export function cacheHeaders(profile: CacheProfile = 'short-private-swr') {
  switch (profile) {
    case 'none':
      return { 'cache-control': 'no-store' }
    case 'short-public-swr':
      return { 'cache-control': 'public, max-age=30, stale-while-revalidate=120' }
    case 'short-private-swr':
    default:
      return { 'cache-control': 'private, max-age=30, stale-while-revalidate=120' }
  }
}

