import { readFileSync } from 'fs'
import { join } from 'path'

export type MessageChannel = 'email' | 'sms' | 'whatsapp'

export interface PricebookEntry {
  channel: MessageChannel
  country?: string
  unitCost: number
}

export interface PricebookConfig {
  version: string
  lastUpdated: string
  channels: {
    [channel in MessageChannel]: {
      default: number
      countries: Record<string, number>
    }
  }
  metadata: {
    currency: string
    description: string
    notes: string[]
  }
}

export class PricebookService {
  private pricebook: PricebookConfig
  private cache: Map<string, number> = new Map()

  constructor() {
    this.loadPricebook()
  }

  /**
   * Get cost for sending a message via specific channel and country
   */
  getCost(channel: MessageChannel, country?: string): number {
    // Create cache key
    const cacheKey = `${channel}:${country || 'default'}`
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!
    }

    let cost: number

    // Get channel configuration
    const channelConfig = this.pricebook.channels[channel]
    if (!channelConfig) {
      throw new Error(`Unsupported message channel: ${channel}`)
    }

    // Get country-specific price or default
    if (country && channelConfig.countries[country.toUpperCase()]) {
      cost = channelConfig.countries[country.toUpperCase()]
    } else {
      cost = channelConfig.default
    }

    // Cache the result
    this.cache.set(cacheKey, cost)

