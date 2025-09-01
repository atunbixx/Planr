let otelApi: any = null

async function load() {
  if (otelApi !== null) return otelApi
  try {
    // Optional import; if not installed, we no-op
    otelApi = await import('@opentelemetry/api')
  } catch (_) {
    otelApi = undefined
  }
  return otelApi
}

export async function startSpan(name: string, attrs?: Record<string, any>) {
  const api = await load()
  const disable = process.env.NEXT_PUBLIC_OTEL_ENABLED !== 'true' && process.env.OTEL_ENABLED !== 'true'
  if (!api || disable) {
    return { end: () => {}, setAttribute: (_k: string, _v: any) => {} }
  }
  const tracer = api.trace.getTracer('wedding-app')
  const span = tracer.startSpan(name)
  if (attrs) Object.entries(attrs).forEach(([k, v]) => span.setAttribute(k, v as any))
  return {
    end: () => span.end(),
    setAttribute: (k: string, v: any) => span.setAttribute(k, v as any),
  }
}

