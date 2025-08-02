// UPDATED TYPESCRIPT TYPES FOR COUPLES TABLE
// Database Schema Specialist Agent - TypeScript Type Definitions
// Generated: 2025-08-02 - Based on corrected schema

// This file contains the updated TypeScript type definitions to match the corrected database schema

export interface CoupleRow {
  // Existing fields (confirmed in database)
  id: string
  created_at: string | null
  updated_at: string | null
  partner1_name: string
  partner2_name: string
  partner1_user_id: string | null
  partner2_user_id: string | null
  total_budget: number | null
  wedding_date: string | null
  
  // Currency and localization (existing in generated types)
  country: string | null
  currency: string | null
  date_format: string | null
  language: string | null
  number_format: string | null
  region: string | null
  time_format: string | null
  timezone: string | null
  
  // Planning preferences (existing in generated types)
  planning_style: string | null
  priorities: string[] | null
  has_venue: boolean | null
  
  // NEW FIELDS - These need to be added to the database
  partner1_email: string | null
  partner2_email: string | null
  venue_name: string | null          // AuthContext uses venue_name, not venue
  venue_location: string | null
  guest_count: number | null         // AuthContext uses guest_count, not estimated_guests  
  wedding_style: string | null
  onboarding_completed: boolean | null
  
  // Additional useful fields
  venue_booked: boolean | null
  planning_progress: number | null
  budget_spent: number | null
  budget_remaining: number | null    // Computed field
  estimated_guests: number | null    // Computed field based on guest_count
}

export interface CoupleInsert {
  id?: string
  partner1_name: string
  partner2_name: string
  partner1_user_id?: string | null
  partner2_user_id?: string | null
  partner1_email?: string | null
  partner2_email?: string | null
  total_budget?: number | null
  wedding_date?: string | null
  venue_name?: string | null
  venue_location?: string | null
  guest_count?: number | null
  wedding_style?: string | null
  onboarding_completed?: boolean | null
  venue_booked?: boolean | null
  planning_progress?: number | null
  budget_spent?: number | null
  
  // Localization fields
  country?: string | null
  currency?: string | null
  date_format?: string | null
  language?: string | null
  number_format?: string | null
  region?: string | null
  time_format?: string | null
  timezone?: string | null
  planning_style?: string | null
  priorities?: string[] | null
  has_venue?: boolean | null
}

export interface CoupleUpdate {
  id?: string
  partner1_name?: string
  partner2_name?: string
  partner1_user_id?: string | null
  partner2_user_id?: string | null
  partner1_email?: string | null
  partner2_email?: string | null
  total_budget?: number | null
  wedding_date?: string | null
  venue_name?: string | null
  venue_location?: string | null
  guest_count?: number | null
  wedding_style?: string | null
  onboarding_completed?: boolean | null
  venue_booked?: boolean | null
  planning_progress?: number | null
  budget_spent?: number | null
  updated_at?: string | null
  
  // Localization fields
  country?: string | null
  currency?: string | null
  date_format?: string | null
  language?: string | null
  number_format?: string | null
  region?: string | null
  time_format?: string | null
  timezone?: string | null
  planning_style?: string | null
  priorities?: string[] | null
  has_venue?: boolean | null
}

// Interface for AuthContext createCouple function
export interface CreateCoupleData {
  partner1Name: string
  partner2Name?: string
  weddingDate?: string
  venueName?: string           // Maps to venue_name in database
  venueLocation?: string       // Maps to venue_location in database
  guestCountEstimate?: number  // Maps to guest_count in database
  budgetTotal?: number         // Maps to total_budget in database
  weddingStyle?: string        // Maps to wedding_style in database
}

// Interface for the database insert data (what AuthContext actually sends)
export interface CoupleInsertData {
  partner1_user_id: string
  partner1_name: string
  partner2_name: string | null
  wedding_date: string | null
  venue_name: string | null      // NOT venue
  venue_location: string | null
  guest_count: number            // NOT estimated_guests
  total_budget: number
  wedding_style: string
}

// Type guards and utilities
export function isCoupleComplete(couple: CoupleRow): boolean {
  return !!(
    couple.partner1_name &&
    couple.wedding_date &&
    couple.venue_name &&
    couple.guest_count &&
    couple.total_budget
  )
}

export function getCoupleDisplayName(couple: CoupleRow): string {
  if (couple.partner2_name) {
    return `${couple.partner1_name} & ${couple.partner2_name}`
  }
  return couple.partner1_name
}

// Schema validation helpers
export const requiredCoupleFields = [
  'partner1_name',
  'partner2_name'
] as const

export const optionalCoupleFields = [
  'partner1_email',
  'partner2_email', 
  'wedding_date',
  'venue_name',
  'venue_location',
  'guest_count',
  'total_budget',
  'wedding_style',
  'onboarding_completed'
] as const

export type RequiredCoupleField = typeof requiredCoupleFields[number]
export type OptionalCoupleField = typeof optionalCoupleFields[number]
export type AllCoupleFields = RequiredCoupleField | OptionalCoupleField