    return cost
  }

  /**
   * Get all available channels
   */
  getAvailableChannels(): MessageChannel[] {
    return Object.keys(this.pricebook.channels) as MessageChannel[]
  }

  /**
   * Get supported countries for a channel
   */
  getSupportedCountries(channel: MessageChannel): string[] {
    const channelConfig = this.pricebook.channels[channel]
    if (!channelConfig) {
      return []
    }
    return Object.keys(channelConfig.countries)
  }

  /**
   * Get pricing information for a channel
   */
  getChannelPricing(channel: MessageChannel): { default: number; countries: Record<string, number> } | null {
    const channelConfig = this.pricebook.channels[channel]
    if (!channelConfig) {
      return null
    }
    return {
      default: channelConfig.default,
      countries: { ...channelConfig.countries }
    }
  }

  /**
   * Calculate total cost for multiple messages
   */
  calculateBulkCost(messages: Array<{ channel: MessageChannel; country?: string }>): number {
    return messages.reduce((total, message) => {
      return total + this.getCost(message.channel, message.country)
    }, 0)
  }

  /**
   * Get pricebook metadata
   */
  getMetadata(): PricebookConfig['metadata'] {
    return { ...this.pricebook.metadata }
  }

  /**
   * Get pricebook version
   */
  getVersion(): string {
    return this.pricebook.version
  }

  /**
   * Check if country is supported for channel
   */
  isCountrySupported(channel: MessageChannel, country: string): boolean {
    const channelConfig = this.pricebook.channels[channel]
    if (!channelConfig) {
      return false
    }
    return country.toUpperCase() in channelConfig.countries
  }

  /**
   * Get cost comparison across channels for a country
   */
  getChannelComparison(country?: string): Record<MessageChannel, number> {
    const comparison: Record<MessageChannel, number> = {} as any

    for (const channel of this.getAvailableChannels()) {
      comparison[channel] = this.getCost(channel, country)
    }

    return comparison
  }

  /**
   * Find cheapest channel for a country
   */
  getCheapestChannel(country?: string): { channel: MessageChannel; cost: number } {
    const channels = this.getAvailableChannels()
    let cheapest = channels[0]
    let lowestCost = this.getCost(cheapest, country)

    for (const channel of channels.slice(1)) {
      const cost = this.getCost(channel, country)
      if (cost < lowestCost) {
        cheapest = channel
        lowestCost = cost
      }
    }

    return { channel: cheapest, cost: lowestCost }
  }

  /**
   * Validate channel and country combination
   */
  validateChannelCountry(channel: string, country?: string): { valid: boolean; error?: string } {
    // Check if channel is supported
    if (!this.getAvailableChannels().includes(channel as MessageChannel)) {
      return {
        valid: false,
        error: `Unsupported channel: ${channel}. Available channels: ${this.getAvailableChannels().join(', ')}`
      }
    }

    // Country is optional, but if provided, validate format
    if (country && country.length !== 2) {
      return {
        valid: false,
        error: 'Country code must be 2 characters (ISO 3166-1 alpha-2)'
      }
    }

    return { valid: true }
  }

  /**
   * Reload pricebook from file (for hot reloading)
   */
  reloadPricebook(): void {
    this.cache.clear()
    this.loadPricebook()
  }

  /**
   * Get pricing statistics
   */
  getPricingStats(): {
    totalChannels: number
    totalCountries: number
    priceRange: { min: number; max: number }
    averagePrice: number
  } {
    const channels = this.getAvailableChannels()
    const allPrices: number[] = []
    const allCountries = new Set<string>()

    for (const channel of channels) {
      const channelConfig = this.pricebook.channels[channel]
      allPrices.push(channelConfig.default)
      
      for (const [country, price] of Object.entries(channelConfig.countries)) {
        allCountries.add(country)
        allPrices.push(price)
      }
    }

    const minPrice = Math.min(...allPrices)
    const maxPrice = Math.max(...allPrices)
    const averagePrice = allPrices.reduce((sum, price) => sum + price, 0) / allPrices.length

    return {
      totalChannels: channels.length,
      totalCountries: allCountries.size,
      priceRange: { min: minPrice, max: maxPrice },
      averagePrice: Math.round(averagePrice * 100) / 100
    }
  }

  /**
   * Load pricebook from JSON file
   */
  private loadPricebook(): void {
    try {
      // Try to load from environment variable path first
      const pricebookPath = process.env.PRICEBOOK_JSON_URL || 
                           join(__dirname, '../pricebook.json')
      
      const pricebookData = readFileSync(pricebookPath, 'utf8')
      this.pricebook = JSON.parse(pricebookData)

      // Validate pricebook structure
      this.validatePricebook()

      console.log(`Pricebook loaded: version ${this.pricebook.version}, ${this.getAvailableChannels().length} channels`)
    } catch (error) {
      console.error('Failed to load pricebook:', error)
      
      // Fallback to minimal pricebook
      this.pricebook = this.getDefaultPricebook()
      console.warn('Using fallback pricebook configuration')
    }
  }

  /**
   * Validate pricebook structure
   */
  private validatePricebook(): void {
    if (!this.pricebook.version) {
      throw new Error('Pricebook missing version')
    }

    if (!this.pricebook.channels) {
      throw new Error('Pricebook missing channels configuration')
    }

    // Validate each channel
    for (const [channel, config] of Object.entries(this.pricebook.channels)) {
      if (typeof config.default !== 'number' || config.default < 0) {
        throw new Error(`Invalid default price for channel ${channel}`)
      }

      if (!config.countries || typeof config.countries !== 'object') {
        throw new Error(`Invalid countries configuration for channel ${channel}`)
      }

      // Validate country prices
      for (const [country, price] of Object.entries(config.countries)) {
        if (typeof price !== 'number' || price < 0) {
          throw new Error(`Invalid price for ${channel}:${country}`)
        }

        if (country.length !== 2) {
          throw new Error(`Invalid country code: ${country} (must be 2 characters)`)
        }
      }
    }
  }

  /**
   * Get default/fallback pricebook
   */
  private getDefaultPricebook(): PricebookConfig {
    return {
      version: '1.0-fallback',
      lastUpdated: new Date().toISOString(),
      channels: {
        email: {
          default: 1,
          countries: {
            'NG': 1,
            'US': 1,
            'UK': 1
          }
        },
        sms: {
          default: 10,
          countries: {
            'NG': 5,
            'US': 10,
            'UK': 8
          }
        },
        whatsapp: {
          default: 3,
          countries: {
            'NG': 2,
            'US': 3,
            'UK': 3
          }
        }
      },
      metadata: {
        currency: 'credits',
        description: 'Fallback pricing configuration',
        notes: ['This is a fallback configuration used when pricebook.json cannot be loaded']
      }
    }
  }
}