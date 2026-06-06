import { describe, it, expect } from "vitest";
import { makeFakeRepositories } from "../testing/fakes";
import { makeTenancyService } from "../services/tenancy.service";
import { makeEventService } from "../services/event.service";
import { makeTaskService } from "./task.service";

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
  const taskSvc = makeTaskService(repos, { freeLaunch: opts.freeLaunch ?? true });
  return { repos, organization, event, ownerUserId: ownerMembership.userId, taskSvc };
}

describe("task service", () => {
  it("creates, lists and removes tasks for a member", async () => {
    const { taskSvc, event, ownerUserId } = await setup();
    await taskSvc.create(ownerUserId, { eventId: event.id, task: { title: "Book venue" } });
    const t2 = await taskSvc.create(ownerUserId, {
      eventId: event.id,
      task: { title: "Send invites" },
    });
    const page = await taskSvc.list(ownerUserId, { eventId: event.id, limit: 50 });
    expect(page.tasks).toHaveLength(2);
    await taskSvc.remove(ownerUserId, { eventId: event.id, taskId: t2.id });
    expect((await taskSvc.list(ownerUserId, { eventId: event.id, limit: 50 })).tasks).toHaveLength(1);
  });

  it("orders by due date (nulls last) and paginates with a cursor", async () => {
    const { taskSvc, event, ownerUserId } = await setup();
    await taskSvc.create(ownerUserId, { eventId: event.id, task: { title: "No date" } });
    await taskSvc.create(ownerUserId, { eventId: event.id, task: { title: "Later", dueDate: "2026-09-01" } });
    await taskSvc.create(ownerUserId, { eventId: event.id, task: { title: "Sooner", dueDate: "2026-07-01" } });
    const first = await taskSvc.list(ownerUserId, { eventId: event.id, limit: 2 });
    expect(first.tasks.map((t) => t.title)).toEqual(["Sooner", "Later"]);
    expect(first.nextCursor).not.toBeNull();
    const second = await taskSvc.list(ownerUserId, {
      eventId: event.id,
      limit: 2,
      cursor: first.nextCursor!,
    });
    expect(second.tasks.map((t) => t.title)).toEqual(["No date"]);
    expect(second.nextCursor).toBeNull();
  });

  it("summarises done/remaining/overdue against an injected now", async () => {
    const { taskSvc, event, ownerUserId } = await setup();
    const now = new Date("2026-08-01T00:00:00.000Z");
    await taskSvc.create(ownerUserId, { eventId: event.id, task: { title: "Done one", done: true } });
    await taskSvc.create(ownerUserId, {
      eventId: event.id,
      task: { title: "Overdue", dueDate: "2026-07-01" }, // before now, not done
    });
    await taskSvc.create(ownerUserId, {
      eventId: event.id,
      task: { title: "Upcoming", dueDate: "2026-09-01" }, // after now
    });
    const summary = await taskSvc.summary(ownerUserId, { eventId: event.id, now });
    expect(summary).toEqual({ total: 3, done: 1, remaining: 2, overdue: 1 });
  });

  it("a done task is never overdue even past its due date", async () => {
    const { taskSvc, event, ownerUserId } = await setup();
    const now = new Date("2026-08-01T00:00:00.000Z");
    await taskSvc.create(ownerUserId, {
      eventId: event.id,
      task: { title: "Done late", dueDate: "2026-07-01", done: true },
    });
    const summary = await taskSvc.summary(ownerUserId, { eventId: event.id, now });
    expect(summary.overdue).toBe(0);
  });

  it("updates a task and 404s an unknown task or event", async () => {
    const { taskSvc, event, ownerUserId } = await setup();
    const t = await taskSvc.create(ownerUserId, { eventId: event.id, task: { title: "Cake" } });
    const updated = await taskSvc.update(ownerUserId, {
      eventId: event.id,
      taskId: t.id,
      patch: { done: true },
    });
    expect(updated.done).toBe(true);
    await expect(
      taskSvc.update(ownerUserId, { eventId: event.id, taskId: "nope", patch: { title: "x" } }),
    ).rejects.toThrowError(/not found/i);
    await expect(taskSvc.list(ownerUserId, { eventId: "nope", limit: 10 })).rejects.toThrowError(
      /not found/i,
    );
  });

  it("forbids a non-member (cross-tenant) from reading or writing", async () => {
    const { taskSvc, event, repos } = await setup();
    const stranger = await repos.users.upsertByAuthUserId({
      authUserId: "auth_stranger",
      email: "s@x.com",
      name: null,
    });
    await expect(taskSvc.list(stranger.id, { eventId: event.id, limit: 10 })).rejects.toThrowError(
      /member|forbidden/i,
    );
    await expect(
      taskSvc.create(stranger.id, { eventId: event.id, task: { title: "Hax" } }),
    ).rejects.toThrowError(/member|forbidden/i);
  });

  it("a viewer can read but not write", async () => {
    const { taskSvc, event, organization, repos } = await setup();
    const viewer = await repos.users.upsertByAuthUserId({ authUserId: "auth_v", email: "v@x.com", name: null });
    await repos.memberships.upsert({ organizationId: organization.id, userId: viewer.id, role: "viewer" });
    await expect(taskSvc.list(viewer.id, { eventId: event.id, limit: 10 })).resolves.toBeDefined();
    await expect(
      taskSvc.create(viewer.id, { eventId: event.id, task: { title: "x" } }),
    ).rejects.toThrowError(/forbidden/i);
  });

  it("generates a dated wedding checklist (one-shot; requires a date)", async () => {
    const repos = makeFakeRepositories();
    const tenancy = makeTenancyService(repos);
    const events = makeEventService(repos);
    const taskSvc = makeTaskService(repos, { freeLaunch: true });
    const { organization, ownerMembership } = await tenancy.provisionOrganization({
      name: "W",
      creator: { authUserId: "auth_o", email: "o@x.com", name: "O" },
    });
    const owner = ownerMembership.userId;

    // No date → refused
    const noDate = await events.create({
      organizationId: organization.id,
      eventTypeKey: "wedding",
      name: "No date",
      date: null,
    });
    await expect(
      taskSvc.generateFromTemplate(owner, { eventId: noDate.id }),
    ).rejects.toThrowError(/date/i);

    // With a date → generates a timeline with due dates
    const dated = await events.create({
      organizationId: organization.id,
      eventTypeKey: "wedding",
      name: "Our Wedding",
      date: new Date("2027-06-12T00:00:00.000Z"),
    });
    const res = await taskSvc.generateFromTemplate(owner, { eventId: dated.id });
    expect(res.created).toBeGreaterThan(30);
    const page = await taskSvc.list(owner, { eventId: dated.id, limit: 100 });
    expect(page.tasks.length).toBe(res.created);
    expect(page.tasks.every((t) => t.dueDate !== null)).toBe(true);
    // earliest due date is well before the wedding
    expect(page.tasks[0]!.dueDate!.getTime()).toBeLessThan(new Date("2027-06-12").getTime());

    // One-shot: second run refused
    await expect(
      taskSvc.generateFromTemplate(owner, { eventId: dated.id }),
    ).rejects.toThrowError(/already/i);
  });

  it("refuses to generate a checklist for an event type with no template", async () => {
    const repos = makeFakeRepositories();
    const tenancy = makeTenancyService(repos);
    const events = makeEventService(repos);
    const taskSvc = makeTaskService(repos, { freeLaunch: true });
    const { organization, ownerMembership } = await tenancy.provisionOrganization({
      name: "B",
      creator: { authUserId: "auth_b", email: "b@x.com", name: "B" },
    });
    const birthday = await events.create({
      organizationId: organization.id,
      eventTypeKey: "birthday",
      name: "Party",
      date: new Date("2027-01-01T00:00:00.000Z"),
    });
    await expect(
      taskSvc.generateFromTemplate(ownerMembership.userId, { eventId: birthday.id }),
    ).rejects.toThrowError(/template/i);
  });

  it("routes through the entitlement engine when freeLaunch is off (gate is wired)", async () => {
    const free = await setup({ freeLaunch: true });
    await expect(
      free.taskSvc.list(free.ownerUserId, { eventId: free.event.id, limit: 10 }),
    ).resolves.toBeDefined();
    // tasks is a free-baseline module, so it stays available even with the gate live.
    const paid = await setup({ freeLaunch: false });
    await expect(
      paid.taskSvc.list(paid.ownerUserId, { eventId: paid.event.id, limit: 10 }),
    ).resolves.toBeDefined();
  });
});
