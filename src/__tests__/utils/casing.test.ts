/**
 * Tests for casing transformation utilities
 */

import {
  camelToSnake,
  snakeToCamel,
  objectToSnakeCase,
  objectToCamelCase,
  normalizeInput,
  legacyOutput,
  detectCasingStyle,
  smartNormalize,
  validateCamelCase,
  applyFieldMappings,
  applyReverseFieldMappings,
  FIELD_MAPPINGS
} from '@/lib/utils/casing'

describe('String Casing Transformations', () => {
  describe('camelToSnake', () => {
    it('should convert camelCase to snake_case', () => {
      expect(camelToSnake('firstName')).toBe('first_name')
      expect(camelToSnake('attendingCount')).toBe('attending_count')
      expect(camelToSnake('invitationSentAt')).toBe('invitation_sent_at')
      expect(camelToSnake('rsvpDeadline')).toBe('rsvp_deadline')
    })

    it('should handle single words', () => {
      expect(camelToSnake('name')).toBe('name')
      expect(camelToSnake('email')).toBe('email')
    })

    it('should handle empty strings', () => {
      expect(camelToSnake('')).toBe('')
    })
  })

  describe('snakeToCamel', () => {
    it('should convert snake_case to camelCase', () => {
      expect(snakeToCamel('first_name')).toBe('firstName')
      expect(snakeToCamel('attending_count')).toBe('attendingCount')
      expect(snakeToCamel('invitation_sent_at')).toBe('invitationSentAt')
      expect(snakeToCamel('rsvp_deadline')).toBe('rsvpDeadline')
    })

    it('should handle single words', () => {
      expect(snakeToCamel('name')).toBe('name')
      expect(snakeToCamel('email')).toBe('email')
    })

    it('should handle empty strings', () => {
      expect(snakeToCamel('')).toBe('')
    })
  })
})

describe('Object Casing Transformations', () => {
  describe('objectToSnakeCase', () => {
    it('should convert object keys to snake_case', () => {
      const input = {
        firstName: 'John',
        lastName: 'Doe',
        attendingCount: 2,
        invitationSentAt: new Date('2024-01-01'),
        nested: {
          rsvpDeadline: new Date('2024-02-01'),
          dietaryRestrictions: 'Vegetarian'
        }
      }

      const expected = {
        first_name: 'John',
        last_name: 'Doe',
        attending_count: 2,
        invitation_sent_at: new Date('2024-01-01'),
        nested: {
          rsvp_deadline: new Date('2024-02-01'),
          dietary_restrictions: 'Vegetarian'
        }
      }

      expect(objectToSnakeCase(input)).toEqual(expected)
    })

    it('should handle arrays with objects', () => {
      const input = {
        guests: [
          { firstName: 'John', attendingCount: 1 },
          { firstName: 'Jane', attendingCount: 2 }
        ]
      }

      const expected = {
        guests: [
          { first_name: 'John', attending_count: 1 },
          { first_name: 'Jane', attending_count: 2 }
        ]
      }

      expect(objectToSnakeCase(input)).toEqual(expected)
    })

    it('should preserve non-object values', () => {
      expect(objectToSnakeCase(null)).toBe(null)
      expect(objectToSnakeCase('string')).toBe('string')
      expect(objectToSnakeCase(123)).toBe(123)
      expect(objectToSnakeCase([1, 2, 3])).toEqual([1, 2, 3])
    })
  })

  describe('objectToCamelCase', () => {
    it('should convert object keys to camelCase', () => {
      const input = {
        first_name: 'John',
        last_name: 'Doe',
        attending_count: 2,
        invitation_sent_at: new Date('2024-01-01'),
        nested: {
          rsvp_deadline: new Date('2024-02-01'),
          dietary_restrictions: 'Vegetarian'
        }
      }

      const expected = {
        firstName: 'John',
        lastName: 'Doe',
        attendingCount: 2,
        invitationSentAt: new Date('2024-01-01'),
        nested: {
          rsvpDeadline: new Date('2024-02-01'),
          dietaryRestrictions: 'Vegetarian'
        }
      }

      expect(objectToCamelCase(input)).toEqual(expected)
    })
  })
})

describe('Field Mappings', () => {
  describe('applyFieldMappings', () => {
    it('should apply critical field mappings', () => {
      const input = {
        partner1_user_id: 'user1',
        partner2_user_id: 'user2',
        budget_total: 50000,
        other_field: 'unchanged'
      }

      const expected = {
        partner1UserId: 'user1',
        partner2UserId: 'user2',
        totalBudget: 50000,
        other_field: 'unchanged'
      }

      expect(applyFieldMappings(input)).toEqual(expected)
    })

    it('should handle missing mapped fields', () => {
      const input = {
        normal_field: 'value',
        another_field: 'value2'
      }

      expect(applyFieldMappings(input)).toEqual(input)
    })
  })

  describe('applyReverseFieldMappings', () => {
    it('should apply reverse field mappings', () => {
      const input = {
        partner1UserId: 'user1',
        partner2UserId: 'user2',
        totalBudget: 50000,
        otherField: 'unchanged'
      }

      const expected = {
        partner1_user_id: 'user1',
        partner2_user_id: 'user2',
        budget_total: 50000,
        otherField: 'unchanged'
      }

      expect(applyReverseFieldMappings(input)).toEqual(expected)
    })
  })
})

