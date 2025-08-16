/**
 * Unified Guest Creation Contract
 * Accepts both legacy and enterprise input formats
 */

import { z } from 'zod';

const PersonNameSchema = z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters');
const EmailSchema = z.string().email('Invalid email address');
const PhoneSchema = z.string().optional();

// Legacy format (used by frontend)
const LegacyGuestSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().optional(),
  email: EmailSchema.optional(),
  phone: PhoneSchema,
  relationship: z.string().min(1, 'Relationship is required'),
  side: z.enum(['bride', 'groom', 'both']).optional().default('both'),
  plusOneAllowed: z.boolean().default(false),
  plusOneName: z.string().optional(),
  dietaryRestrictions: z.string().optional(),
  notes: z.string().optional(),
  rsvpStatus: z.enum(['pending', 'confirmed', 'declined', 'maybe', 'cancelled']).optional().default('pending')
});

// Enterprise format (used by API)
const EnterpriseGuestSchema = z.object({
  name: PersonNameSchema,
  email: EmailSchema.optional(),
  phone: PhoneSchema,
  relationship: z.string().min(1, 'Relationship is required'),
  side: z.enum(['bride', 'groom', 'both']).optional().default('both'),
  hasPlusOne: z.boolean().default(false),
  plusOneName: z.string().optional(),
  dietaryRestrictions: z.string().optional(),
  notes: z.string().optional(),
  rsvpStatus: z.enum(['pending', 'confirmed', 'declined', 'maybe', 'cancelled']).optional().default('pending')
});

// Unified schema that accepts both formats
export const GuestCreateIncoming = z.union([LegacyGuestSchema, EnterpriseGuestSchema])
  .transform((input) => {
    // Normalize to enterprise format
    if ('name' in input) {
      // Already enterprise format
      return {
        name: input.name,
        hasPlusOne: input.hasPlusOne,
        relationship: input.relationship,
        rsvpStatus: input.rsvpStatus || 'pending',
        email: input.email,
        phone: input.phone,
        side: input.side,
        plusOneName: input.plusOneName,
        dietaryRestrictions: input.dietaryRestrictions,
        notes: input.notes
      };
    } else {
      // Legacy format - transform
      const fullName = `${input.firstName} ${input.lastName || ''}`.trim();
      return {
        name: fullName,
        hasPlusOne: input.plusOneAllowed,
        relationship: input.relationship,
        rsvpStatus: input.rsvpStatus || 'pending',
        email: input.email,
        phone: input.phone,
        side: input.side,
        plusOneName: input.plusOneName,
        dietaryRestrictions: input.dietaryRestrictions,
        notes: input.notes
      };
    }
  });

export type GuestCreateUnified = z.infer<typeof GuestCreateIncoming>;

// Error mapping utility
export function mapZodErrors(error: z.ZodError): Record<string, string> {
  const errors: Record<string, string> = {};
  
  error.errors.forEach((issue) => {
    const field = issue.path.join('.');
    let message = issue.message;
    
    // User-friendly messages
    switch (issue.code) {
      case 'too_small':
        if (issue.minimum === 1) {
          message = 'This field is required';
        }
        break;
      case 'invalid_type':
        if (issue.expected === 'boolean') {
          message = 'Please select true or false';
        }
        break;
      case 'invalid_string':
        if (issue.validation === 'email') {
          message = 'Please enter a valid email address';
        }
        break;
    }
    
    errors[field] = message;
  });
  
  return errors;
}