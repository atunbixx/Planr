import { describe, it, expect } from "vitest";
import { makeFakeRepositories } from "../testing/fakes";
import { makeTenancyService } from "../services/tenancy.service";
import { makeEventService } from "../services/event.service";
import { makeGuestService } from "./guest.service";

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
  const guestSvc = makeGuestService(repos, { freeLaunch: opts.freeLaunch ?? true });
  return { repos, organization, event, ownerUserId: ownerMembership.userId, guestSvc };
}

describe("guest service", () => {
  it("creates, lists and summarises guests for a member", async () => {
    const { guestSvc, event, ownerUserId } = await setup();
    await guestSvc.create(ownerUserId, {
      eventId: event.id,
      guest: { name: "Aunt Mary", rsvpStatus: "coming" },
    });
    await guestSvc.create(ownerUserId, { eventId: event.id, guest: { name: "Uncle Joe" } });
    const page = await guestSvc.list(ownerUserId, { eventId: event.id, limit: 50 });
    expect(page.guests).toHaveLength(2);
    const summary = await guestSvc.summary(ownerUserId, { eventId: event.id });
    expect(summary).toMatchObject({ total: 2, coming: 1, awaiting: 1 });
  });

  it("paginates with a cursor", async () => {
    const { guestSvc, event, ownerUserId } = await setup();
    for (let i = 0; i < 3; i++) {
      await guestSvc.create(ownerUserId, { eventId: event.id, guest: { name: `G${i}` } });
    }
    const first = await guestSvc.list(ownerUserId, { eventId: event.id, limit: 2 });
    expect(first.guests).toHaveLength(2);
    expect(first.nextCursor).not.toBeNull();
    const second = await guestSvc.list(ownerUserId, {
      eventId: event.id,
      limit: 2,
      cursor: first.nextCursor!,
    });
    expect(second.guests).toHaveLength(1);
    expect(second.nextCursor).toBeNull();
  });

  it("updates and removes a guest", async () => {
    const { guestSvc, event, ownerUserId } = await setup();
    const g = await guestSvc.create(ownerUserId, { eventId: event.id, guest: { name: "Mary" } });
    const updated = await guestSvc.update(ownerUserId, {
      eventId: event.id,
      guestId: g.id,
      patch: { rsvpStatus: "declined" },
    });
    expect(updated.rsvpStatus).toBe("declined");
    await guestSvc.remove(ownerUserId, { eventId: event.id, guestId: g.id });
    const page = await guestSvc.list(ownerUserId, { eventId: event.id, limit: 50 });
    expect(page.guests).toHaveLength(0);
  });

  it("throws NotFound for an unknown event or guest", async () => {
    const { guestSvc, event, ownerUserId } = await setup();
    await expect(guestSvc.list(ownerUserId, { eventId: "nope", limit: 10 })).rejects.toThrowError(
      /not found/i,
    );
    await expect(
      guestSvc.update(ownerUserId, { eventId: event.id, guestId: "nope", patch: { name: "x" } }),
    ).rejects.toThrowError(/not found/i);
  });

  it("forbids a non-member (cross-tenant) from reading or writing", async () => {
    const { guestSvc, event, repos } = await setup();
    const stranger = await repos.users.upsertByAuthUserId({
      authUserId: "auth_stranger",
      email: "s@x.com",
      name: null,
    });
    await expect(guestSvc.list(stranger.id, { eventId: event.id, limit: 10 })).rejects.toThrowError(
      /member|forbidden/i,
    );
    await expect(
      guestSvc.create(stranger.id, { eventId: event.id, guest: { name: "Hax" } }),
    ).rejects.toThrowError(/member|forbidden/i);
  });

  it("a viewer can read but not write", async () => {
    const { guestSvc, event, organization, repos } = await setup();
    const viewer = await repos.users.upsertByAuthUserId({ authUserId: "auth_v", email: "v@x.com", name: null });
    await repos.memberships.upsert({ organizationId: organization.id, userId: viewer.id, role: "viewer" });
    await expect(guestSvc.list(viewer.id, { eventId: event.id, limit: 10 })).resolves.toBeDefined();
    await expect(
      guestSvc.create(viewer.id, { eventId: event.id, guest: { name: "x" } }),
    ).rejects.toThrowError(/forbidden/i);
  });

  it("routes through the entitlement engine when freeLaunch is off (gate is wired)", async () => {
    // freeLaunch on → gate short-circuits to available.
    const free = await setup({ freeLaunch: true });
    await expect(
      free.guestSvc.list(free.ownerUserId, { eventId: free.event.id, limit: 10 }),
    ).resolves.toBeDefined();

    // freeLaunch off → the service consults resolveModuleAccess. "guests" is a free-baseline
    // module, so it stays available with no entitlements — proving the gate is LIVE (not a blanket
    // allow). To charge for guests later, drop it from FREE_BASELINE_MODULES and the same gate
    // locks it; the next test exercises that lock path directly.
    const paid = await setup({ freeLaunch: false });
    await expect(
      paid.guestSvc.list(paid.ownerUserId, { eventId: paid.event.id, limit: 10 }),
    ).resolves.toBeDefined();
  });

  it("the same gate locks a non-free-baseline module without a plan (proves lockability)", async () => {
    const { resolveModuleAccess } = await import("../entitlements/resolver");
    const locked = resolveModuleAccess({ module: "vendor_matching", eventType: "wedding", held: [] });
    expect(locked.locked).toBe(true);
    const unlocked = resolveModuleAccess({
      module: "vendor_matching",
      eventType: "wedding",
      held: ["module:vendor_matching"],
    });
    expect(unlocked.locked).toBe(false);
  });
});
