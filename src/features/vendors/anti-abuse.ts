import { prisma } from '@/lib/db/prisma'
import { normalizeHostname, normalizeEmail, normalizePhone, normalizeName, stringSimilarity } from '@/lib/utils/normalize'

export type DuplicateCheckResult = {
  isStrongDuplicate: boolean
  strongReason?: 'website'|'email'|'phone'
  matchId?: string
  similarMatches?: Array<{ id: string; name: string; similarity: number }>
}

export async function detectDirectoryDuplicate(input: { id?: string; name?: string; website?: string; email?: string; phone?: string; category?: string; region?: string; ownerUserId?: string }): Promise<DuplicateCheckResult> {
  const websiteHost = normalizeHostname(input.website)
  const emailLower = normalizeEmail(input.email)
  const phoneDigits = normalizePhone(input.phone)
  const nameNorm = normalizeName(input.name)

  // Query candidates by any normalized key
  const whereOr: any[] = []
  if (websiteHost) whereOr.push({ websiteHost })
  if (emailLower) whereOr.push({ emailLower })
  if (phoneDigits) whereOr.push({ phoneDigits })

  let candidates: any[] = []
  if (whereOr.length) {
    candidates = await prisma.directoryVendor.findMany({ where: { OR: whereOr } }).catch(()=>[])
  }

  // Strong duplicate: exact match on normalized website/email/phone with different owner or different id
  for (const c of candidates) {
    if (input.id && c.id === input.id) continue
    const otherOwner = c.ownerUserId && input.ownerUserId && c.ownerUserId !== input.ownerUserId
    const sameHost = websiteHost && c.websiteHost && websiteHost === c.websiteHost
    const sameEmail = emailLower && c.emailLower && emailLower === c.emailLower
    const samePhone = phoneDigits && c.phoneDigits && phoneDigits === c.phoneDigits
    if (sameHost || sameEmail || samePhone) {
      return { isStrongDuplicate: true, strongReason: sameHost ? 'website' : sameEmail ? 'email' : 'phone', matchId: c.id }
    }
  }

  // Fuzzy similar: similar name in same category/region
  const similarWhere: any = { }
  if (input.category) similarWhere.category = input.category
  if (input.region) similarWhere.region = input.region
  const inScope = await prisma.directoryVendor.findMany({ where: similarWhere, take: 100 }).catch(()=>[])
  const similar: Array<{ id: string; name: string; similarity: number }> = []
  for (const c of inScope) {
    if (input.id && c.id === input.id) continue
    const sim = stringSimilarity(nameNorm, c.name || '')
    if (sim >= 0.75) {
      similar.push({ id: c.id, name: c.name, similarity: sim })
    }
  }

  return { isStrongDuplicate: false, similarMatches: similar.sort((a,b)=>b.similarity-a.similarity).slice(0, 5) }
}

export function enrichNormalizedFields(body: any) {
  const websiteHost = normalizeHostname(body?.website)
  const emailLower = normalizeEmail(body?.email)
  const phoneDigits = normalizePhone(body?.phone)
  return { websiteHost: websiteHost || null, emailLower: emailLower || null, phoneDigits: phoneDigits || null }
}

