import { describe, it, expect } from "vitest";
import { makeFakeRepositories } from "../testing/fakes";
import { makeTenancyService } from "../services/tenancy.service";
import { makeEventService } from "../services/event.service";
import { makeVendorService } from "./vendor.service";

async function setup(opts: { freeLaunch?: boolean } = {}) {
  const repos = makeFakeRepositories();
  const tenancy = makeTenancyService(repos);
  const events = makeEventService(repos);
  const { organization, ownerMembership } = await tenancy.provisionOrganization({
    name: "Smith Wedding",
    creator: { authUserId: "auth_o", email: "o@x.com", name: "O" },
  });
  const event = await events.create({
    organizationId: organization.id,
    eventTypeKey: "wedding",
    name: "Our Wedding",
    date: null,
  });
  return {
    repos,
    organization,
    event,
    ownerUserId: ownerMembership.userId,
    vendors: makeVendorService(repos, { freeLaunch: opts.freeLaunch ?? true }),
  };
}

describe("vendor service", () => {
  it("creates vendors and summarises booked count + total booked cost", async () => {
    const { vendors, event, ownerUserId } = await setup();
    await vendors.create(ownerUserId, {
      eventId: event.id,
      vendor: { name: "Bloom", category: "Florist", status: "booked", cost: "1200" },
    });
    await vendors.create(ownerUserId, {
      eventId: event.id,
      vendor: { name: "Snaps", category: "Photographer", status: "quoted", cost: "2500" },
    });
    expect(await vendors.list(ownerUserId, { eventId: event.id })).toHaveLength(2);
    const s = await vendors.summary(ownerUserId, { eventId: event.id });
    expect(s).toEqual({ total: 2, booked: 1, totalBookedCents: 120000 });
  });

  it("updates a vendor and 404s an unknown one", async () => {
    const { vendors, event, ownerUserId } = await setup();
    const v = await vendors.create(ownerUserId, { eventId: event.id, vendor: { name: "DJ Max" } });
    const updated = await vendors.update(ownerUserId, {
      eventId: event.id,
      vendorId: v.id,
      patch: { status: "booked", cost: "800" },
    });
    expect(updated).toMatchObject({ status: "booked", costCents: 80000 });
    await expect(
      vendors.update(ownerUserId, { eventId: event.id, vendorId: "nope", patch: { name: "x" } }),
    ).rejects.toThrowError(/not found/i);
  });

  it("forbids a non-member; a viewer can read but not write", async () => {
    const { vendors, event, organization, repos } = await setup();
    const stranger = await repos.users.upsertByAuthUserId({ authUserId: "auth_s", email: "s@x.com", name: null });
    await expect(vendors.list(stranger.id, { eventId: event.id })).rejects.toThrowError(/member|forbidden/i);
    const viewer = await repos.users.upsertByAuthUserId({ authUserId: "auth_v", email: "v@x.com", name: null });
    await repos.memberships.upsert({ organizationId: organization.id, userId: viewer.id, role: "viewer" });
    await expect(vendors.list(viewer.id, { eventId: event.id })).resolves.toBeDefined();
    await expect(
      vendors.create(viewer.id, { eventId: event.id, vendor: { name: "x" } }),
    ).rejects.toThrowError(/forbidden/i);
  });

  it("locks when freeLaunch is off (vendors is non-baseline)", async () => {
    const free = await setup({ freeLaunch: true });
    await expect(free.vendors.list(free.ownerUserId, { eventId: free.event.id })).resolves.toBeDefined();
    const paid = await setup({ freeLaunch: false });
    await expect(paid.vendors.list(paid.ownerUserId, { eventId: paid.event.id })).rejects.toThrowError(/locked/i);
  });
});
