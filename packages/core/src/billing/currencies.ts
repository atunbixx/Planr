// Supported workspace currencies (ISO 4217). All are 2-decimal (minor-unit) currencies, matching
// our integer-pence money storage. Formatting is done in the UI via Intl.NumberFormat(currency).
export const SUPPORTED_CURRENCIES = [
  "GBP",
  "USD",
  "EUR",
  "AUD",
  "CAD",
  "NZD",
  "ZAR",
  "AED",
] as const;

export type CurrencyCode = (typeof SUPPORTED_CURRENCIES)[number];

export const CURRENCY_LABELS: Record<CurrencyCode, string> = {
  GBP: "British Pound (£)",
  USD: "US Dollar ($)",
  EUR: "Euro (€)",
  AUD: "Australian Dollar (A$)",
  CAD: "Canadian Dollar (C$)",
  NZD: "New Zealand Dollar (NZ$)",
  ZAR: "South African Rand (R)",
  AED: "UAE Dirham (د.إ)",
};

export function isSupportedCurrency(code: string): code is CurrencyCode {
  return (SUPPORTED_CURRENCIES as readonly string[]).includes(code);
}
