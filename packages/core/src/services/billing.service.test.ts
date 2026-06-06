import { describe, it, expect } from "vitest";
import { makeFakeRepositories } from "../testing/fakes";
import { makeBillingService } from "./billing.service";

describe("billing service", () => {
  it("grants the plan's entitlements for an event-scoped plan", async () => {
    const repos = makeFakeRepositories();
    const billing = makeBillingService(repos);
    const granted = await billing.applyPlanPurchase({
      organizationId: "o1",
      eventId: "e1",
      planKey: "wedding_annual",
      source: "stripe:cs_test_1",
    });
    expect(granted.map((g) => g.key)).toContain("event_type:wedding");
    const held = await repos.entitlements.heldFor({ organizationId: "o1", eventId: "e1" });
    expect(held).toContain("event_type:wedding");
  });

  it("grants org-level entitlements with a null eventId for org-scoped plans", async () => {
    const repos = makeFakeRepositories();
    const billing = makeBillingService(repos);
    await billing.applyPlanPurchase({
      organizationId: "o1",
      eventId: null,
      planKey: "all_access_annual",
      source: "stripe:cs_test_2",
    });
    const held = await repos.entitlements.heldFor({ organizationId: "o1", eventId: "anything" });
    expect(held).toContain("all_access");
  });

  it("is idempotent — applying the same purchase twice does not duplicate grants", async () => {
    const repos = makeFakeRepositories();
    const billing = makeBillingService(repos);
    const input = {
      organizationId: "o1",
      eventId: "e1",
      planKey: "pro_annual" as const,
      source: "stripe:cs_test_3",
    };
    await billing.applyPlanPurchase(input);
    await billing.applyPlanPurchase(input);
    const held = await repos.entitlements.heldFor({ organizationId: "o1", eventId: "e1" });
    expect(held.filter((k) => k === "module:vendor_matching")).toHaveLength(1);
  });

  it("rejects an event-scoped plan with no eventId", async () => {
    const repos = makeFakeRepositories();
    const billing = makeBillingService(repos);
    await expect(
      billing.applyPlanPurchase({
        organizationId: "o1",
        eventId: null,
        planKey: "wedding_annual",
        source: "x",
      }),
    ).rejects.toThrowError(/event/i);
  });
});
