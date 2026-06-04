import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { startTestDb, type TestDb } from "@planr/db/src/testing/test-db";
import { createRepositories, type Repositories } from "@planr/db";
import {
  makeTenancyService,
  makeEventService,
  makeEntitlementService,
  makeAuthorizationService,
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

  it("blocks non-members from listing another org's events", async () => {
    const a = await syncAuthUser(repos, { authUserId: "auth_m1", email: "m1@x.com", name: null });
    const stranger = await syncAuthUser(repos, { authUserId: "auth_m2", email: "m2@x.com", name: null });
    const org = await appRouter.createCaller(ctxFor(a)).organizations.create({ name: "Private" });
    await expect(
      appRouter.createCaller(ctxFor(stranger)).events.list({ organizationId: org.id }),
    ).rejects.toThrowError(/not a member/i);
  });
});
