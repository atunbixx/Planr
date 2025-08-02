// Settings-related TypeScript types

import { z } from 'zod'

// Profile Settings Schema
export const profileSettingsSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  email: z.string().email("Invalid email address"),
  weddingDate: z.string().optional(),
  partnerName: z.string().optional(),
  venue: z.string().optional(),
  guestCount: z.string().optional(),
  avatarUrl: z.string().url().optional()
})

export type ProfileSettings = z.infer<typeof profileSettingsSchema>

// Notification Preferences Schema
export const notificationPreferencesSchema = z.object({
  emailUpdates: z.boolean(),
  taskReminders: z.boolean(),
  vendorMessages: z.boolean(),
  guestRsvpAlerts: z.boolean(),
  budgetAlerts: z.boolean(),
  dailyDigest: z.boolean(),
  weeklyReport: z.boolean()
})

export type NotificationPreferences = z.infer<typeof notificationPreferencesSchema>

// Theme Preferences Schema
export const themePreferencesSchema = z.object({
  colorScheme: z.enum(['wedding-blush', 'wedding-sage', 'wedding-cream', 'wedding-navy']),
  fontSize: z.enum(['small', 'medium', 'large']),
  compactMode: z.boolean()
})

export type ThemePreferences = z.infer<typeof themePreferencesSchema>

// Privacy Settings Schema
export const privacySettingsSchema = z.object({
  profileVisibility: z.enum(['private', 'vendors', 'guests']),
  shareWithVendors: z.boolean(),
  allowGuestUploads: z.boolean(),
  dataExport: z.boolean()
})

export type PrivacySettings = z.infer<typeof privacySettingsSchema>

// Password Change Schema
export const passwordChangeSchema = z.object({
  currentPassword: z.string().min(6, "Password must be at least 6 characters"),
  newPassword: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string()
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
})

export type PasswordChange = z.infer<typeof passwordChangeSchema>

// Theme color configuration
export const themeColors = {
  'wedding-blush': {
    name: 'Blush',
    primary: '#F8F0F0',
    secondary: '#F5D5D5',
    accent: '#E8B4B4',
    text: '#4A2020'
  },
  'wedding-sage': {
    name: 'Sage',
    primary: '#9CAF88',
    secondary: '#B5C4A4',
    accent: '#7A8F66',
    text: '#2C3424'
  },
  'wedding-cream': {
    name: 'Cream',
    primary: '#FDF6E3',
    secondary: '#F5E6C8',
    accent: '#E5D4A1',
    text: '#3D3A32'
  },
  'wedding-navy': {
    name: 'Navy',
    primary: '#1E3A8A',
    secondary: '#3B5998',
    accent: '#6B8DD6',
    text: '#FFFFFF'
  }
} as const

// Integration service types
export interface IntegrationService {
  id: string
  name: string
  description: string
  icon: string
  connected: boolean
  scope?: string[]
  lastSynced?: Date
}

// Settings update response
export interface SettingsUpdateResponse {
  success: boolean
  message?: string
  error?: string
}

// All settings combined
export interface UserSettings {
  profile: ProfileSettings
  notifications: NotificationPreferences
  theme: ThemePreferences
  privacy: PrivacySettings
}