import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { startTestDb, type TestDb } from "@planr/db/src/testing/test-db";
import { createRepositories, type Repositories } from "@planr/db";
import {
  makeTenancyService,
  makeEventService,
  makeEntitlementService,
  makeAuthorizationService,
  makeOnboardingService,
  makeCollaborationService,
  makeGuestService,
  makeTaskService,
  makeBudgetService,
  makeSeatingService,
  makePublicRsvpService,
  makeRsvpService,
  makeMessagingService,
  makePublicMessagingService,
  makeWebsiteService,
  makePublicWebsiteService,
  makeVendorService,
  makeRegistryService,
  makePublicRegistryService,
  syncAuthUser,
} from "@planr/core";
import { appRouter } from "./app";
import type { TrpcContext } from "../trpc";

let db: TestDb;
let repos: Repositories;

function ctxFor(user: Awaited<ReturnType<typeof syncAuthUser>> | null): TrpcContext {
  return {
    user,
    container: {
      repos,
      tenancy: makeTenancyService(repos),
      events: makeEventService(repos),
      entitlements: makeEntitlementService(repos),
      authz: makeAuthorizationService(repos),
      onboarding: makeOnboardingService(repos),
      collaboration: makeCollaborationService(repos),
      guests: makeGuestService(repos),
      tasks: makeTaskService(repos),
      budget: makeBudgetService(repos),
      seating: makeSeatingService(repos),
      publicRsvp: makePublicRsvpService(repos),
      rsvp: makeRsvpService(repos),
      messaging: makeMessagingService(repos),
      publicMessaging: makePublicMessagingService(repos),
      website: makeWebsiteService(repos),
      publicWebsite: makePublicWebsiteService(repos),
      vendors: makeVendorService(repos),
      registry: makeRegistryService(repos),
      publicRegistry: makePublicRegistryService(repos),
    },
  };
}

beforeAll(async () => {
  db = await startTestDb();
  repos = createRepositories(db.prisma);
});
afterAll(async () => {
  await db?.stop();
});