describe('Comprehensive Transformations', () => {
  describe('normalizeInput', () => {
    it('should normalize snake_case input to camelCase with field mappings', () => {
      const input = {
        first_name: 'John',
        partner1_user_id: 'user1',
        attending_count: 2,
        invitation_sent_at: '2024-01-01',
        normal_field: 'value'
      }

      const result = normalizeInput(input)

      expect(result).toEqual({
        firstName: 'John',
        partner1UserId: 'user1',
        attendingCount: 2,
        invitationSentAt: '2024-01-01',
        normalField: 'value'
      })
    })
  })

  describe('legacyOutput', () => {
    it('should convert camelCase to snake_case with reverse field mappings', () => {
      const input = {
        firstName: 'John',
        partner1UserId: 'user1',
        attendingCount: 2,
        invitationSentAt: '2024-01-01',
        normalField: 'value'
      }

      const result = legacyOutput(input)

      expect(result).toEqual({
        first_name: 'John',
        partner1_user_id: 'user1',
        attending_count: 2,
        invitation_sent_at: '2024-01-01',
        normal_field: 'value'
      })
    })
  })
})

describe('Casing Detection', () => {
  describe('detectCasingStyle', () => {
    it('should detect snake_case style', () => {
      const snakeObj = {
        first_name: 'John',
        last_name: 'Doe',
        attending_count: 2
      }

      expect(detectCasingStyle(snakeObj)).toBe('snake_case')
    })

    it('should detect camelCase style', () => {
      const camelObj = {
        firstName: 'John',
        lastName: 'Doe',
        attendingCount: 2
      }

      expect(detectCasingStyle(camelObj)).toBe('camelCase')
    })

    it('should default to camelCase for mixed or unclear objects', () => {
      const mixedObj = {
        name: 'John',
        value: 123
      }

      expect(detectCasingStyle(mixedObj)).toBe('camelCase')
    })
  })

  describe('smartNormalize', () => {
    it('should normalize snake_case objects', () => {
      const input = {
        first_name: 'John',
        attending_count: 2
      }

      const result = smartNormalize(input)

      expect(result).toEqual({
        firstName: 'John',
        attendingCount: 2
      })
    })

    it('should preserve camelCase objects', () => {
      const input = {
        firstName: 'John',
        attendingCount: 2
      }

      const result = smartNormalize(input)

      expect(result).toEqual(input)
    })
  })
})

describe('Validation', () => {
  describe('validateCamelCase', () => {
    it('should validate camelCase compliance', () => {
      const validObj = {
        firstName: 'John',
        lastName: 'Doe',
        attendingCount: 2,
        nested: {
          rsvpDeadline: '2024-01-01'
        }
      }

      const result = validateCamelCase(validObj)
      expect(result.isValid).toBe(true)
      expect(result.violations).toEqual([])
    })

    it('should detect snake_case violations', () => {
      const invalidObj = {
        firstName: 'John',
        last_name: 'Doe',
        attending_count: 2,
        nested: {
          rsvp_deadline: '2024-01-01'
        }
      }

      const result = validateCamelCase(invalidObj)
      expect(result.isValid).toBe(false)
      expect(result.violations).toContain('last_name: snake_case key "last_name"')
      expect(result.violations).toContain('attending_count: snake_case key "attending_count"')
      expect(result.violations).toContain('nested.rsvp_deadline: snake_case key "rsvp_deadline"')
    })

    it('should handle empty objects', () => {
      const result = validateCamelCase({})
      expect(result.isValid).toBe(true)
      expect(result.violations).toEqual([])
    })

    it('should handle non-object inputs', () => {
      const result = validateCamelCase(null as any)
      expect(result.isValid).toBe(true)
      expect(result.violations).toEqual([])
    })
  })
})

describe('Field Mappings Constants', () => {
  it('should have correct field mappings', () => {
    expect(FIELD_MAPPINGS.partner1_user_id).toBe('partner1UserId')
    expect(FIELD_MAPPINGS.partner2_user_id).toBe('partner2UserId')
    expect(FIELD_MAPPINGS.budget_total).toBe('totalBudget')
    expect(FIELD_MAPPINGS.invitation_sent_at).toBe('invitationSentAt')
    expect(FIELD_MAPPINGS.rsvp_deadline).toBe('rsvpDeadline')
    expect(FIELD_MAPPINGS.attending_count).toBe('attendingCount')
    expect(FIELD_MAPPINGS.couple_id).toBe('coupleId')
    expect(FIELD_MAPPINGS.invited_at).toBe('invitedAt')
    expect(FIELD_MAPPINGS.industry_typical).toBe('industryTypical')
    expect(FIELD_MAPPINGS.display_order).toBe('displayOrder')
    expect(FIELD_MAPPINGS.updated_at).toBe('updatedAt')
    expect(FIELD_MAPPINGS.created_at).toBe('createdAt')
  })
})