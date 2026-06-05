import { describe, it, expect } from "vitest";
import { makeFakeRepositories } from "../testing/fakes";
import { makeTenancyService } from "../services/tenancy.service";
import { makeEventService } from "../services/event.service";
import { makeGuestService } from "../guests/guest.service";
import { makeMessagingService, makePublicMessagingService } from "./messaging.service";

async function setup(opts: { freeLaunch?: boolean } = {}) {
  const repos = makeFakeRepositories();
  const tenancy = makeTenancyService(repos);
  const events = makeEventService(repos);
  const guestSvc = makeGuestService(repos);
  const { organization, ownerMembership } = await tenancy.provisionOrganization({
    name: "Smith Wedding",
    creator: { authUserId: "auth_owner", email: "owner@x.com", name: "Owner" },
  });
  const ownerUserId = ownerMembership.userId;
  const event = await events.create({
    organizationId: organization.id,
    eventTypeKey: "wedding",
    name: "Our Wedding",
    date: null,
  });
  const guest = await guestSvc.create(ownerUserId, { eventId: event.id, guest: { name: "Aunt Mary" } });
  const host = makeMessagingService(repos, { freeLaunch: opts.freeLaunch ?? true });
  const pub = makePublicMessagingService(repos);
  return { repos, organization, event, ownerUserId, guest, host, pub };
}

describe("messaging service (host)", () => {
  it("creates and lists announcements newest-first; updates and removes", async () => {
    const { host, event, ownerUserId } = await setup();
    await host.create(ownerUserId, { eventId: event.id, announcement: { title: "First", body: "a" } });
    const second = await host.create(ownerUserId, {
      eventId: event.id,
      announcement: { title: "Second", body: "b" },
    });
    const list = await host.list(ownerUserId, { eventId: event.id });
    expect(list.map((a) => a.title)).toEqual(["Second", "First"]); // newest first

    const updated = await host.update(ownerUserId, {
      eventId: event.id,
      id: second.id,
      patch: { body: "edited" },
    });
    expect(updated).toMatchObject({ title: "Second", body: "edited" });

    await host.remove(ownerUserId, { eventId: event.id, id: second.id });
    expect((await host.list(ownerUserId, { eventId: event.id })).map((a) => a.title)).toEqual(["First"]);
  });

  it("404s an unknown announcement", async () => {
    const { host, event, ownerUserId } = await setup();
    await expect(
      host.update(ownerUserId, { eventId: event.id, id: "nope", patch: { title: "x" } }),
    ).rejects.toThrowError(/not found/i);
    await expect(host.remove(ownerUserId, { eventId: event.id, id: "nope" })).rejects.toThrowError(
      /not found/i,
    );
  });

  it("forbids a non-member; a viewer can read but not post", async () => {
    const { host, event, organization, repos } = await setup();
    const stranger = await repos.users.upsertByAuthUserId({ authUserId: "auth_s", email: "s@x.com", name: null });
    await expect(host.list(stranger.id, { eventId: event.id })).rejects.toThrowError(/member|forbidden/i);
    const viewer = await repos.users.upsertByAuthUserId({ authUserId: "auth_v", email: "v@x.com", name: null });
    await repos.memberships.upsert({ organizationId: organization.id, userId: viewer.id, role: "viewer" });
    await expect(host.list(viewer.id, { eventId: event.id })).resolves.toBeDefined();
    await expect(
      host.create(viewer.id, { eventId: event.id, announcement: { title: "x", body: "y" } }),
    ).rejects.toThrowError(/forbidden/i);
  });

  it("locks when freeLaunch is off (messaging is non-baseline)", async () => {
    const free = await setup({ freeLaunch: true });
    await expect(free.host.list(free.ownerUserId, { eventId: free.event.id })).resolves.toBeDefined();
    const paid = await setup({ freeLaunch: false });
    await expect(paid.host.list(paid.ownerUserId, { eventId: paid.event.id })).rejects.toThrowError(/locked/i);
  });
});

describe("messaging service (public)", () => {
  it("returns the event's announcements (safe fields) for a valid token", async () => {
    const { host, pub, event, ownerUserId, guest } = await setup();
    await host.create(ownerUserId, { eventId: event.id, announcement: { title: "Parking", body: "Lot B" } });
    const anns = await pub.forToken(guest.rsvpToken);
    expect(anns).toHaveLength(1);
    expect(Object.keys(anns[0]!).sort()).toEqual(["body", "createdAt", "id", "title"]);
    expect(anns[0]).toMatchObject({ title: "Parking", body: "Lot B" });
  });

  it("returns [] for an unknown token (no oracle)", async () => {
    const { pub } = await setup();
    expect(await pub.forToken("not-a-real-token")).toEqual([]);
  });

  it("works even when the host module would be locked", async () => {
    const paid = await setup({ freeLaunch: false });
    // Seed an announcement directly via the repo (host path is locked).
    await paid.repos.announcements.create({
      organizationId: paid.event.organizationId,
      eventId: paid.event.id,
      title: "Open to all",
      body: "x",
    });
    await expect(paid.host.list(paid.ownerUserId, { eventId: paid.event.id })).rejects.toThrowError(/locked/i);
    expect(await paid.pub.forToken(paid.guest.rsvpToken)).toHaveLength(1);
  });
});
