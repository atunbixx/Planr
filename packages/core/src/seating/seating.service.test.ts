import { describe, it, expect } from "vitest";
import { makeFakeRepositories } from "../testing/fakes";
import { makeTenancyService } from "../services/tenancy.service";
import { makeEventService } from "../services/event.service";
import { makeGuestService } from "../guests/guest.service";
import { makeSeatingService } from "./seating.service";

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
  const seating = makeSeatingService(repos, { freeLaunch: opts.freeLaunch ?? true });
  const addGuest = (name: string) =>
    guestSvc.create(ownerUserId, { eventId: event.id, guest: { name } });
  return { repos, organization, event, ownerUserId, seating, guestSvc, addGuest };
}

describe("seating service", () => {
  it("plans an empty event: no tables, all guests unseated", async () => {
    const { seating, event, ownerUserId, addGuest } = await setup();
    await addGuest("Ada");
    await addGuest("Bo");
    const plan = await seating.plan(ownerUserId, { eventId: event.id });
    expect(plan.tables).toHaveLength(0);
    expect(plan.unassigned.map((g) => g.name).sort()).toEqual(["Ada", "Bo"]);
    expect(plan.summary).toMatchObject({ tableCount: 0, assignedCount: 0, unassignedCount: 2 });
  });

  it("seats guests, groups them under their table, and tracks the unseated pool", async () => {
    const { seating, event, ownerUserId, addGuest } = await setup();
    const ada = await addGuest("Ada");
    const bo = await addGuest("Bo");
    await addGuest("Cy");
    const table = await seating.createTable(ownerUserId, {
      eventId: event.id,
      table: { label: "Top table", capacity: 8 },
    });
    await seating.assign(ownerUserId, { eventId: event.id, tableId: table.id, guestId: ada.id });
    await seating.assign(ownerUserId, { eventId: event.id, tableId: table.id, guestId: bo.id });

    const plan = await seating.plan(ownerUserId, { eventId: event.id });
    expect(plan.tables[0]!.guests.map((g) => g.name).sort()).toEqual(["Ada", "Bo"]);
    expect(plan.unassigned.map((g) => g.name)).toEqual(["Cy"]);
    expect(plan.summary).toMatchObject({ tableCount: 1, totalCapacity: 8, assignedCount: 2, unassignedCount: 1 });
  });

  it("moves a guest when re-assigned to another table (one seat per guest)", async () => {
    const { seating, event, ownerUserId, addGuest } = await setup();
    const ada = await addGuest("Ada");
    const t1 = await seating.createTable(ownerUserId, { eventId: event.id, table: { label: "A", capacity: 4 } });
    const t2 = await seating.createTable(ownerUserId, { eventId: event.id, table: { label: "B", capacity: 4 } });
    await seating.assign(ownerUserId, { eventId: event.id, tableId: t1.id, guestId: ada.id });
    await seating.assign(ownerUserId, { eventId: event.id, tableId: t2.id, guestId: ada.id });
    const plan = await seating.plan(ownerUserId, { eventId: event.id });
    expect(plan.tables.find((t) => t.id === t1.id)!.guests).toHaveLength(0);
    expect(plan.tables.find((t) => t.id === t2.id)!.guests.map((g) => g.name)).toEqual(["Ada"]);
    expect(plan.summary.assignedCount).toBe(1);
  });

  it("allows over-capacity and surfaces it in the plan", async () => {
    const { seating, event, ownerUserId, addGuest } = await setup();
    const table = await seating.createTable(ownerUserId, { eventId: event.id, table: { label: "Tiny", capacity: 1 } });
    const a = await addGuest("A");
    const b = await addGuest("B");
    await seating.assign(ownerUserId, { eventId: event.id, tableId: table.id, guestId: a.id });
    await seating.assign(ownerUserId, { eventId: event.id, tableId: table.id, guestId: b.id });
    const plan = await seating.plan(ownerUserId, { eventId: event.id });
    expect(plan.tables[0]!.overCapacity).toBe(true);
    expect(plan.summary.overCapacityTables).toBe(1);
  });

  it("unassigns a guest back to the pool; 404 when not seated", async () => {
    const { seating, event, ownerUserId, addGuest } = await setup();
    const table = await seating.createTable(ownerUserId, { eventId: event.id, table: { label: "A", capacity: 4 } });
    const ada = await addGuest("Ada");
    await seating.assign(ownerUserId, { eventId: event.id, tableId: table.id, guestId: ada.id });
    await seating.unassign(ownerUserId, { eventId: event.id, guestId: ada.id });
    const plan = await seating.plan(ownerUserId, { eventId: event.id });
    expect(plan.unassigned.map((g) => g.name)).toEqual(["Ada"]);
    await expect(
      seating.unassign(ownerUserId, { eventId: event.id, guestId: ada.id }),
    ).rejects.toThrowError(/not found/i);
  });

  it("removing a table frees its guests back to the pool (cascade)", async () => {
    const { seating, event, ownerUserId, addGuest } = await setup();
    const table = await seating.createTable(ownerUserId, { eventId: event.id, table: { label: "A", capacity: 4 } });
    const ada = await addGuest("Ada");
    await seating.assign(ownerUserId, { eventId: event.id, tableId: table.id, guestId: ada.id });
    await seating.removeTable(ownerUserId, { eventId: event.id, tableId: table.id });
    const plan = await seating.plan(ownerUserId, { eventId: event.id });
    expect(plan.tables).toHaveLength(0);
    expect(plan.unassigned.map((g) => g.name)).toEqual(["Ada"]);
  });

  it("refuses to seat a guest who does not belong to the event", async () => {
    const { seating, event, ownerUserId } = await setup();
    const other = await setup(); // a different org/event with its own guest
    const stranger = await other.addGuest("Stranger");
    const table = await seating.createTable(ownerUserId, { eventId: event.id, table: { label: "A", capacity: 4 } });
    await expect(
      seating.assign(ownerUserId, { eventId: event.id, tableId: table.id, guestId: stranger.id }),
    ).rejects.toThrowError(/not found/i);
  });

  it("404s assigning to an unknown table", async () => {
    const { seating, event, ownerUserId, addGuest } = await setup();
    const ada = await addGuest("Ada");
    await expect(
      seating.assign(ownerUserId, { eventId: event.id, tableId: "nope", guestId: ada.id }),
    ).rejects.toThrowError(/not found/i);
  });

  it("forbids a non-member (cross-tenant) and a viewer-write", async () => {
    const { seating, event, organization, repos } = await setup();
    const stranger = await repos.users.upsertByAuthUserId({ authUserId: "auth_x", email: "x@x.com", name: null });
    await expect(seating.plan(stranger.id, { eventId: event.id })).rejects.toThrowError(/member|forbidden/i);

    const viewer = await repos.users.upsertByAuthUserId({ authUserId: "auth_v", email: "v@x.com", name: null });
    await repos.memberships.upsert({ organizationId: organization.id, userId: viewer.id, role: "viewer" });
    await expect(seating.plan(viewer.id, { eventId: event.id })).resolves.toBeDefined();
    await expect(
      seating.createTable(viewer.id, { eventId: event.id, table: { label: "x", capacity: 4 } }),
    ).rejects.toThrowError(/forbidden/i);
  });

  it("routes through the entitlement engine when freeLaunch is off — and seating LOCKS (non-baseline)", async () => {
    const free = await setup({ freeLaunch: true });
    await expect(free.seating.plan(free.ownerUserId, { eventId: free.event.id })).resolves.toBeDefined();
    // seating is NOT free-baseline, so with the gate live and no entitlement it locks.
    const paid = await setup({ freeLaunch: false });
    await expect(paid.seating.plan(paid.ownerUserId, { eventId: paid.event.id })).rejects.toThrowError(
      /locked/i,
    );
  });
});
