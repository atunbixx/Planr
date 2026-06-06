// Format integer minor units (pence/cents) in the workspace currency.
// Storage stays currency-agnostic integers; display is Intl-driven.
export function formatMoney(
  minorUnits: number,
  currency: string,
  opts: { compact?: boolean } = {},
): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency,
    ...(opts.compact ? { maximumFractionDigits: 0 } : {}),
  }).format(minorUnits / 100);
}
