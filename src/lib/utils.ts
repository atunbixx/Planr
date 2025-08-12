import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Rounds a percentage to 2 decimal places
 * @param percentage - The percentage value to round
 * @returns Rounded percentage with 2 decimal places
 */
export function roundPercentage(percentage: number): number {
  return Math.round(percentage * 100) / 100
}

/**
 * Calculates a percentage and rounds it to 2 decimal places
 * @param numerator - The numerator value
 * @param denominator - The denominator value
 * @returns Calculated and rounded percentage
 */
export function calculatePercentage(numerator: number, denominator: number): number {
  if (denominator === 0) return 0
  return roundPercentage((numerator / denominator) * 100)
}

/**
 * Formats a currency amount with locale-aware formatting
 * @param amount - The amount to format
 * @param currency - The currency code (default: USD)
 * @param locale - The locale to use (default: en-US)
 * @returns Formatted currency string
 */
export function formatCurrencyAmount(amount: number, currency = 'NGN', locale = 'en-NG'): string {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency
    }).format(amount)
  } catch {
    // Fallback formatting
    return `${currency} ${amount.toLocaleString()}`
  }
}