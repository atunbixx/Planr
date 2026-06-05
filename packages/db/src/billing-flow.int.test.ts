import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { makeTenancyService, makeEventService, makeBillingService } from "@planr/core";
import { startTestDb, type TestDb } from "./testing/test-db";
import { createRepositories } from "./repositories/index";

let db: TestDb;

beforeAll(async () => {
  db = await startTestDb();
});
afterAll(async () => {
  await db?.stop();
});

describe("billing flow (purchase unlocks modules, over Postgres)", () => {
  it("unlocks a wedding's locked modules after the wedding plan is purchased", async () => {
    const repos = createRepositories(db.prisma);
    const tenancy = makeTenancyService(repos);
    const events = makeEventService(repos);
    const billing = makeBillingService(repos);

    const { organization } = await tenancy.provisionOrganization({
      name: "Bill Co",
      creator: { authUserId: "auth_bill", email: "bill@x.com", name: "Bill" },
    });
    const event = await events.create({
      organizationId: organization.id,
      eventTypeKey: "wedding",
      name: "Bill Wedding",
      date: null,
    });

    // Before purchase: seating is a non-baseline core module → locked.
    const before = await events.resolveModules({
      organizationId: organization.id,
      eventId: event.id,
    });
    expect(before.find((m) => m.module === "seating")).toMatchObject({
      locked: true,
      reason: "needs_event_type_plan",
    });

    // Purchase the wedding plan (as a verified webhook would).
    await billing.applyPlanPurchase({
      organizationId: organization.id,
      eventId: event.id,
      planKey: "wedding_annual",
      source: "stripe:cs_test_flow",
    });

    // After purchase: seating is unlocked.
    const after = await events.resolveModules({
      organizationId: organization.id,
      eventId: event.id,
    });
    expect(after.find((m) => m.module === "seating")).toMatchObject({ locked: false });

    // Advanced module (vendor_matching) still locked — it needs the Pro plan.
    expect(after.find((m) => m.module === "vendor_matching")).toMatchObject({
      locked: true,
      reason: "needs_pro",
    });

    // Buy Pro → vendor_matching unlocks.
    await billing.applyPlanPurchase({
      organizationId: organization.id,
      eventId: event.id,
      planKey: "pro_annual",
      source: "stripe:cs_test_pro",
    });
    const afterPro = await events.resolveModules({
      organizationId: organization.id,
      eventId: event.id,
    });
    expect(afterPro.find((m) => m.module === "vendor_matching")).toMatchObject({ locked: false });
  });
});
