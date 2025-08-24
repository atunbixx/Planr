import { describe, it, expect, beforeEach, vi } from 'vitest'
import { PricebookService } from '../pricebook.service'

describe('PricebookService', () => {
  let pricebookService: PricebookService

  beforeEach(() => {
    pricebookService = new PricebookService()
  })

  describe('getPricing', () => {
    it('should get email pricing for Nigeria', () => {
      const result = pricebookService.getPricing('email', 'NG')
      
      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
      expect(result.data?.cost).toBe(1)
      expect(result.data?.currency).toBe('credits')
      expect(result.data?.provider).toBe('resend')
      expect(result.data?.country).toBe('NG')
      expect(result.data?.channel).toBe('email')
    })

    it('should get SMS pricing for US', () => {
      const result = pricebookService.getPricing('sms', 'US')
      
      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
      expect(result.data?.cost).toBe(10)
      expect(result.data?.provider).toBe('twilio')
      expect(result.data?.country).toBe('US')
      expect(result.data?.channel).toBe('sms')
    })

    it('should get WhatsApp pricing for Nigeria', () => {
      const result = pricebookService.getPricing('whatsapp', 'NG')
      
      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
      expect(result.data?.cost).toBe(2)
      expect(result.data?.provider).toBe('twilio')
      expect(result.data?.country).toBe('NG')
      expect(result.data?.channel).toBe('whatsapp')
    })

    it('should use default pricing for unsupported country', () => {
      const result = pricebookService.getPricing('email', 'XX' as any)
      
      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
      expect(result.data?.cost).toBe(1) // Default email cost
      expect(result.data?.country).toBe('NG') // Default country
    })

    it('should use default pricing when no country specified', () => {
      const result = pricebookService.getPricing('sms')
      
      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
      expect(result.data?.cost).toBe(5) // Nigeria SMS cost
      expect(result.data?.country).toBe('NG')
    })

    it('should return error for unsupported channel', () => {
      const result = pricebookService.getPricing('invalid' as any)
      
      expect(result.success).toBe(false)
      expect(result.error?.code).toBe('UNSUPPORTED_CHANNEL')
    })
  })

  describe('getCost', () => {
    it('should return cost for valid channel and country', () => {
      const cost = pricebookService.getCost('sms', 'US')
      expect(cost).toBe(10)
    })

    it('should return default cost for invalid channel', () => {
      const cost = pricebookService.getCost('invalid' as any)
      expect(cost).toBe(1) // Fallback default
    })
  })

  describe('getProvider', () => {
    it('should get provider for email', () => {
      const result = pricebookService.getProvider('email', 'NG')
      
      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
      expect(result.data?.name).toBe('Resend')
      expect(result.data?.type).toBe('email')
      expect(result.data?.supportedChannels).toContain('email')
    })

    it('should get provider for SMS', () => {
      const result = pricebookService.getProvider('sms', 'US')
      
      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
      expect(result.data?.name).toBe('Twilio')
      expect(result.data?.type).toBe('multi')
      expect(result.data?.supportedChannels).toContain('sms')
    })
  })

  describe('getTemplate', () => {
    it('should get wedding invite template', () => {
      const result = pricebookService.getTemplate('wedding_invite')
      
      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
      expect(result.data?.name).toBe('Wedding Invitation')
      expect(result.data?.channels).toContain('email')
      expect(result.data?.variables).toContain('couple_names')
    })

    it('should return error for non-existent template', () => {
      const result = pricebookService.getTemplate('non_existent')
      
      expect(result.success).toBe(false)
      expect(result.error?.code).toBe('TEMPLATE_NOT_FOUND')
    })
  })

  describe('channel and country validation', () => {
    it('should validate supported channels', () => {
      expect(pricebookService.isChannelSupported('email')).toBe(true)
      expect(pricebookService.isChannelSupported('sms')).toBe(true)
      expect(pricebookService.isChannelSupported('whatsapp')).toBe(true)
      expect(pricebookService.isChannelSupported('invalid')).toBe(false)
    })

    it('should validate supported countries for channels', () => {
      expect(pricebookService.isCountrySupported('email', 'NG')).toBe(true)
      expect(pricebookService.isCountrySupported('email', 'US')).toBe(true)
      expect(pricebookService.isCountrySupported('email', 'XX')).toBe(false)
      
      expect(pricebookService.isCountrySupported('sms', 'NG')).toBe(true)
      expect(pricebookService.isCountrySupported('sms', 'IN')).toBe(true)
      expect(pricebookService.isCountrySupported('sms', 'XX')).toBe(false)
    })

    it('should get supported countries for channel', () => {
      const emailCountries = pricebookService.getSupportedCountries('email')
      expect(emailCountries).toContain('NG')
      expect(emailCountries).toContain('US')
      expect(emailCountries).toContain('UK')
      
      const smsCountries = pricebookService.getSupportedCountries('sms')
      expect(smsCountries).toContain('NG')
      expect(smsCountries).toContain('US')
      expect(smsCountries).toContain('IN')
    })

    it('should get all supported channels', () => {
      const channels = pricebookService.getSupportedChannels()
      expect(channels).toContain('email')
      expect(channels).toContain('sms')
      expect(channels).toContain('whatsapp')
    })
  })

  describe('limits', () => {
    it('should get rate limits', () => {
      const limits = pricebookService.getLimits()
      
      expect(limits.daily.email).toBe(1000)
      expect(limits.daily.sms).toBe(500)
      expect(limits.monthly.email).toBe(25000)
      expect(limits.burst.email).toBe(50)
    })

    it('should check if limit is exceeded', () => {
      expect(pricebookService.isLimitExceeded('email', 'daily', 999)).toBe(false)
      expect(pricebookService.isLimitExceeded('email', 'daily', 1000)).toBe(true)
      expect(pricebookService.isLimitExceeded('email', 'daily', 1001)).toBe(true)
    })
  })

  describe('bulk pricing', () => {
    it('should calculate bulk pricing correctly', () => {
      const messages = [
        { channel: 'email' as const, country: 'NG' as const },
        { channel: 'sms' as const, country: 'US' as const },
        { channel: 'whatsapp' as const, country: 'NG' as const }
      ]

      const result = pricebookService.getBulkPricing(messages)
      
      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
      expect(result.data?.totalCost).toBe(13) // 1 + 10 + 2
      expect(result.data?.breakdown).toHaveLength(3)
      expect(result.data?.currency).toBe('credits')
      
      // Check individual breakdown
      expect(result.data?.breakdown[0].cost).toBe(1)
      expect(result.data?.breakdown[1].cost).toBe(10)
      expect(result.data?.breakdown[2].cost).toBe(2)
    })

    it('should handle empty message list', () => {
      const result = pricebookService.getBulkPricing([])
      
      expect(result.success).toBe(true)
      expect(result.data?.totalCost).toBe(0)
      expect(result.data?.breakdown).toHaveLength(0)
    })
  })

  describe('country pricing summary', () => {
    it('should get pricing summary for Nigeria', () => {
      const result = pricebookService.getCountryPricingSummary('NG')
      
      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
      expect(result.data?.email.cost).toBe(1)
      expect(result.data?.sms.cost).toBe(5)
      expect(result.data?.whatsapp.cost).toBe(2)
    })

    it('should get pricing summary for US', () => {
      const result = pricebookService.getCountryPricingSummary('US')
      
      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
      expect(result.data?.email.cost).toBe(1)
      expect(result.data?.sms.cost).toBe(10)
      expect(result.data?.whatsapp.cost).toBe(3)
    })
  })

  describe('template validation', () => {
    it('should validate template variables correctly', () => {
      const variables = {
        couple_names: 'John & Jane',
        wedding_date: '2024-06-15',
        venue_name: 'Grand Hotel',
        rsvp_link: 'https://planr.app/rsvp/123',
        guest_name: 'Alice Smith'
      }

      const result = pricebookService.validateTemplateVariables('wedding_invite', variables)
      
      expect(result.success).toBe(true)
      expect(result.data?.valid).toBe(true)
      expect(result.data?.missing).toHaveLength(0)
      expect(result.data?.extra).toHaveLength(0)
    })

    it('should detect missing variables', () => {
      const variables = {
        couple_names: 'John & Jane',
        wedding_date: '2024-06-15'
        // Missing: venue_name, rsvp_link, guest_name
      }

      const result = pricebookService.validateTemplateVariables('wedding_invite', variables)
      
      expect(result.success).toBe(true)
      expect(result.data?.valid).toBe(false)
      expect(result.data?.missing).toContain('venue_name')
      expect(result.data?.missing).toContain('rsvp_link')
      expect(result.data?.missing).toContain('guest_name')
    })

    it('should detect extra variables', () => {
      const variables = {
        couple_names: 'John & Jane',
        wedding_date: '2024-06-15',
        venue_name: 'Grand Hotel',
        rsvp_link: 'https://planr.app/rsvp/123',
        guest_name: 'Alice Smith',
        extra_field: 'Extra value'
      }

      const result = pricebookService.validateTemplateVariables('wedding_invite', variables)
      
      expect(result.success).toBe(true)
      expect(result.data?.valid).toBe(true) // Still valid even with extra
      expect(result.data?.missing).toHaveLength(0)
      expect(result.data?.extra).toContain('extra_field')
    })
  })

  describe('retry policy', () => {
    it('should get retry policy configuration', () => {
      const policy = pricebookService.getRetryPolicy()
      
      expect(policy.maxRetries).toBe(3)
      expect(policy.backoffMultiplier).toBe(2)
      expect(policy.initialDelayMs).toBe(1000)
    })
  })

  describe('metadata', () => {
    it('should get pricebook metadata', () => {
      const metadata = pricebookService.getMetadata()
      
      expect(metadata.version).toBe('1.0')
      expect(metadata.supportedCountries).toContain('NG')
      expect(metadata.supportedCountries).toContain('US')
      expect(metadata.defaultCountry).toBe('NG')
      expect(metadata.lastLoaded).toBeInstanceOf(Date)
    })
  })

  describe('pricebook refresh', () => {
    it('should check if refresh is needed', () => {
      // Fresh service shouldn't need refresh
      expect(pricebookService.needsRefresh()).toBe(false)
    })

    it('should reload pricebook successfully when no external URL', async () => {
      const result = await pricebookService.reloadPricebook()
      
      expect(result.success).toBe(true)
      expect(result.data).toBe(true)
    })
  })
})