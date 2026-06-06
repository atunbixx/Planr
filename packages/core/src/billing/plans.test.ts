import { describe, it, expect } from "vitest";
import { getPlan, allPlans, planGrants } from "./plans";

describe("plan registry", () => {
  it("defines the wedding annual plan as an event-scoped grant of event_type:wedding", () => {
    const plan = getPlan("wedding_annual");
    expect(plan.scope).toBe("event");
    expect(plan.interval).toBe("year");
    expect(plan.grants).toContain("event_type:wedding");
  });

  it("defines all_access as an organization-scoped plan granting all_access", () => {
    const plan = getPlan("all_access_annual");
    expect(plan.scope).toBe("organization");
    expect(plan.grants).toEqual(["all_access"]);
  });

  it("exposes prices in minor units with a currency", () => {
    const plan = getPlan("birthday_annual");
    expect(plan.priceMinor).toBe(4900);
    expect(plan.currency).toBe("usd");
  });

  it("throws for an unknown plan", () => {
    expect(() => getPlan("nope")).toThrowError(/not a registered plan/i);
  });

  it("planGrants returns the plan's entitlements", () => {
    expect(planGrants("pro_annual")).toContain("module:vendor_matching");
  });

  it("allPlans lists every registered plan key once", () => {
    const keys = allPlans().map((p) => p.key);
    expect(new Set(keys).size).toBe(keys.length);
    expect(keys).toContain("wedding_annual");
  });
});
