export type IssueLike = {
  path?: Array<string | number> | string
  field?: string
  message?: string
}

export function formatZodIssues(issues: any): string | null {
  if (!issues) return null
  const arr: IssueLike[] = Array.isArray(issues) ? issues as any[] : []
  if (!arr.length) return null
  const parts = arr.map((i) => {
    const path = Array.isArray(i.path)
      ? i.path.join('.')
      : (typeof i.path === 'string' ? i.path : (i.field || ''))
    const msg = i.message || 'Invalid value'
    return `${path ? `${path}: ` : ''}${msg}`
  })
  return parts.join(' • ')
}

export function formatApiError(err: any, fallback: string): string {
  const base = (err && err.message) || fallback
  const details = formatZodIssues(err?.details)
  return base + (details ? ` — ${details}` : '')
}

