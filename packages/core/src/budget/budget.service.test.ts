import { describe, it, expect } from "vitest";
import { makeFakeRepositories } from "../testing/fakes";
import { makeTenancyService } from "../services/tenancy.service";
import { makeEventService } from "../services/event.service";
import { makeBudgetService } from "./budget.service";

async function setup(opts: { freeLaunch?: boolean } = {}) {
  const repos = makeFakeRepositories();
  const tenancy = makeTenancyService(repos);
  const events = makeEventService(repos);
  const { organization, ownerMembership } = await tenancy.provisionOrganization({
    name: "Smith Wedding",
    creator: { authUserId: "auth_owner", email: "owner@x.com", name: "Owner" },
  });
  const event = await events.create({
    organizationId: organization.id,
    eventTypeKey: "wedding",
    name: "Our Wedding",
    date: null,
  });
  const budgetSvc = makeBudgetService(repos, { freeLaunch: opts.freeLaunch ?? true });
  return { repos, organization, event, ownerUserId: ownerMembership.userId, budgetSvc };
}

describe("budget service", () => {
  it("creates items and summarises estimated/paid/remaining", async () => {
    const { budgetSvc, event, ownerUserId } = await setup();
    await budgetSvc.create(ownerUserId, {
      eventId: event.id,
      item: { label: "Venue", estimated: "10000", paid: "2500" },
    });
    await budgetSvc.create(ownerUserId, {
      eventId: event.id,
      item: { label: "Catering", estimated: "5000", paid: "0" },
    });
    const items = await budgetSvc.list(ownerUserId, { eventId: event.id, limit: 50 });
    expect(items.items).toHaveLength(2);
    const summary = await budgetSvc.summary(ownerUserId, { eventId: event.id });
    expect(summary).toEqual({
      itemCount: 2,
      totalEstimatedCents: 1_500_000,
      totalPaidCents: 250_000,
      remainingCents: 1_250_000,
    });
  });

  it("surfaces overspend as a negative remaining", async () => {
    const { budgetSvc, event, ownerUserId } = await setup();
    await budgetSvc.create(ownerUserId, {
      eventId: event.id,
      item: { label: "Flowers", estimated: "500", paid: "650.50" },
    });
    const summary = await budgetSvc.summary(ownerUserId, { eventId: event.id });
    expect(summary.totalPaidCents).toBe(65050);
    expect(summary.remainingCents).toBe(50000 - 65050); // negative
  });

  it("updates an item and 404s an unknown item or event", async () => {
    const { budgetSvc, event, ownerUserId } = await setup();
    const item = await budgetSvc.create(ownerUserId, {
      eventId: event.id,
      item: { label: "Cake", estimated: "300" },
    });
    const updated = await budgetSvc.update(ownerUserId, {
      eventId: event.id,
      itemId: item.id,
      patch: { paid: "150" },
    });
    expect(updated.paidCents).toBe(15000);
    expect(updated.estimatedCents).toBe(30000); // untouched by the partial patch
    await expect(
      budgetSvc.update(ownerUserId, { eventId: event.id, itemId: "nope", patch: { label: "x" } }),
    ).rejects.toThrowError(/not found/i);
    await expect(budgetSvc.list(ownerUserId, { eventId: "nope", limit: 10 })).rejects.toThrowError(
      /not found/i,
    );
  });

  it("removes an item", async () => {
    const { budgetSvc, event, ownerUserId } = await setup();
    const item = await budgetSvc.create(ownerUserId, { eventId: event.id, item: { label: "DJ" } });
    await budgetSvc.remove(ownerUserId, { eventId: event.id, itemId: item.id });
    expect((await budgetSvc.list(ownerUserId, { eventId: event.id, limit: 50 })).items).toHaveLength(0);
  });

  it("forbids a non-member (cross-tenant) from reading or writing", async () => {
    const { budgetSvc, event, repos } = await setup();
    const stranger = await repos.users.upsertByAuthUserId({
      authUserId: "auth_stranger",
      email: "s@x.com",
      name: null,
    });
    await expect(budgetSvc.list(stranger.id, { eventId: event.id, limit: 10 })).rejects.toThrowError(
      /member|forbidden/i,
    );
    await expect(
      budgetSvc.create(stranger.id, { eventId: event.id, item: { label: "Hax" } }),
    ).rejects.toThrowError(/member|forbidden/i);
  });

  it("a viewer can read but not write", async () => {
    const { budgetSvc, event, organization, repos } = await setup();
    const viewer = await repos.users.upsertByAuthUserId({ authUserId: "auth_v", email: "v@x.com", name: null });
    await repos.memberships.upsert({ organizationId: organization.id, userId: viewer.id, role: "viewer" });
    await expect(budgetSvc.list(viewer.id, { eventId: event.id, limit: 10 })).resolves.toBeDefined();
    await expect(
      budgetSvc.create(viewer.id, { eventId: event.id, item: { label: "x" } }),
    ).rejects.toThrowError(/forbidden/i);
  });

  it("routes through the entitlement engine when freeLaunch is off (gate is wired)", async () => {
    const free = await setup({ freeLaunch: true });
    await expect(
      free.budgetSvc.list(free.ownerUserId, { eventId: free.event.id, limit: 10 }),
    ).resolves.toBeDefined();
    // budget is a free-baseline module, so it stays available even with the gate live.
    const paid = await setup({ freeLaunch: false });
    await expect(
      paid.budgetSvc.list(paid.ownerUserId, { eventId: paid.event.id, limit: 10 }),
    ).resolves.toBeDefined();
  });
});
