import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { startTestDb, type TestDb } from "../testing/test-db";
import { createRepositories } from "./index";

type TaskWriteLite = { title: string; done: boolean; dueDate: Date | null };

let db: TestDb;
let repos: ReturnType<typeof createRepositories>;

beforeAll(async () => {
  db = await startTestDb();
  repos = createRepositories(db.prisma);
});
afterAll(async () => {
  await db?.stop();
});

describe("Prisma repository adapters", () => {
  it("creates organizations and lists them for a member", async () => {
    const org = await repos.orgs.create({ name: "Smith" });
    const user = await repos.users.upsertByAuthUserId({
      authUserId: "auth_1",
      email: "a@b.com",
      name: "Ada",
    });
    await repos.memberships.upsert({ organizationId: org.id, userId: user.id, role: "owner" });
    expect(await repos.orgs.findById(org.id)).toMatchObject({ name: "Smith" });
    expect(await repos.orgs.listForUser(user.id)).toHaveLength(1);
  });

  it("allows multiple users with a null email", async () => {
    const a = await repos.users.upsertByAuthUserId({ authUserId: "auth_n1", email: null, name: null });
    const b = await repos.users.upsertByAuthUserId({ authUserId: "auth_n2", email: null, name: null });
    expect(a.id).not.toBe(b.id);
    expect(a.email).toBeNull();
  });

  it("creates a business-typed organization and defaults others to individual", async () => {
    const biz = await repos.orgs.create({ name: "Bliss Events", type: "business" });
    const personal = await repos.orgs.create({ name: "Sara's Planning" });
    expect(biz.type).toBe("business");
    expect(personal.type).toBe("individual");
    expect(await repos.orgs.findById(biz.id)).toMatchObject({ type: "business" });
  });

  it("upserts a user idempotently by authUserId", async () => {
    const a = await repos.users.upsertByAuthUserId({ authUserId: "auth_dup", email: "x@y.com", name: "X" });
    const b = await repos.users.upsertByAuthUserId({ authUserId: "auth_dup", email: "x2@y.com", name: "X2" });
    expect(b.id).toBe(a.id);
    expect(b.email).toBe("x2@y.com");
  });

  it("enforces one membership per (org,user) and lists by org", async () => {
    const org = await repos.orgs.create({ name: "Jones" });
    const user = await repos.users.upsertByAuthUserId({
      authUserId: "auth_2",
      email: "c@b.com",
      name: "Cee",
    });
    await repos.memberships.upsert({ organizationId: org.id, userId: user.id, role: "viewer" });
    await repos.memberships.upsert({ organizationId: org.id, userId: user.id, role: "admin" });
    const list = await repos.memberships.listByOrganization(org.id);
    expect(list).toHaveLength(1);
    expect(list[0]!.role).toBe("admin");
  });

  it("creates events scoped to an organization and finds by id", async () => {
    const org = await repos.orgs.create({ name: "Lee" });
    const event = await repos.events.create({
      organizationId: org.id,
      eventTypeKey: "wedding",
      name: "Lee Wedding",
      date: null,
    });
    expect(await repos.events.findById({ organizationId: org.id, id: event.id })).toMatchObject({
      eventTypeKey: "wedding",
    });
    expect(await repos.events.findById({ organizationId: "other", id: event.id })).toBeNull();
  });

  it("heldFor returns org-level + matching event-level entitlement keys", async () => {
    const org = await repos.orgs.create({ name: "Kim" });
    const event = await repos.events.create({
      organizationId: org.id,
      eventTypeKey: "wedding",
      name: "Kim Wedding",
      date: null,
    });
    await repos.entitlements.grant({
      organizationId: org.id,
      eventId: null,
      key: "all_access",
      source: "plan:agency",
    });
    await repos.entitlements.grant({
      organizationId: org.id,
      eventId: event.id,
      key: "event_type:wedding",
      source: "purchase:1",
    });
    const held = await repos.entitlements.heldFor({ organizationId: org.id, eventId: event.id });
    expect([...held].sort()).toEqual(["all_access", "event_type:wedding"]);
  });

  it("heldFor for a different/null event returns only org-level grants (OR semantics)", async () => {
    const org = await repos.orgs.create({ name: "Ng" });
    const event = await repos.events.create({
      organizationId: org.id,
      eventTypeKey: "wedding",
      name: "Ng Wedding",
      date: null,
    });
    await repos.entitlements.grant({
      organizationId: org.id,
      eventId: null,
      key: "all_access",
      source: "plan:agency",
    });
    await repos.entitlements.grant({
      organizationId: org.id,
      eventId: event.id,
      key: "event_type:wedding",
      source: "purchase:1",
    });
    const heldOther = await repos.entitlements.heldFor({
      organizationId: org.id,
      eventId: "some_other_event",
    });
    expect([...heldOther].sort()).toEqual(["all_access"]);
    const heldNull = await repos.entitlements.heldFor({ organizationId: org.id, eventId: null });
    expect([...heldNull].sort()).toEqual(["all_access"]);
  });

  it("creates an invitation, finds it pending, and accepts it", async () => {
    const org = await repos.orgs.create({ name: "Invite Co" });
    const inv = await repos.invitations.create({
      organizationId: org.id,
      email: "guest@x.com",
      role: "editor",
      token: "tok_abc",
      invitedByUserId: "u_owner",
    });
    expect(inv.status).toBe("pending");
    expect(await repos.invitations.findByToken("tok_abc")).toMatchObject({ id: inv.id });
    expect(
      await repos.invitations.findPending({ organizationId: org.id, email: "guest@x.com" }),
    ).toMatchObject({ id: inv.id });
    await repos.invitations.setStatus({ id: inv.id, status: "accepted" });
    expect(
      await repos.invitations.findPending({ organizationId: org.id, email: "guest@x.com" }),
    ).toBeNull();
  });

  it("lists members with their user details", async () => {
    const org = await repos.orgs.create({ name: "Members Co" });
    const user = await repos.users.upsertByAuthUserId({
      authUserId: "auth_mw",
      email: "mw@x.com",
      name: "Em",
    });
    await repos.memberships.upsert({ organizationId: org.id, userId: user.id, role: "owner" });
    const members = await repos.memberships.listMembersWithUsers(org.id);
    expect(members).toHaveLength(1);
    expect(members[0]).toMatchObject({ email: "mw@x.com", name: "Em", role: "owner" });
  });

  it("grantIfAbsent is idempotent for the same (org,event,key)", async () => {
    const org = await repos.orgs.create({ name: "Idem" });
    const a = await repos.entitlements.grantIfAbsent({
      organizationId: org.id,
      eventId: null,
      key: "all_access",
      source: "plan:a",
    });
    const b = await repos.entitlements.grantIfAbsent({
      organizationId: org.id,
      eventId: null,
      key: "all_access",
      source: "plan:b",
    });
    expect(b.id).toBe(a.id);
    const held = await repos.entitlements.heldFor({ organizationId: org.id, eventId: null });
    expect(held.filter((k) => k === "all_access")).toHaveLength(1);
  });

  it("partial unique index blocks duplicate org-level grants", async () => {
    const org = await repos.orgs.create({ name: "Park" });
    await repos.entitlements.grant({
      organizationId: org.id,
      eventId: null,
      key: "all_access",
      source: "plan:a",
    });
    await expect(
      repos.entitlements.grant({
        organizationId: org.id,
        eventId: null,
        key: "all_access",
        source: "plan:b",
      }),
    ).rejects.toThrow();
  });

  it("getById resolves an event by id alone (no org scope)", async () => {
    const org = await repos.orgs.create({ name: "Direct" });
    const event = await repos.events.create({
      organizationId: org.id,
      eventTypeKey: "wedding",
      name: "Direct Wedding",
      date: null,
    });
    expect(await repos.events.getById(event.id)).toMatchObject({ id: event.id, organizationId: org.id });
    expect(await repos.events.getById("missing")).toBeNull();
  });

  it("creates, reads, updates, removes a guest tenant-scoped", async () => {
    const org = await repos.orgs.create({ name: "Guest Co" });
    const event = await repos.events.create({
      organizationId: org.id,
      eventTypeKey: "wedding",
      name: "Guest Wedding",
      date: null,
    });
    const created = await repos.guests.create({
      organizationId: org.id,
      eventId: event.id,
      name: "Aunt Mary",
      email: null,
      phone: null,
      groupLabel: "Family",
      plusOne: true,
      rsvpStatus: "coming",
      notes: null,
    });
    expect(created).toMatchObject({ name: "Aunt Mary", plusOne: true, rsvpStatus: "coming" });

    expect(
      await repos.guests.getById({ organizationId: org.id, eventId: event.id, id: created.id }),
    ).toMatchObject({ id: created.id });
    // wrong tenant cannot read
    expect(
      await repos.guests.getById({ organizationId: "other", eventId: event.id, id: created.id }),
    ).toBeNull();

    const updated = await repos.guests.update({
      organizationId: org.id,
      eventId: event.id,
      id: created.id,
      patch: { rsvpStatus: "declined", notes: "Cannot make it" },
    });
    expect(updated).toMatchObject({ rsvpStatus: "declined", notes: "Cannot make it" });
    // wrong tenant cannot update
    expect(
      await repos.guests.update({
        organizationId: "other",
        eventId: event.id,
        id: created.id,
        patch: { name: "Hax" },
      }),
    ).toBeNull();

    // wrong tenant cannot remove
    expect(
      await repos.guests.remove({ organizationId: "other", eventId: event.id, id: created.id }),
    ).toBe(false);
    expect(
      await repos.guests.remove({ organizationId: org.id, eventId: event.id, id: created.id }),
    ).toBe(true);
    expect(
      await repos.guests.getById({ organizationId: org.id, eventId: event.id, id: created.id }),
    ).toBeNull();
  });

  it("creates, reads, updates, removes a task tenant-scoped", async () => {
    const org = await repos.orgs.create({ name: "Task Co" });
    const event = await repos.events.create({
      organizationId: org.id,
      eventTypeKey: "wedding",
      name: "Task Wedding",
      date: null,
    });
    const created = await repos.tasks.create({
      organizationId: org.id,
      eventId: event.id,
      title: "Book caterer",
      notes: null,
      done: false,
      dueDate: new Date("2026-07-15T00:00:00.000Z"),
    });
    expect(created).toMatchObject({ title: "Book caterer", done: false });

    expect(
      await repos.tasks.getById({ organizationId: "other", eventId: event.id, id: created.id }),
    ).toBeNull();

    const updated = await repos.tasks.update({
      organizationId: org.id,
      eventId: event.id,
      id: created.id,
      patch: { done: true },
    });
    expect(updated).toMatchObject({ done: true, title: "Book caterer" });
    // wrong tenant cannot update or remove
    expect(
      await repos.tasks.update({
        organizationId: "other",
        eventId: event.id,
        id: created.id,
        patch: { title: "Hax" },
      }),
    ).toBeNull();
    expect(
      await repos.tasks.remove({ organizationId: "other", eventId: event.id, id: created.id }),
    ).toBe(false);
    expect(
      await repos.tasks.remove({ organizationId: org.id, eventId: event.id, id: created.id }),
    ).toBe(true);
  });

  it("paginates tasks by composite keyset (dueDate nulls last) with no repeats or skips", async () => {
    const org = await repos.orgs.create({ name: "Task Page Co" });
    const event = await repos.events.create({
      organizationId: org.id,
      eventTypeKey: "wedding",
      name: "Task Page Wedding",
      date: null,
    });
    // Two share a dueDate (tie broken by createdAt,id); two are null-dueDate (the tail).
    const due = [
      new Date("2026-07-01T00:00:00.000Z"),
      new Date("2026-07-01T00:00:00.000Z"),
      new Date("2026-08-01T00:00:00.000Z"),
      null,
      null,
    ];
    for (let i = 0; i < due.length; i++) {
      await repos.tasks.create({
        organizationId: org.id,
        eventId: event.id,
        title: `T${i}`,
        notes: null,
        done: false,
        dueDate: due[i]!,
      });
    }
    const seen: string[] = [];
    let cursor: string | undefined;
    for (let guard = 0; guard < 10; guard++) {
      const pageRes = await repos.tasks.listByEvent({
        organizationId: org.id,
        eventId: event.id,
        limit: 2,
        cursor,
      });
      seen.push(...pageRes.tasks.map((t) => t.id));
      if (!pageRes.nextCursor) break;
      cursor = pageRes.nextCursor;
    }
    expect(seen).toHaveLength(5);
    expect(new Set(seen).size).toBe(5); // no repeats, no skips
    // Global order: the two earliest (same) dueDate (tie order by id, so compare as a set), then the
    // August one, then the two null-dueDate tail.
    const all = await repos.tasks.listByEvent({ organizationId: org.id, eventId: event.id, limit: 100 });
    const titles = all.tasks.map((t) => t.title);
    expect(titles.slice(0, 2).sort()).toEqual(["T0", "T1"]);
    expect(titles[2]).toBe("T2");
    expect(titles.slice(3).sort()).toEqual(["T3", "T4"]);
  });

  it("summarises tasks: done/remaining/overdue against an injected now", async () => {
    const org = await repos.orgs.create({ name: "Task Summary Co" });
    const event = await repos.events.create({
      organizationId: org.id,
      eventTypeKey: "wedding",
      name: "Task Summary Wedding",
      date: null,
    });
    const now = new Date("2026-08-01T00:00:00.000Z");
    const rows: TaskWriteLite[] = [
      { title: "done", done: true, dueDate: new Date("2026-07-01T00:00:00.000Z") }, // done late → not overdue
      { title: "overdue", done: false, dueDate: new Date("2026-07-01T00:00:00.000Z") },
      { title: "upcoming", done: false, dueDate: new Date("2026-09-01T00:00:00.000Z") },
      { title: "no date", done: false, dueDate: null },
    ];
    for (const r of rows) {
      await repos.tasks.create({ organizationId: org.id, eventId: event.id, notes: null, ...r });
    }
    const summary = await repos.tasks.summaryByEvent({
      organizationId: org.id,
      eventId: event.id,
      now,
    });
    expect(summary).toEqual({ total: 4, done: 1, remaining: 3, overdue: 1 });
  });

  it("creates, reads, updates, removes a budget item tenant-scoped", async () => {
    const org = await repos.orgs.create({ name: "Budget Co" });
    const event = await repos.events.create({
      organizationId: org.id,
      eventTypeKey: "wedding",
      name: "Budget Wedding",
      date: null,
    });
    const created = await repos.budget.create({
      organizationId: org.id,
      eventId: event.id,
      label: "Venue",
      category: "Venue",
      estimatedCents: 1_000_000,
      paidCents: 250_000,
      notes: null,
    });
    expect(created).toMatchObject({ label: "Venue", estimatedCents: 1_000_000, paidCents: 250_000 });

    expect(
      await repos.budget.getById({ organizationId: "other", eventId: event.id, id: created.id }),
    ).toBeNull();

    const updated = await repos.budget.update({
      organizationId: org.id,
      eventId: event.id,
      id: created.id,
      patch: { paidCents: 1_000_000 },
    });
    expect(updated).toMatchObject({ paidCents: 1_000_000, estimatedCents: 1_000_000 });
    expect(
      await repos.budget.update({
        organizationId: "other",
        eventId: event.id,
        id: created.id,
        patch: { label: "Hax" },
      }),
    ).toBeNull();
    expect(
      await repos.budget.remove({ organizationId: "other", eventId: event.id, id: created.id }),
    ).toBe(false);
    expect(
      await repos.budget.remove({ organizationId: org.id, eventId: event.id, id: created.id }),
    ).toBe(true);
  });

  it("paginates budget items by id keyset and SUMs the summary (overspend → negative remaining)", async () => {
    const org = await repos.orgs.create({ name: "Budget Sum Co" });
    const event = await repos.events.create({
      organizationId: org.id,
      eventTypeKey: "wedding",
      name: "Budget Sum Wedding",
      date: null,
    });
    const items = [
      { estimatedCents: 500_000, paidCents: 500_000 },
      { estimatedCents: 300_000, paidCents: 100_000 },
      { estimatedCents: 50_000, paidCents: 75_000 }, // overspent
    ];
    for (let i = 0; i < items.length; i++) {
      await repos.budget.create({
        organizationId: org.id,
        eventId: event.id,
        label: `Item ${i}`,
        category: null,
        notes: null,
        ...items[i]!,
      });
    }
    const seen: string[] = [];
    let cursor: string | undefined;
    for (let guard = 0; guard < 10; guard++) {
      const pageRes = await repos.budget.listByEvent({
        organizationId: org.id,
        eventId: event.id,
        limit: 2,
        cursor,
      });
      seen.push(...pageRes.items.map((b) => b.id));
      if (!pageRes.nextCursor) break;
      cursor = pageRes.nextCursor;
    }
    expect(new Set(seen).size).toBe(3);

    const summary = await repos.budget.summaryByEvent({ organizationId: org.id, eventId: event.id });
    expect(summary).toEqual({
      itemCount: 3,
      totalEstimatedCents: 850_000,
      totalPaidCents: 675_000,
      remainingCents: 175_000,
    });
  });

  it("budget summary of an empty event is all zeros", async () => {
    const org = await repos.orgs.create({ name: "Budget Empty Co" });
    const event = await repos.events.create({
      organizationId: org.id,
      eventTypeKey: "wedding",
      name: "Budget Empty Wedding",
      date: null,
    });
    expect(
      await repos.budget.summaryByEvent({ organizationId: org.id, eventId: event.id }),
    ).toEqual({ itemCount: 0, totalEstimatedCents: 0, totalPaidCents: 0, remainingCents: 0 });
  });

  it("admin: renames an organization and deletes it (cascading all children)", async () => {
    const org = await repos.orgs.create({ name: "Old Name" });
    const user = await repos.users.upsertByAuthUserId({ authUserId: "auth_adm", email: "adm@x.com", name: "A" });
    await repos.memberships.upsert({ organizationId: org.id, userId: user.id, role: "owner" });
    const event = await repos.events.create({
      organizationId: org.id, eventTypeKey: "wedding", name: "E", date: null,
    });
    await repos.guests.create({
      organizationId: org.id, eventId: event.id, name: "G", email: null, phone: null,
      groupLabel: null, plusOne: false, rsvpStatus: "awaiting", notes: null,
    });

    const renamed = await repos.orgs.rename({ id: org.id, name: "New Name" });
    expect(renamed.name).toBe("New Name");
    expect(await repos.orgs.findById(org.id)).toMatchObject({ name: "New Name" });

    await repos.orgs.delete(org.id);
    expect(await repos.orgs.findById(org.id)).toBeNull();
    // children cascaded away
    expect(await repos.events.findById({ organizationId: org.id, id: event.id })).toBeNull();
    expect(await repos.memberships.listMembersWithUsers(org.id)).toHaveLength(0);
    expect(await repos.guests.summaryByEvent({ organizationId: org.id, eventId: event.id })).toMatchObject({
      total: 0,
    });
  });

  it("photos: create, newest-first list, remove (tenant-scoped)", async () => {
    const org = await repos.orgs.create({ name: "Photo Co" });
    const event = await repos.events.create({
      organizationId: org.id, eventTypeKey: "wedding", name: "P Wedding", date: null,
    });
    const a = await repos.photos.create({
      organizationId: org.id, eventId: event.id, storagePath: "photos/a.jpg", caption: null,
    });
    const b = await repos.photos.create({
      organizationId: org.id, eventId: event.id, storagePath: "photos/b.jpg", caption: "Hi",
    });
    const list = await repos.photos.listByEvent({ organizationId: org.id, eventId: event.id });
    expect(list.map((p) => p.id)).toEqual([b.id, a.id]);
    expect(await repos.photos.remove({ organizationId: "other", eventId: event.id, id: a.id })).toBe(false);
    expect(await repos.photos.remove({ organizationId: org.id, eventId: event.id, id: a.id })).toBe(true);
    expect(await repos.photos.listByEvent({ organizationId: org.id, eventId: event.id })).toHaveLength(1);
  });

  it("registry: CRUD tenant-scoped", async () => {
    const org = await repos.orgs.create({ name: "Reg Co" });
    const event = await repos.events.create({
      organizationId: org.id, eventTypeKey: "wedding", name: "R Wedding", date: null,
    });
    const item = await repos.registry.create({
      organizationId: org.id, eventId: event.id, title: "Toaster", url: "https://x", note: null, priceCents: 4999,
    });
    expect(item).toMatchObject({ title: "Toaster", priceCents: 4999 });
    expect(await repos.registry.listByEvent({ organizationId: org.id, eventId: event.id })).toHaveLength(1);
    expect(await repos.registry.getById({ organizationId: "other", eventId: event.id, id: item.id })).toBeNull();
    const up = await repos.registry.update({
      organizationId: org.id, eventId: event.id, id: item.id, patch: { priceCents: 5999 },
    });
    expect(up).toMatchObject({ priceCents: 5999 });
    expect(await repos.registry.remove({ organizationId: org.id, eventId: event.id, id: item.id })).toBe(true);
  });

  it("vendors: CRUD tenant-scoped, category/name ordering, booked summary", async () => {
    const org = await repos.orgs.create({ name: "Vendor Co" });
    const event = await repos.events.create({
      organizationId: org.id, eventTypeKey: "wedding", name: "V Wedding", date: null,
    });
    const base = { organizationId: org.id, eventId: event.id, contactName: null, contactEmail: null,
      contactPhone: null, website: null, notes: null, depositPaidCents: 0 };
    await repos.vendors.create({ ...base, category: "Photography", name: "Snaps", status: "quoted", costCents: 250000 });
    const florist = await repos.vendors.create({ ...base, category: "Catering", name: "Bloom", status: "booked", costCents: 120000 });

    const list = await repos.vendors.listByEvent({ organizationId: org.id, eventId: event.id });
    expect(list.map((v) => v.name)).toEqual(["Bloom", "Snaps"]); // Catering before Photography

    expect(await repos.vendors.getById({ organizationId: "other", eventId: event.id, id: florist.id })).toBeNull();
    const updated = await repos.vendors.update({
      organizationId: org.id, eventId: event.id, id: florist.id, patch: { status: "booked", costCents: 150000 },
    });
    expect(updated).toMatchObject({ costCents: 150000 });

    const summary = await repos.vendors.summaryByEvent({ organizationId: org.id, eventId: event.id });
    expect(summary).toEqual({
      total: 2,
      byStatus: { researching: 0, contacted: 0, quoted: 1, booked: 1, declined: 0 },
      estimatedCents: 400000,
      paidCents: 0,
      outstandingCents: 400000,
    });

    expect(await repos.vendors.remove({ organizationId: "other", eventId: event.id, id: florist.id })).toBe(false);
    expect(await repos.vendors.remove({ organizationId: org.id, eventId: event.id, id: florist.id })).toBe(true);
  });

  it("messaging: announcement CRUD tenant-scoped, newest-first, cascade with event", async () => {
    const org = await repos.orgs.create({ name: "Msg Co" });
    const event = await repos.events.create({
      organizationId: org.id,
      eventTypeKey: "wedding",
      name: "Msg Wedding",
      date: null,
    });
    const a = await repos.announcements.create({
      organizationId: org.id, eventId: event.id, title: "First", body: "a",
    });
    const b = await repos.announcements.create({
      organizationId: org.id, eventId: event.id, title: "Second", body: "b",
    });
    const list = await repos.announcements.listByEvent({ organizationId: org.id, eventId: event.id });
    expect(list.map((x) => x.id)).toEqual([b.id, a.id]); // newest first

    expect(
      await repos.announcements.getById({ organizationId: "other", eventId: event.id, id: a.id }),
    ).toBeNull();
    const updated = await repos.announcements.update({
      organizationId: org.id, eventId: event.id, id: a.id, patch: { body: "edited" },
    });
    expect(updated).toMatchObject({ title: "First", body: "edited" });
    expect(
      await repos.announcements.update({ organizationId: "other", eventId: event.id, id: a.id, patch: { title: "x" } }),
    ).toBeNull();
    expect(await repos.announcements.remove({ organizationId: org.id, eventId: event.id, id: a.id })).toBe(true);
    expect(await repos.announcements.remove({ organizationId: org.id, eventId: event.id, id: a.id })).toBe(false);

    // cascade: deleting the event removes its announcements
    await repos.events.create({ organizationId: org.id, eventTypeKey: "wedding", name: "x", date: null });
    expect(await repos.announcements.listByEvent({ organizationId: org.id, eventId: event.id })).toHaveLength(1);
  });

  it("rsvp: a created guest gets a unique token; findByRsvpToken + setRsvpByToken work", async () => {
    const org = await repos.orgs.create({ name: "RSVP Co" });
    const event = await repos.events.create({
      organizationId: org.id,
      eventTypeKey: "wedding",
      name: "RSVP Wedding",
      date: null,
    });
    const a = await repos.guests.create({
      organizationId: org.id, eventId: event.id, name: "Ada", email: null, phone: null,
      groupLabel: null, plusOne: false, rsvpStatus: "awaiting", notes: null,
    });
    const b = await repos.guests.create({
      organizationId: org.id, eventId: event.id, name: "Bo", email: null, phone: null,
      groupLabel: null, plusOne: false, rsvpStatus: "awaiting", notes: null,
    });
    expect(a.rsvpToken).toBeTruthy();
    expect(a.rsvpToken).not.toBe(b.rsvpToken); // unique per guest

    const found = await repos.guests.findByRsvpToken(a.rsvpToken);
    expect(found).toMatchObject({ id: a.id, name: "Ada" });
    expect(await repos.guests.findByRsvpToken("not-a-real-token")).toBeNull();

    const updated = await repos.guests.setRsvpByToken({
      token: a.rsvpToken,
      rsvpStatus: "coming",
      plusOne: true,
    });
    expect(updated).toMatchObject({ rsvpStatus: "coming", plusOne: true });
    expect(await repos.guests.setRsvpByToken({ token: "nope", rsvpStatus: "coming" })).toBeNull();

    // setRsvpByToken without plusOne leaves it untouched
    const again = await repos.guests.setRsvpByToken({ token: a.rsvpToken, rsvpStatus: "maybe" });
    expect(again).toMatchObject({ rsvpStatus: "maybe", plusOne: true });
  });

  it("seating: table CRUD, upsert-by-guestId moves a guest, countByTable", async () => {
    const org = await repos.orgs.create({ name: "Seat Co" });
    const event = await repos.events.create({
      organizationId: org.id,
      eventTypeKey: "wedding",
      name: "Seat Wedding",
      date: null,
    });
    const guest = await repos.guests.create({
      organizationId: org.id,
      eventId: event.id,
      name: "Ada",
      email: null,
      phone: null,
      groupLabel: null,
      plusOne: false,
      rsvpStatus: "coming",
      notes: null,
    });
    const t1 = await repos.seating.createTable({ organizationId: org.id, eventId: event.id, label: "A", capacity: 4 });
    const t2 = await repos.seating.createTable({ organizationId: org.id, eventId: event.id, label: "B", capacity: 4 });

    // tenant-scoped update/remove guards
    expect(
      await repos.seating.updateTable({ organizationId: "other", eventId: event.id, id: t1.id, patch: { label: "x" } }),
    ).toBeNull();
    const renamed = await repos.seating.updateTable({
      organizationId: org.id,
      eventId: event.id,
      id: t1.id,
      patch: { label: "Top", capacity: 6 },
    });
    expect(renamed).toMatchObject({ label: "Top", capacity: 6 });

    // assign, then re-assign → moves (one seat per guest)
    await repos.seating.assign({ organizationId: org.id, eventId: event.id, tableId: t1.id, guestId: guest.id });
    expect(await repos.seating.countByTable({ organizationId: org.id, eventId: event.id, tableId: t1.id })).toBe(1);
    await repos.seating.assign({ organizationId: org.id, eventId: event.id, tableId: t2.id, guestId: guest.id });
    expect(await repos.seating.countByTable({ organizationId: org.id, eventId: event.id, tableId: t1.id })).toBe(0);
    expect(await repos.seating.countByTable({ organizationId: org.id, eventId: event.id, tableId: t2.id })).toBe(1);

    const assignments = await repos.seating.listAssignments({ organizationId: org.id, eventId: event.id });
    expect(assignments).toHaveLength(1);
    expect(assignments[0]).toMatchObject({ tableId: t2.id, guestId: guest.id });

    expect(await repos.seating.unassign({ organizationId: org.id, eventId: event.id, guestId: guest.id })).toBe(true);
    expect(await repos.seating.unassign({ organizationId: org.id, eventId: event.id, guestId: guest.id })).toBe(false);
  });

  it("seating: deleting a table frees its guests (FK cascade)", async () => {
    const org = await repos.orgs.create({ name: "Cascade Tbl Co" });
    const event = await repos.events.create({ organizationId: org.id, eventTypeKey: "wedding", name: "E", date: null });
    const g = await repos.guests.create({
      organizationId: org.id, eventId: event.id, name: "G", email: null, phone: null,
      groupLabel: null, plusOne: false, rsvpStatus: "coming", notes: null,
    });
    const table = await repos.seating.createTable({ organizationId: org.id, eventId: event.id, label: "A", capacity: 4 });
    await repos.seating.assign({ organizationId: org.id, eventId: event.id, tableId: table.id, guestId: g.id });
    expect(await repos.seating.removeTable({ organizationId: org.id, eventId: event.id, id: table.id })).toBe(true);
    expect(await repos.seating.listAssignments({ organizationId: org.id, eventId: event.id })).toHaveLength(0);
  });

  it("seating: deleting a guest frees the seat (FK cascade)", async () => {
    const org = await repos.orgs.create({ name: "Cascade Guest Co" });
    const event = await repos.events.create({ organizationId: org.id, eventTypeKey: "wedding", name: "E", date: null });
    const g = await repos.guests.create({
      organizationId: org.id, eventId: event.id, name: "G", email: null, phone: null,
      groupLabel: null, plusOne: false, rsvpStatus: "coming", notes: null,
    });
    const table = await repos.seating.createTable({ organizationId: org.id, eventId: event.id, label: "A", capacity: 4 });
    await repos.seating.assign({ organizationId: org.id, eventId: event.id, tableId: table.id, guestId: g.id });
    expect(await repos.guests.remove({ organizationId: org.id, eventId: event.id, id: g.id })).toBe(true);
    expect(await repos.seating.listAssignments({ organizationId: org.id, eventId: event.id })).toHaveLength(0);
  });

  it("paginates guests by id keyset and summarises rsvp counts", async () => {
    const org = await repos.orgs.create({ name: "Paginate Co" });
    const event = await repos.events.create({
      organizationId: org.id,
      eventTypeKey: "wedding",
      name: "Paginate Wedding",
      date: null,
    });
    const statuses = ["coming", "coming", "declined", "maybe", "awaiting"] as const;
    for (let i = 0; i < statuses.length; i++) {
      await repos.guests.create({
        organizationId: org.id,
        eventId: event.id,
        name: `G${i}`,
        email: null,
        phone: null,
        groupLabel: null,
        plusOne: false,
        rsvpStatus: statuses[i]!,
        notes: null,
      });
    }
    const first = await repos.guests.listByEvent({
      organizationId: org.id,
      eventId: event.id,
      limit: 2,
    });
    expect(first.guests).toHaveLength(2);
    expect(first.nextCursor).not.toBeNull();
    const second = await repos.guests.listByEvent({
      organizationId: org.id,
      eventId: event.id,
      limit: 2,
      cursor: first.nextCursor!,
    });
    expect(second.guests).toHaveLength(2);
    const third = await repos.guests.listByEvent({
      organizationId: org.id,
      eventId: event.id,
      limit: 2,
      cursor: second.nextCursor!,
    });
    expect(third.guests).toHaveLength(1);
    expect(third.nextCursor).toBeNull();
    // no id repeats across pages
    const ids = [...first.guests, ...second.guests, ...third.guests].map((g) => g.id);
    expect(new Set(ids).size).toBe(5);

    const summary = await repos.guests.summaryByEvent({ organizationId: org.id, eventId: event.id });
    expect(summary).toEqual({ total: 5, coming: 2, declined: 1, maybe: 1, awaiting: 1 });
  });
});
