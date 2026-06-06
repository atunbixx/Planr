import type { Entitlement } from "../types";

export type PlanInterval = "year" | "one_time";
export type PlanScope = "organization" | "event";

export interface Plan {
  key: string;
  label: string;
  priceMinor: number; // smallest currency unit, e.g. cents
  currency: string; // ISO 4217 lowercase, e.g. "usd"
  interval: PlanInterval;
  scope: PlanScope; // what an entitlement attaches to
  grants: Entitlement[];
}

// Illustrative launch prices — the business owns these; changing them is a registry edit.
const PLANS: Record<string, Plan> = {
  birthday_annual: {
    key: "birthday_annual",
    label: "Birthday planning (annual)",
    priceMinor: 4900,
    currency: "usd",
    interval: "year",
    scope: "event",
    grants: ["event_type:birthday"],
  },
  wedding_annual: {
    key: "wedding_annual",
    label: "Wedding planning (annual)",
    priceMinor: 9900,
    currency: "usd",
    interval: "year",
    scope: "event",
    grants: ["event_type:wedding"],
  },
  pro_annual: {
    key: "pro_annual",
    label: "Pro (annual)",
    priceMinor: 7900,
    currency: "usd",
    interval: "year",
    scope: "event",
    grants: ["module:vendor_matching", "module:gift_registry"],
  },
  all_access_annual: {
    key: "all_access_annual",
    label: "All-Access / Planner (annual)",
    priceMinor: 29900,
    currency: "usd",
    interval: "year",
    scope: "organization",
    grants: ["all_access"],
  },
};

export function getPlan(key: string): Plan {
  const plan = PLANS[key];
  if (!plan) {
    throw new Error(`"${key}" is not a registered plan.`);
  }
  return plan;
}

export function planGrants(key: string): Entitlement[] {
  return getPlan(key).grants;
}

export function allPlans(): Plan[] {
  return Object.values(PLANS);
}
