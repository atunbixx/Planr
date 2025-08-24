export function normalizeHostname(input?: string): string {
  const s = String(input || '').trim().toLowerCase()
  if (!s) return ''
  try {
    const withProto = s.startsWith('http://') || s.startsWith('https://') ? s : `https://${s}`
    const url = new URL(withProto)
    return url.hostname.replace(/^www\./, '')
  } catch {
    const noScheme = s.replace(/^https?:\/\//, '')
    return noScheme.split('/')[0].replace(/^www\./, '')
  }
}

export function normalizeEmail(input?: string): string {
  return String(input || '').trim().toLowerCase()
}

export function normalizePhone(input?: string): string {
  return String(input || '').replace(/[^0-9]/g, '')
}

export function normalizeName(input?: string): string {
  return String(input || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

// Simple similarity: Dice coefficient via bigrams for rough fuzzy match
export function stringSimilarity(a: string, b: string): number {
  const s1 = normalizeName(a)
  const s2 = normalizeName(b)
  if (!s1 || !s2) return 0
  if (s1 === s2) return 1
  const bigrams = (s: string) => {
    const arr: string[] = []
    for (let i = 0; i < s.length - 1; i++) arr.push(s.slice(i, i + 2))
    return arr
  }
  const b1 = bigrams(s1)
  const b2 = bigrams(s2)
  const counts = new Map<string, number>()
  for (const bg of b1) counts.set(bg, (counts.get(bg) || 0) + 1)
  let intersection = 0
  for (const bg of b2) {
    const c = counts.get(bg) || 0
    if (c > 0) {
      intersection++
      counts.set(bg, c - 1)
    }
  }
  return (2 * intersection) / (b1.length + b2.length)
}

