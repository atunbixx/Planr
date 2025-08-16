/**
 * Unit tests for GuestCreateIncoming schema and transformations
 */

import { GuestCreateIncoming, mapZodErrors } from '../guest.contract';

describe('GuestCreateIncoming Schema', () => {
  describe('Legacy format transformation', () => {
    it('should transform legacy format to enterprise format', () => {
      const legacyInput = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        phone: '+1234567890',
        relationship: 'friend',
        side: 'bride',
        plusOneAllowed: true,
        plusOneName: 'Jane Doe',
        dietaryRestrictions: 'Vegetarian',
        notes: 'Special seating arrangement needed'
      };

      const result = GuestCreateIncoming.safeParse(legacyInput);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({
          name: 'John Doe',
          hasPlusOne: true,
          relationship: 'friend',
          rsvpStatus: 'pending',
          email: 'john@example.com',
          phone: '+1234567890',
          side: 'bride',
          plusOneName: 'Jane Doe',
          dietaryRestrictions: 'Vegetarian',
          notes: 'Special seating arrangement needed'
        });
      }
    });

    it('should handle single name in legacy format', () => {
      const legacyInput = {
        firstName: 'Alice',
        relationship: 'family'
      };

      const result = GuestCreateIncoming.safeParse(legacyInput);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('Alice');
        expect(result.data.hasPlusOne).toBe(false); // default
        expect(result.data.rsvpStatus).toBe('pending'); // default
      }
    });

    it('should handle empty lastName in legacy format', () => {
      const legacyInput = {
        firstName: 'Bob',
        lastName: '',
        relationship: 'colleague'
      };

      const result = GuestCreateIncoming.safeParse(legacyInput);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('Bob');
      }
    });
  });

  describe('Enterprise format validation', () => {
    it('should accept enterprise format directly', () => {
      const enterpriseInput = {
        name: 'Sarah Johnson',
        email: 'sarah@example.com',
        hasPlusOne: false,
        relationship: 'family',
        rsvpStatus: 'confirmed'
      };

      const result = GuestCreateIncoming.safeParse(enterpriseInput);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(enterpriseInput);
      }
    });

    it('should use provided rsvpStatus in enterprise format', () => {
      const enterpriseInput = {
        name: 'Mike Wilson',
        relationship: 'friend',
        rsvpStatus: 'declined'
      };

      const result = GuestCreateIncoming.safeParse(enterpriseInput);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.rsvpStatus).toBe('declined');
      }
    });
  });

  describe('Validation errors', () => {
    it('should fail when relationship is missing', () => {
      const invalidInput = {
        name: 'Test Guest'
      };

      const result = GuestCreateIncoming.safeParse(invalidInput);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors).toContainEqual(
          expect.objectContaining({
            path: ['relationship'],
            message: expect.stringContaining('required')
          })
        );
      }
    });

    it('should fail when name is missing in enterprise format', () => {
      const invalidInput = {
        relationship: 'friend'
      };

      const result = GuestCreateIncoming.safeParse(invalidInput);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors).toContainEqual(
          expect.objectContaining({
            path: expect.any(Array)
          })
        );
      }
    });

    it('should fail when firstName is missing in legacy format', () => {
      const invalidInput = {
        lastName: 'Smith',
        relationship: 'friend'
      };

      const result = GuestCreateIncoming.safeParse(invalidInput);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors).toContainEqual(
          expect.objectContaining({
            path: expect.any(Array)
          })
        );
      }
    });
  });

  describe('mapZodErrors utility', () => {
    it('should map required field errors', () => {
      const invalidInput = {};
      const result = GuestCreateIncoming.safeParse(invalidInput);

      expect(result.success).toBe(false);
      if (!result.success) {
        const errors = mapZodErrors(result.error);
        expect(errors.relationship).toBe('This field is required');
      }
    });

    it('should provide user-friendly messages for email validation', () => {
      const invalidInput = {
        name: 'Test',
        relationship: 'friend',
        email: 'invalid-email'
      };

      const result = GuestCreateIncoming.safeParse(invalidInput);

      expect(result.success).toBe(false);
      if (!result.success) {
        const errors = mapZodErrors(result.error);
        expect(errors.email).toBe('Please enter a valid email address');
      }
    });

    it('should handle nested field errors', () => {
      // This would test more complex nested structures if they existed
      const errors = mapZodErrors(new Error('test') as any);
      expect(errors).toEqual({});
    });
  });

  describe('Edge cases', () => {
    it('should handle boolean field defaults', () => {
      const minimalInput = {
        name: 'Test Guest',
        relationship: 'family'
      };

      const result = GuestCreateIncoming.safeParse(minimalInput);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.hasPlusOne).toBe(false);
        expect(result.data.rsvpStatus).toBe('pending');
      }
    });

    it('should preserve optional fields when not provided', () => {
      const input = {
        name: 'Jane Smith',
        relationship: 'colleague',
        hasPlusOne: true
      };

      const result = GuestCreateIncoming.safeParse(input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBeUndefined();
        expect(result.data.phone).toBeUndefined();
        expect(result.data.plusOneName).toBeUndefined();
      }
    });
  });
});