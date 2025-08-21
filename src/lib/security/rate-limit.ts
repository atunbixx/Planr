type Bucket = { remaining: number; resetAt: number; limit: number; windowMs: number }

const buckets = new Map<string, Bucket>()

function now() { return Date.now() }

export function checkRateLimit(
  key: string,
  opts?: { windowMs?: number; max?: number }
):
  | { ok: true; remaining: number; limit: number; resetAt: number; windowMs: number }
  | { ok: false; retryAfter: number; remaining: number; limit: number; resetAt: number; windowMs: number } {
  const windowMs = typeof opts?.windowMs === 'number' ? opts!.windowMs : (parseInt(process.env.ADMIN_RL_WINDOW_MS || '60000', 10) || 60000)
  const max = typeof opts?.max === 'number' ? opts!.max : (parseInt(process.env.ADMIN_RL_MAX || '120', 10) || 120)
  const k = `${key}:${Math.floor(now() / windowMs)}`
  const bucket = buckets.get(k)
  if (!bucket) {
    const b: Bucket = { remaining: max - 1, resetAt: Math.floor(now() / windowMs) * windowMs + windowMs, limit: max, windowMs }
    buckets.set(k, b)
    return { ok: true, remaining: b.remaining, limit: b.limit, resetAt: b.resetAt, windowMs: b.windowMs }
  }
  if (bucket.remaining <= 0) {
    return { ok: false, retryAfter: Math.max(0, bucket.resetAt - now()), remaining: 0, limit: bucket.limit, resetAt: bucket.resetAt, windowMs: bucket.windowMs }
  }
  bucket.remaining -= 1
  return { ok: true, remaining: bucket.remaining, limit: bucket.limit, resetAt: bucket.resetAt, windowMs: bucket.windowMs }
}
