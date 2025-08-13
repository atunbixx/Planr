/**
 * Data mapping utilities between onboarding flow and application settings
 */

export interface OnboardingData {
  profile?: {
    userName?: string
    partnerName?: string
    role?: string
    country?: string
    currency?: string
  }
  event?: {
    hasDate?: string
    weddingDate?: string
    estimatedMonth?: string
    estimatedYear?: number
    city?: string
    estimatedGuests?: string
  }
  budget?: {
    budgetType?: string
    exactBudget?: string
    budgetTier?: string
    currency?: string
  }
  vendors?: {
    categories?: string[]
  }
  invite?: {
    partnerEmail?: string
    teamEmail?: string
    whatsappLink?: string
  }
  guests?: {
    guests?: Array<{
      name: string
      email?: string
      phone?: string
    }>
  }
}

export interface WeddingSettings {
  partner1Name: string
  partner2Name: string
  weddingDate: string
  venue: string
  location: string
  expectedGuests: number
  totalBudget: number
  weddingStyle: string
  currency?: string
}

/**
 * Map onboarding data to wedding settings format
 */
export function mapOnboardingToSettings(onboardingData: OnboardingData): Partial<WeddingSettings> {
  const { profile, event, budget } = onboardingData

  const settings: Partial<WeddingSettings> = {}

  // Map profile data
  if (profile) {
    if (profile.userName) settings.partner1Name = profile.userName
    if (profile.partnerName) settings.partner2Name = profile.partnerName
    if (profile.currency) settings.currency = profile.currency
  }

  // Map event data
  if (event) {
    if (event.weddingDate) {
      settings.weddingDate = event.weddingDate
    } else if (event.estimatedMonth && event.estimatedYear) {
      // Create approximate date from month/year
      const month = parseInt(event.estimatedMonth) - 1 // JS months are 0-indexed
      const year = event.estimatedYear
      settings.weddingDate = new Date(year, month, 15).toISOString().split('T')[0]
    }
    
    if (event.city) settings.location = event.city
    if (event.estimatedGuests) settings.expectedGuests = parseInt(event.estimatedGuests)
  }

  // Map budget data
  if (budget) {
    if (budget.exactBudget) {
      settings.totalBudget = parseFloat(budget.exactBudget)
    } else if (budget.budgetTier) {
      // Map budget tiers to approximate amounts
      const tierAmounts: Record<string, number> = {
        basic: 25000,
        standard: 50000,
        premium: 100000,
        luxury: 200000
      }
      settings.totalBudget = tierAmounts[budget.budgetTier] || 50000
    }
  }

  return settings
}

/**
 * Map couple record to wedding settings format
 */
export function mapCoupleToSettings(couple: any): Partial<WeddingSettings> {
  const settings: Partial<WeddingSettings> = {}

  if (couple.partner1Name) settings.partner1Name = couple.partner1Name
  if (couple.partner2Name) settings.partner2Name = couple.partner2Name
  if (couple.weddingDate) {
    settings.weddingDate = new Date(couple.weddingDate).toISOString().split('T')[0]
  }
  if (couple.venueLocation) settings.location = couple.venueLocation
  if (couple.guestCountEstimate) settings.expectedGuests = couple.guestCountEstimate
  if (couple.totalBudget) settings.totalBudget = couple.totalBudget
  if (couple.currency) settings.currency = couple.currency
  if (couple.weddingStyle) settings.weddingStyle = couple.weddingStyle

  return settings
}

/**
 * Get budget tier from amount
 */
export function getBudgetTierFromAmount(amount: number, currency: string = 'USD'): string {
  if (currency === 'NGN') {
    if (amount < 5000000) return 'basic'
    if (amount < 15000000) return 'standard'
    if (amount < 30000000) return 'premium'
    return 'luxury'
  } else {
    if (amount < 10000) return 'basic'
    if (amount < 25000) return 'standard'
    if (amount < 50000) return 'premium'
    return 'luxury'
  }
}

/**
 * Get default venue name from city
 */
export function getDefaultVenueName(city: string): string {
  // Common venue suggestions based on city
  const cityVenues: Record<string, string> = {
    lagos: 'TBD - Lagos Venue',
    abuja: 'TBD - Abuja Venue',
    'port harcourt': 'TBD - Port Harcourt Venue',
    kano: 'TBD - Kano Venue',
    ibadan: 'TBD - Ibadan Venue',
    'new york': 'TBD - New York Venue',
    london: 'TBD - London Venue',
    atlanta: 'TBD - Atlanta Venue'
  }

  const lowerCity = city.toLowerCase()
  return cityVenues[lowerCity] || `TBD - ${city} Venue`
}