import { z } from 'zod'

export const signupSchema = z.object({
  email: z
    .string()
    .email('Please enter a valid email address')
    .toLowerCase()
    .trim(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters long')
    .regex(/(?=.*[a-z])/, 'Password must contain at least one lowercase letter')
    .regex(/(?=.*[A-Z])/, 'Password must contain at least one uppercase letter')
    .regex(/(?=.*\d)/, 'Password must contain at least one number')
    .regex(/(?=.*[^a-zA-Z0-9])/, 'Password must contain at least one special character'),
  role: z.enum(['couple', 'planner', 'vendor']).default('couple')
})

export const signinSchema = z.object({
  email: z
    .string()
    .email('Please enter a valid email address')
    .toLowerCase()
    .trim(),
  password: z
    .string()
    .min(1, 'Password is required')
})

export const weddingDetailsSchema = z.object({
  venue: z.string().optional(),
  weddingDate: z.string().optional(), // Accept any string format for date
  budget: z.number().positive().optional(),
  guestCount: z.number().positive().int().optional()
})

export type SignupInput = z.infer<typeof signupSchema>
export type SigninInput = z.infer<typeof signinSchema>
export type WeddingDetailsInput = z.infer<typeof weddingDetailsSchema>