describe("appRouter (integration, Supabase Postgres)", () => {
  it("rejects unauthenticated callers", async () => {
    const caller = appRouter.createCaller(ctxFor(null));
    await expect(caller.organizations.list()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("creates an org (caller becomes owner) and lists it", async () => {
    const user = await syncAuthUser(repos, { authUserId: "auth_a", email: "a@x.com", name: "A" });
    const caller = appRouter.createCaller(ctxFor(user));
    const org = await caller.organizations.create({ name: "Smith Wedding" });
    const list = await caller.organizations.list();
    expect(list.map((o) => o.id)).toContain(org.id);
  });

  it("gates event creation by permission and resolves modules", async () => {
    const owner = await syncAuthUser(repos, { authUserId: "auth_o", email: "o@x.com", name: "O" });
    const ownerCaller = appRouter.createCaller(ctxFor(owner));
    const org = await ownerCaller.organizations.create({ name: "Jones Wedding" });
    const event = await ownerCaller.events.create({
      organizationId: org.id,
      eventTypeKey: "wedding",
      name: "Jones Day",
    });
    const modules = await ownerCaller.events.modules({ organizationId: org.id, eventId: event.id });
    expect(modules.find((m) => m.module === "guests")).toMatchObject({ locked: false });
    expect(modules.find((m) => m.module === "seating")).toMatchObject({ locked: true });

    // a viewer in the same org cannot create events
    const viewer = await syncAuthUser(repos, { authUserId: "auth_v", email: "v@x.com", name: "V" });
    await repos.memberships.upsert({ organizationId: org.id, userId: viewer.id, role: "viewer" });
    const viewerCaller = appRouter.createCaller(ctxFor(viewer));
    await expect(
      viewerCaller.events.create({ organizationId: org.id, eventTypeKey: "wedding", name: "x" }),
    ).rejects.toThrowError(/forbidden/i);
  });

  it("completeIndividual creates an individual workspace + first event and lists it", async () => {
    const user = await syncAuthUser(repos, { authUserId: "auth_ob1", email: "ob1@x.com", name: "Ob" });
    const caller = appRouter.createCaller(ctxFor(user));
    const res = await caller.onboarding.completeIndividual({
      spaceName: "Ob's Planning",
      eventTypeKey: "birthday",
      eventName: "Ob's 30th",
    });
    const workspaces = await caller.workspaces.list();
    expect(workspaces.find((w) => w.id === res.organizationId)).toMatchObject({ type: "individual" });
    const events = await caller.events.list({ organizationId: res.organizationId });
    expect(events.map((e) => e.id)).toContain(res.eventId);
  });

  it("completeBusiness creates a business workspace with no events", async () => {
    const user = await syncAuthUser(repos, { authUserId: "auth_ob2", email: "ob2@x.com", name: "Biz" });
    const caller = appRouter.createCaller(ctxFor(user));
    const res = await caller.onboarding.completeBusiness({ businessName: "Bliss Events" });
    const workspaces = await caller.workspaces.list();
    expect(workspaces.find((w) => w.id === res.organizationId)).toMatchObject({ type: "business" });
    const events = await caller.events.list({ organizationId: res.organizationId });
    expect(events).toHaveLength(0);
  });

  it("invites a member, who is auto-added on sign-in by email", async () => {
    const owner = await syncAuthUser(repos, { authUserId: "auth_co", email: "co@x.com", name: "Co" });
    const ownerCaller = appRouter.createCaller(ctxFor(owner));
    const org = await ownerCaller.organizations.create({ name: "Shared Co" });
    await ownerCaller.collaboration.invite({
      organizationId: org.id,
      email: "guest@x.com",
      role: "editor",
    });
    const guest = await syncAuthUser(repos, { authUserId: "auth_g", email: "guest@x.com", name: null });
    await ctxFor(guest).container.collaboration.acceptPendingForEmail(guest.id, "guest@x.com");

    const members = await ownerCaller.collaboration.members({ organizationId: org.id });
    expect(members.map((m) => m.userId)).toContain(guest.id);

    const guestCaller = appRouter.createCaller(ctxFor(guest));
    await expect(guestCaller.events.list({ organizationId: org.id })).resolves.toBeDefined();
  });

  it("forbids a non-owner from inviting", async () => {
    const owner = await syncAuthUser(repos, { authUserId: "auth_o3", email: "o3@x.com", name: null });
    const ownerCaller = appRouter.createCaller(ctxFor(owner));
    const org = await ownerCaller.organizations.create({ name: "Locked Co" });
    const viewer = await syncAuthUser(repos, { authUserId: "auth_v3", email: "v3@x.com", name: null });
    await repos.memberships.upsert({ organizationId: org.id, userId: viewer.id, role: "viewer" });
    const viewerCaller = appRouter.createCaller(ctxFor(viewer));
    await expect(
      viewerCaller.collaboration.invite({ organizationId: org.id, email: "x@y.com", role: "editor" }),
    ).rejects.toThrowError(/forbidden/i);
  });

  it("blocks non-members from listing another org's events", async () => {
    const a = await syncAuthUser(repos, { authUserId: "auth_m1", email: "m1@x.com", name: null });
    const stranger = await syncAuthUser(repos, { authUserId: "auth_m2", email: "m2@x.com", name: null });
    const org = await appRouter.createCaller(ctxFor(a)).organizations.create({ name: "Private" });
    await expect(
      appRouter.createCaller(ctxFor(stranger)).events.list({ organizationId: org.id }),
    ).rejects.toThrowError(/not a member/i);
  });

  it("organizations: get returns currency (default GBP); owner sets it, viewer cannot", async () => {
    const owner = await syncAuthUser(repos, { authUserId: "auth_cur", email: "cur@x.com", name: "Cur" });
    const ownerCaller = appRouter.createCaller(ctxFor(owner));
    const org = await ownerCaller.organizations.create({ name: "Curr Co" });
    expect(await ownerCaller.organizations.get({ organizationId: org.id })).toMatchObject({
      currency: "GBP",
    });
    await ownerCaller.organizations.setCurrency({ organizationId: org.id, currency: "EUR" });
    expect(await ownerCaller.organizations.get({ organizationId: org.id })).toMatchObject({
      currency: "EUR",
    });

    const viewer = await syncAuthUser(repos, { authUserId: "auth_curv", email: "curv@x.com", name: null });
    await repos.memberships.upsert({ organizationId: org.id, userId: viewer.id, role: "viewer" });
    await expect(
      appRouter.createCaller(ctxFor(viewer)).organizations.setCurrency({
        organizationId: org.id,
        currency: "USD",
      }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("manages guests through the router: create, list, summary, update, remove", async () => {
    const owner = await syncAuthUser(repos, { authUserId: "auth_gl", email: "gl@x.com", name: "GL" });
    const caller = appRouter.createCaller(ctxFor(owner));
    const org = await caller.organizations.create({ name: "Guestful Wedding" });
    const event = await caller.events.create({
      organizationId: org.id,
      eventTypeKey: "wedding",
      name: "The Big Day",
    });
    const a = await caller.guests.create({
      eventId: event.id,
      guest: { name: "Aunt Mary", rsvpStatus: "coming" },
    });
    await caller.guests.create({ eventId: event.id, guest: { name: "Uncle Joe", email: "" } });

    const page = await caller.guests.list({ eventId: event.id, limit: 50 });
    expect(page.guests).toHaveLength(2);
    const summary = await caller.guests.summary({ eventId: event.id });
    expect(summary).toMatchObject({ total: 2, coming: 1, awaiting: 1 });

    const updated = await caller.guests.update({
      eventId: event.id,
      guestId: a.id,
      patch: { rsvpStatus: "declined" },
    });
    expect(updated.rsvpStatus).toBe("declined");

    await caller.guests.remove({ eventId: event.id, guestId: a.id });
    expect((await caller.guests.list({ eventId: event.id, limit: 50 })).guests).toHaveLength(1);
  });

  it("forbids a non-member from touching an event's guests (cross-tenant)", async () => {
    const owner = await syncAuthUser(repos, { authUserId: "auth_go", email: "go@x.com", name: null });
    const ownerCaller = appRouter.createCaller(ctxFor(owner));
    const org = await ownerCaller.organizations.create({ name: "Sealed Wedding" });
    const event = await ownerCaller.events.create({
      organizationId: org.id,
      eventTypeKey: "wedding",
      name: "Sealed Day",
    });
    const stranger = await syncAuthUser(repos, { authUserId: "auth_gs", email: "gs@x.com", name: null });
    const strangerCaller = appRouter.createCaller(ctxFor(stranger));
    await expect(
      strangerCaller.guests.list({ eventId: event.id, limit: 10 }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(
      strangerCaller.guests.create({ eventId: event.id, guest: { name: "Hax" } }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("maps an unknown event to NOT_FOUND", async () => {
    const owner = await syncAuthUser(repos, { authUserId: "auth_nf", email: "nf@x.com", name: null });
    const caller = appRouter.createCaller(ctxFor(owner));
    await expect(
      caller.guests.list({ eventId: "does-not-exist", limit: 10 }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("manages tasks through the router: create, list, summary(overdue n/a), update, remove", async () => {
    const owner = await syncAuthUser(repos, { authUserId: "auth_tk", email: "tk@x.com", name: "TK" });
    const caller = appRouter.createCaller(ctxFor(owner));
    const org = await caller.organizations.create({ name: "Taskful Wedding" });
    const event = await caller.events.create({
      organizationId: org.id,
      eventTypeKey: "wedding",
      name: "The Big Day",
    });
    const a = await caller.tasks.create({
      eventId: event.id,
      task: { title: "Book venue", dueDate: "2026-07-01" },
    });
    await caller.tasks.create({ eventId: event.id, task: { title: "Send invites", notes: "" } });

    const page = await caller.tasks.list({ eventId: event.id, limit: 50 });
    expect(page.tasks.map((t) => t.title)).toContain("Book venue");
    const summary = await caller.tasks.summary({ eventId: event.id });
    expect(summary).toMatchObject({ total: 2, done: 0, remaining: 2 });

    const updated = await caller.tasks.update({
      eventId: event.id,
      taskId: a.id,
      patch: { done: true },
    });
    expect(updated.done).toBe(true);

    await caller.tasks.remove({ eventId: event.id, taskId: a.id });
    expect((await caller.tasks.list({ eventId: event.id, limit: 50 })).tasks).toHaveLength(1);
  });

  it("forbids a non-member from touching an event's tasks; NOT_FOUND for unknown event", async () => {
    const owner = await syncAuthUser(repos, { authUserId: "auth_to", email: "to@x.com", name: null });
    const ownerCaller = appRouter.createCaller(ctxFor(owner));
    const org = await ownerCaller.organizations.create({ name: "Sealed Tasks" });
    const event = await ownerCaller.events.create({
      organizationId: org.id,
      eventTypeKey: "wedding",
      name: "Sealed Day",
    });
    const stranger = await syncAuthUser(repos, { authUserId: "auth_ts", email: "ts@x.com", name: null });
    const strangerCaller = appRouter.createCaller(ctxFor(stranger));
    await expect(
      strangerCaller.tasks.list({ eventId: event.id, limit: 10 }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(
      ownerCaller.tasks.list({ eventId: "does-not-exist", limit: 10 }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("registry: host gifts appear on the published public site", async () => {
    const owner = await syncAuthUser(repos, { authUserId: "auth_reg", email: "reg@x.com", name: "Reg" });
    const caller = appRouter.createCaller(ctxFor(owner));
    const org = await caller.organizations.create({ name: "Gift Wedding" });
    const event = await caller.events.create({
      organizationId: org.id,
      eventTypeKey: "wedding",
      name: "Our Day",
    });
    await caller.registry.create({ eventId: event.id, item: { title: "Stand mixer", price: "199.99" } });
    expect(await caller.registry.list({ eventId: event.id })).toHaveLength(1);

    const site = await caller.website.editor({ eventId: event.id });
    const pub = appRouter.createCaller(ctxFor(null));
    expect(await pub.registry.publicForSlug({ slug: site.slug })).toEqual([]);
    await caller.website.update({ eventId: event.id, patch: { published: true } });
    const gifts = await pub.registry.publicForSlug({ slug: site.slug });
    expect(gifts).toHaveLength(1);
    expect(gifts[0]).toMatchObject({ title: "Stand mixer", priceCents: 19999 });

    const viewer = await syncAuthUser(repos, { authUserId: "auth_regv", email: "regv@x.com", name: null });
    await repos.memberships.upsert({ organizationId: org.id, userId: viewer.id, role: "viewer" });
    await expect(
      appRouter.createCaller(ctxFor(viewer)).registry.create({ eventId: event.id, item: { title: "x" } }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("vendors: CRUD + booked summary via the router; viewer can't write", async () => {
    const owner = await syncAuthUser(repos, { authUserId: "auth_ven", email: "ven@x.com", name: "Ven" });
    const caller = appRouter.createCaller(ctxFor(owner));
    const org = await caller.organizations.create({ name: "Vendor Wedding" });
    const event = await caller.events.create({
      organizationId: org.id,
      eventTypeKey: "wedding",
      name: "Our Day",
    });
    const v = await caller.vendors.create({
      eventId: event.id,
      vendor: { name: "Bloom", category: "Florist", status: "booked", cost: "1200" },
    });
    expect(v.costCents).toBe(120000);
    await caller.vendors.create({ eventId: event.id, vendor: { name: "Snaps", category: "Photography" } });
    const summary = await caller.vendors.summary({ eventId: event.id });
    expect(summary).toMatchObject({ total: 2, booked: 1, totalBookedCents: 120000 });
    await caller.vendors.update({ eventId: event.id, vendorId: v.id, patch: { status: "declined" } });
    expect((await caller.vendors.summary({ eventId: event.id })).booked).toBe(0);

    const viewer = await syncAuthUser(repos, { authUserId: "auth_venv", email: "venv@x.com", name: null });
    await repos.memberships.upsert({ organizationId: org.id, userId: viewer.id, role: "viewer" });
    await expect(
      appRouter.createCaller(ctxFor(viewer)).vendors.create({ eventId: event.id, vendor: { name: "x" } }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("website: host edits + publishes; the public site is readable only when published", async () => {
    const owner = await syncAuthUser(repos, { authUserId: "auth_web", email: "web@x.com", name: "Web" });
    const caller = appRouter.createCaller(ctxFor(owner));
    const org = await caller.organizations.create({ name: "Sophie & James" });
    const event = await caller.events.create({
      organizationId: org.id,
      eventTypeKey: "wedding",
      name: "Sophie & James",
      date: "2027-06-12",
    });
    const draft = await caller.website.editor({ eventId: event.id });
    expect(draft.published).toBe(false);
    expect(draft.slug).toBeTruthy();

    const pub = appRouter.createCaller(ctxFor(null));
    expect(await pub.website.getPublic({ slug: draft.slug })).toBeNull();

    await caller.website.update({
      eventId: event.id,
      patch: { headline: "We're getting married!", story: "How we met…", published: true },
    });
    const site = await pub.website.getPublic({ slug: draft.slug });
    expect(site).not.toBeNull();
    expect(site!.event.name).toBe("Sophie & James");
    expect(site!.website.headline).toBe("We're getting married!");

    const viewer = await syncAuthUser(repos, { authUserId: "auth_webv", email: "webv@x.com", name: null });
    await repos.memberships.upsert({ organizationId: org.id, userId: viewer.id, role: "viewer" });
    await expect(
      appRouter.createCaller(ctxFor(viewer)).website.editor({ eventId: event.id }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("tasks: generates a dated wedding checklist via the router (one-shot)", async () => {
    const owner = await syncAuthUser(repos, { authUserId: "auth_gen", email: "gen@x.com", name: "Gen" });
    const caller = appRouter.createCaller(ctxFor(owner));
    const org = await caller.organizations.create({ name: "Gen Wedding" });
    const event = await caller.events.create({
      organizationId: org.id,
      eventTypeKey: "wedding",
      name: "Our Day",
      date: "2027-06-12",
    });
    const res = await caller.tasks.generateChecklist({ eventId: event.id });
    expect(res.created).toBeGreaterThan(30);
    const page = await caller.tasks.list({ eventId: event.id, limit: 100 });
    expect(page.tasks.length).toBe(res.created);
    // second run refused (one-shot)
    await expect(caller.tasks.generateChecklist({ eventId: event.id })).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });

  it("manages budget items through the router with exact money + overspend summary", async () => {
    const owner = await syncAuthUser(repos, { authUserId: "auth_bg", email: "bg@x.com", name: "BG" });
    const caller = appRouter.createCaller(ctxFor(owner));
    const org = await caller.organizations.create({ name: "Budgetful Wedding" });
    const event = await caller.events.create({
      organizationId: org.id,
      eventTypeKey: "wedding",
      name: "The Big Day",
    });
    const venue = await caller.budget.create({
      eventId: event.id,
      item: { label: "Venue", estimated: "10000", paid: "2500.50" },
    });
    expect(venue.estimatedCents).toBe(1_000_000);
    expect(venue.paidCents).toBe(250_050);
    await caller.budget.create({ eventId: event.id, item: { label: "Cake", estimated: "300" } });

    const summary = await caller.budget.summary({ eventId: event.id });
    expect(summary).toMatchObject({
      itemCount: 2,
      totalEstimatedCents: 1_030_000,
      totalPaidCents: 250_050,
    });

    const updated = await caller.budget.update({
      eventId: event.id,
      itemId: venue.id,
      patch: { paid: "11000" }, // overspend the venue
    });
    expect(updated.paidCents).toBe(1_100_000);
    const after = await caller.budget.summary({ eventId: event.id });
    expect(after.remainingCents).toBe(1_030_000 - (1_100_000 + 0)); // 300 cake unpaid → negative

    await caller.budget.remove({ eventId: event.id, itemId: venue.id });
    expect((await caller.budget.list({ eventId: event.id, limit: 50 })).items).toHaveLength(1);
  });

  it("forbids a non-member from touching an event's budget; NOT_FOUND for unknown event", async () => {
    const owner = await syncAuthUser(repos, { authUserId: "auth_bo", email: "bo@x.com", name: null });
    const ownerCaller = appRouter.createCaller(ctxFor(owner));
    const org = await ownerCaller.organizations.create({ name: "Sealed Budget" });
    const event = await ownerCaller.events.create({
      organizationId: org.id,
      eventTypeKey: "wedding",
      name: "Sealed Day",
    });
    const stranger = await syncAuthUser(repos, { authUserId: "auth_bs", email: "bs@x.com", name: null });
    const strangerCaller = appRouter.createCaller(ctxFor(stranger));
    await expect(
      strangerCaller.budget.list({ eventId: event.id, limit: 10 }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(
      ownerCaller.budget.list({ eventId: "does-not-exist", limit: 10 }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("builds a seating plan through the router: tables, seat, move, over-capacity, unseat", async () => {
    const owner = await syncAuthUser(repos, { authUserId: "auth_se", email: "se@x.com", name: "SE" });
    const caller = appRouter.createCaller(ctxFor(owner));
    const org = await caller.organizations.create({ name: "Seated Wedding" });
    const event = await caller.events.create({
      organizationId: org.id,
      eventTypeKey: "wedding",
      name: "The Big Day",
    });
    const ada = await caller.guests.create({ eventId: event.id, guest: { name: "Ada" } });
    const bo = await caller.guests.create({ eventId: event.id, guest: { name: "Bo" } });
    const t1 = await caller.seating.createTable({ eventId: event.id, table: { label: "Top", capacity: 1 } });
    const t2 = await caller.seating.createTable({ eventId: event.id, table: { label: "Two", capacity: 8 } });
    expect(t1.capacity).toBe(1);

    await caller.seating.assign({ eventId: event.id, tableId: t1.id, guestId: ada.id });
    await caller.seating.assign({ eventId: event.id, tableId: t1.id, guestId: bo.id }); // over capacity 1
    let plan = await caller.seating.plan({ eventId: event.id });
    expect(plan.summary).toMatchObject({ tableCount: 2, assignedCount: 2, unassignedCount: 0, overCapacityTables: 1 });

    // move Bo to t2 → t1 no longer over capacity
    await caller.seating.assign({ eventId: event.id, tableId: t2.id, guestId: bo.id });
    plan = await caller.seating.plan({ eventId: event.id });
    expect(plan.summary.overCapacityTables).toBe(0);
    expect(plan.tables.find((t) => t.id === t2.id)!.guests.map((g) => g.name)).toEqual(["Bo"]);

    await caller.seating.unassign({ eventId: event.id, guestId: ada.id });
    plan = await caller.seating.plan({ eventId: event.id });
    expect(plan.unassigned.map((g) => g.name)).toEqual(["Ada"]);
  });

  it("events: get returns the event; update sets the date (gated event:update)", async () => {
    const owner = await syncAuthUser(repos, { authUserId: "auth_ev", email: "ev@x.com", name: "Ev" });
    const ownerCaller = appRouter.createCaller(ctxFor(owner));
    const org = await ownerCaller.organizations.create({ name: "Dated Wedding" });
    const event = await ownerCaller.events.create({
      organizationId: org.id,
      eventTypeKey: "wedding",
      name: "Our Day",
      date: "2027-06-12",
    });
    expect(event.date).not.toBeNull();

    const got = await ownerCaller.events.get({ organizationId: org.id, eventId: event.id });
    expect(got).toMatchObject({ name: "Our Day" });
    expect(got.date && new Date(got.date).toISOString().slice(0, 10)).toBe("2027-06-12");

    const updated = await ownerCaller.events.update({
      organizationId: org.id,
      eventId: event.id,
      name: "Our Big Day",
      date: "2027-07-01",
    });
    expect(updated.name).toBe("Our Big Day");

    // a viewer cannot update
    const viewer = await syncAuthUser(repos, { authUserId: "auth_evv", email: "evv@x.com", name: null });
    await repos.memberships.upsert({ organizationId: org.id, userId: viewer.id, role: "viewer" });
    await expect(
      appRouter.createCaller(ctxFor(viewer)).events.update({
        organizationId: org.id,
        eventId: event.id,
        name: "Nope",
      }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("admin: settings is owner/admin-only; owner renames; setMemberRole changes a role", async () => {
    const owner = await syncAuthUser(repos, { authUserId: "auth_ad1", email: "ad1@x.com", name: "Own" });
    const ownerCaller = appRouter.createCaller(ctxFor(owner));
    const org = await ownerCaller.organizations.create({ name: "Admin Co" });

    const viewer = await syncAuthUser(repos, { authUserId: "auth_ad2", email: "ad2@x.com", name: "Vee" });
    await repos.memberships.upsert({ organizationId: org.id, userId: viewer.id, role: "viewer" });
    const viewerCaller = appRouter.createCaller(ctxFor(viewer));

    // settings: forbidden for viewer, ok for owner
    await expect(viewerCaller.admin.settings({ organizationId: org.id })).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
    const settings = await ownerCaller.admin.settings({ organizationId: org.id });
    expect(settings.organization).toMatchObject({ name: "Admin Co" });
    expect(settings.members.map((m) => m.role).sort()).toEqual(["owner", "viewer"]);

    // rename (owner)
    const renamed = await ownerCaller.admin.rename({ organizationId: org.id, name: "Renamed Co" });
    expect(renamed.name).toBe("Renamed Co");

    // setMemberRole: owner promotes the viewer to editor; viewer can't change roles
    await ownerCaller.collaboration.setMemberRole({ organizationId: org.id, userId: viewer.id, role: "editor" });
    const after = await ownerCaller.admin.settings({ organizationId: org.id });
    expect(after.members.find((m) => m.userId === viewer.id)?.role).toBe("editor");
    await expect(
      viewerCaller.collaboration.setMemberRole({ organizationId: org.id, userId: owner.id, role: "viewer" }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("admin: deleteWorkspace is OWNER-only (admin without org:delete is forbidden)", async () => {
    const owner = await syncAuthUser(repos, { authUserId: "auth_ad3", email: "ad3@x.com", name: null });
    const ownerCaller = appRouter.createCaller(ctxFor(owner));
    const org = await ownerCaller.organizations.create({ name: "Doomed Co" });
    const admin = await syncAuthUser(repos, { authUserId: "auth_ad4", email: "ad4@x.com", name: null });
    await repos.memberships.upsert({ organizationId: org.id, userId: admin.id, role: "admin" });
    const adminCaller = appRouter.createCaller(ctxFor(admin));

    await expect(adminCaller.admin.deleteWorkspace({ organizationId: org.id })).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
    await ownerCaller.admin.deleteWorkspace({ organizationId: org.id });
    // the org is gone — owner can no longer read its settings
    await expect(ownerCaller.admin.settings({ organizationId: org.id })).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });

  it("messaging: host posts an announcement; the unauthenticated guest sees it via their token", async () => {
    const owner = await syncAuthUser(repos, { authUserId: "auth_me", email: "me@x.com", name: "ME" });
    const ownerCaller = appRouter.createCaller(ctxFor(owner));
    const org = await ownerCaller.organizations.create({ name: "News Wedding" });
    const event = await ownerCaller.events.create({
      organizationId: org.id,
      eventTypeKey: "wedding",
      name: "The Big Day",
    });
    const guest = await ownerCaller.guests.create({ eventId: event.id, guest: { name: "Aunt Mary" } });

    await ownerCaller.messaging.create({
      eventId: event.id,
      announcement: { title: "Parking", body: "Use lot B" },
    });
    const hostList = await ownerCaller.messaging.list({ eventId: event.id });
    expect(hostList.map((a) => a.title)).toEqual(["Parking"]);

    // PUBLIC, null user
    const publicCaller = appRouter.createCaller(ctxFor(null));
    const seen = await publicCaller.messaging.publicForToken({ token: guest.rsvpToken });
    expect(seen).toHaveLength(1);
    expect(seen[0]).toMatchObject({ title: "Parking", body: "Use lot B" });
    // bad token → [] (no error)
    expect(await publicCaller.messaging.publicForToken({ token: "nope" })).toEqual([]);
  });

  it("messaging: FORBIDDEN for a non-member, NOT_FOUND for an unknown announcement", async () => {
    const owner = await syncAuthUser(repos, { authUserId: "auth_mo", email: "mo@x.com", name: null });
    const ownerCaller = appRouter.createCaller(ctxFor(owner));
    const org = await ownerCaller.organizations.create({ name: "Sealed News" });
    const event = await ownerCaller.events.create({
      organizationId: org.id,
      eventTypeKey: "wedding",
      name: "Sealed Day",
    });
    const stranger = await syncAuthUser(repos, { authUserId: "auth_ms", email: "ms@x.com", name: null });
    await expect(
      appRouter.createCaller(ctxFor(stranger)).messaging.list({ eventId: event.id }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(
      ownerCaller.messaging.update({ eventId: event.id, id: "nope", patch: { title: "x" } }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("rsvp: a guest responds via their token with NO auth; host sees the response", async () => {
    const owner = await syncAuthUser(repos, { authUserId: "auth_re", email: "re@x.com", name: "RE" });
    const ownerCaller = appRouter.createCaller(ctxFor(owner));
    const org = await ownerCaller.organizations.create({ name: "RSVP Wedding" });
    const event = await ownerCaller.events.create({
      organizationId: org.id,
      eventTypeKey: "wedding",
      name: "The Big Day",
    });
    const guest = await ownerCaller.guests.create({ eventId: event.id, guest: { name: "Aunt Mary" } });
    const token = guest.rsvpToken;

    // PUBLIC caller — null user (unauthenticated)
    const publicCaller = appRouter.createCaller(ctxFor(null));
    const view = await publicCaller.rsvp.get({ token });
    expect(view).toEqual({
      eventName: "The Big Day",
      guestName: "Aunt Mary",
      rsvpStatus: "awaiting",
      plusOne: false,
    });
    await publicCaller.rsvp.respond({ token, response: { rsvpStatus: "coming", plusOne: true } });

    // Host overview reflects it
    const overview = await ownerCaller.rsvp.overview({ eventId: event.id });
    expect(overview.summary).toMatchObject({ total: 1, coming: 1 });
    expect(overview.guests[0]).toMatchObject({ name: "Aunt Mary", rsvpStatus: "coming", token });
  });

  it("rsvp: an invalid token is NOT_FOUND; host overview is FORBIDDEN for a non-member", async () => {
    const publicCaller = appRouter.createCaller(ctxFor(null));
    await expect(publicCaller.rsvp.get({ token: "not-real" })).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(
      publicCaller.rsvp.respond({ token: "not-real", response: { rsvpStatus: "coming" } }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });

    const owner = await syncAuthUser(repos, { authUserId: "auth_ro", email: "ro@x.com", name: null });
    const ownerCaller = appRouter.createCaller(ctxFor(owner));
    const org = await ownerCaller.organizations.create({ name: "Sealed RSVP" });
    const event = await ownerCaller.events.create({
      organizationId: org.id,
      eventTypeKey: "wedding",
      name: "Sealed Day",
    });
    const stranger = await syncAuthUser(repos, { authUserId: "auth_rs", email: "rs@x.com", name: null });
    await expect(
      appRouter.createCaller(ctxFor(stranger)).rsvp.overview({ eventId: event.id }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    // and overview requires auth at all
    await expect(
      appRouter.createCaller(ctxFor(null)).rsvp.overview({ eventId: event.id }),
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("seating: FORBIDDEN for a non-member, NOT_FOUND for an unknown table", async () => {
    const owner = await syncAuthUser(repos, { authUserId: "auth_so", email: "so@x.com", name: null });
    const ownerCaller = appRouter.createCaller(ctxFor(owner));
    const org = await ownerCaller.organizations.create({ name: "Sealed Seating" });
    const event = await ownerCaller.events.create({
      organizationId: org.id,
      eventTypeKey: "wedding",
      name: "Sealed Day",
    });
    const guest = await ownerCaller.guests.create({ eventId: event.id, guest: { name: "G" } });
    const stranger = await syncAuthUser(repos, { authUserId: "auth_ss", email: "ss@x.com", name: null });
    const strangerCaller = appRouter.createCaller(ctxFor(stranger));
    await expect(
      strangerCaller.seating.plan({ eventId: event.id }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(
      ownerCaller.seating.assign({ eventId: event.id, tableId: "nope", guestId: guest.id }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });
});
