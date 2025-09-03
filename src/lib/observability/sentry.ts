let initialized = false

export function initSentry() {
  if (initialized) return
  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN
  if (!dsn) return
  // Optional dynamic import; if package not installed, fail gracefully
  ;(async () => {
    try {
      const mod = await import('@sentry/nextjs').catch(() => null as any)
      if (!mod) return
      mod.init({ dsn, tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE || '0'), replaysSessionSampleRate: 0 })
      initialized = true
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn('Sentry init skipped:', e)
    }
  })()
}

export function captureException(err: unknown, context?: Record<string, any>) {
  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN
  if (!dsn) {
    // eslint-disable-next-line no-console
    console.error('Error (Sentry disabled):', err, context || {})
    return
  }
  ;(async () => {
    try {
      const mod = await import('@sentry/nextjs').catch(() => null as any)
      if (mod?.captureException) mod.captureException(err, { extra: context })
    } catch {
      // ignore
    }
  })()
}

