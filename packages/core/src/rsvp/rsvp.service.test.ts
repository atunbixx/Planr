import { describe, it, expect } from "vitest";
import { makeFakeRepositories } from "../testing/fakes";
import { makeTenancyService } from "../services/tenancy.service";
import { makeEventService } from "../services/event.service";
import { makeGuestService } from "../guests/guest.service";
import { makePublicRsvpService, makeRsvpService } from "./rsvp.service";

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
  const publicRsvp = makePublicRsvpService(repos);
  const host = makeRsvpService(repos, { freeLaunch: opts.freeLaunch ?? true });
  return { repos, organization, event, ownerUserId, guest, publicRsvp, host };
}

describe("public rsvp service", () => {
  it("returns a minimal view by token (no org/email/other-guest data)", async () => {
    const { publicRsvp, guest } = await setup();
    const view = await publicRsvp.get(guest.rsvpToken);
    expect(view).toEqual({
      eventName: "Our Wedding",
      guestName: "Aunt Mary",
      rsvpStatus: "awaiting",
      plusOne: false,
      mealChoice: null,
    });
    // exactly these keys — nothing leaks
    expect(Object.keys(view).sort()).toEqual([
      "eventName",
      "guestName",
      "mealChoice",
      "plusOne",
      "rsvpStatus",
    ]);
  });

  it("records a response (status + plus-one + meal) for that guest only", async () => {
    const { publicRsvp, guest, repos, event } = await setup();
    const view = await publicRsvp.respond(guest.rsvpToken, {
      rsvpStatus: "coming",
      plusOne: true,
      mealChoice: "Vegan",
    });
    expect(view).toMatchObject({ rsvpStatus: "coming", plusOne: true, mealChoice: "Vegan" });
    const stored = await repos.guests.getById({
      organizationId: event.organizationId,
      eventId: event.id,
      id: guest.id,
    });
    expect(stored).toMatchObject({ rsvpStatus: "coming", plusOne: true, mealChoice: "Vegan" });
  });

  it("404s an invalid token on both get and respond", async () => {
    const { publicRsvp } = await setup();
    await expect(publicRsvp.get("nope")).rejects.toThrowError(/valid/i);
    await expect(
      publicRsvp.respond("nope", { rsvpStatus: "coming" }),
    ).rejects.toThrowError(/valid/i);
  });

  it("rejects an invalid status (e.g. awaiting) via the DTO", async () => {
    const { publicRsvp, guest } = await setup();
    await expect(
      // @ts-expect-error awaiting is not an allowed public response
      publicRsvp.respond(guest.rsvpToken, { rsvpStatus: "awaiting" }),
    ).rejects.toThrow();
  });
});

describe("host rsvp service", () => {
  it("overview returns the summary and a link token per guest", async () => {
    const { host, ownerUserId, event, guest } = await setup();
    const overview = await host.overview(ownerUserId, { eventId: event.id });
    expect(overview.summary).toMatchObject({ total: 1, awaiting: 1 });
    expect(overview.guests).toEqual([
      { id: guest.id, name: "Aunt Mary", rsvpStatus: "awaiting", token: guest.rsvpToken },
    ]);
  });

  it("forbids a non-member; allows a viewer to read", async () => {
    const { host, event, organization, repos } = await setup();
    const stranger = await repos.users.upsertByAuthUserId({ authUserId: "auth_s", email: "s@x.com", name: null });
    await expect(host.overview(stranger.id, { eventId: event.id })).rejects.toThrowError(/member|forbidden/i);
    const viewer = await repos.users.upsertByAuthUserId({ authUserId: "auth_v", email: "v@x.com", name: null });
    await repos.memberships.upsert({ organizationId: organization.id, userId: viewer.id, role: "viewer" });
    await expect(host.overview(viewer.id, { eventId: event.id })).resolves.toBeDefined();
  });

  it("locks the host dashboard when freeLaunch is off (rsvp is non-baseline)", async () => {
    const free = await setup({ freeLaunch: true });
    await expect(free.host.overview(free.ownerUserId, { eventId: free.event.id })).resolves.toBeDefined();
    const paid = await setup({ freeLaunch: false });
    await expect(
      paid.host.overview(paid.ownerUserId, { eventId: paid.event.id }),
    ).rejects.toThrowError(/locked/i);
  });

  it("the public path still works even when the host module would be locked", async () => {
    const paid = await setup({ freeLaunch: false });
    // host locked…
    await expect(
      paid.host.overview(paid.ownerUserId, { eventId: paid.event.id }),
    ).rejects.toThrowError(/locked/i);
    // …but a guest can still RSVP via their token (ungated)
    await expect(
      paid.publicRsvp.respond(paid.guest.rsvpToken, { rsvpStatus: "coming" }),
    ).resolves.toMatchObject({ rsvpStatus: "coming" });
  });
});
