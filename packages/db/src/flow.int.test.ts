import { describe, it, expect, beforeAll, afterAll } from "vitest";
import {
  makeTenancyService,
  makeEventService,
  makeEntitlementService,
  syncAuthUser,
} from "@planr/core";
import { startTestDb, type TestDb } from "./testing/test-db";
import { createRepositories } from "./repositories/index";

let db: TestDb;

beforeAll(async () => {
  db = await startTestDb();
});
afterAll(async () => {
  await db?.stop();
});

describe("end-to-end tenancy flow (services over Prisma adapters)", () => {
  it("provisions an org, adds a member, creates an event, and gates modules by entitlement", async () => {
    const repos = createRepositories(db.prisma);
    const tenancy = makeTenancyService(repos);
    const events = makeEventService(repos);
    const ents = makeEntitlementService(repos);

    const { organization, ownerMembership } = await tenancy.provisionOrganization({
      name: "Flow Wedding",
      creator: { authUserId: "auth_owner", email: "owner@x.com", name: "Owner" },
    });
    expect(ownerMembership.role).toBe("owner");

    await tenancy.addMember({
      organizationId: organization.id,
      user: { authUserId: "auth_planner", email: "planner@x.com", name: "Planner" },
      role: "planner",
    });
    expect(await repos.memberships.listByOrganization(organization.id)).toHaveLength(2);

    const event = await events.create({
      organizationId: organization.id,
      eventTypeKey: "wedding",
      name: "Flow Wedding Day",
      date: null,
    });

    const before = await events.resolveModules({
      organizationId: organization.id,
      eventId: event.id,
    });
    expect(before.find((m) => m.module === "seating")).toMatchObject({ locked: true });

    await ents.grant({
      organizationId: organization.id,
      eventId: event.id,
      key: "event_type:wedding",
      source: "purchase:flow",
    });

    const after = await events.resolveModules({
      organizationId: organization.id,
      eventId: event.id,
    });
    expect(after.find((m) => m.module === "seating")).toMatchObject({ locked: false });
  });

  it("syncs a signed-in auth user into a queryable User row", async () => {
    const repos = createRepositories(db.prisma);
    const user = await syncAuthUser(repos, { authUserId: "auth_sync", email: "s@x.com", name: "S" });
    expect(await repos.users.findByAuthUserId("auth_sync")).toMatchObject({ id: user.id });
  });
});
