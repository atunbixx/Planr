import { describe, it, expect, beforeAll, afterAll } from "vitest";
import {
  makeTenancyService,
  makeEventService,
  makeEntitlementService,
  makeClerkSync,
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
      clerkOrgId: "org_flow",
      name: "Flow Wedding",
      creator: { clerkUserId: "user_owner", email: "owner@x.com", name: "Owner" },
    });
    expect(ownerMembership.role).toBe("owner");

    await tenancy.addMember({
      organizationId: organization.id,
      user: { clerkUserId: "user_planner", email: "planner@x.com", name: "Planner" },
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

  it("syncs a Clerk membership webhook into a queryable membership", async () => {
    const repos = createRepositories(db.prisma);
    const sync = makeClerkSync(repos);
    await sync.organizationUpserted({ clerkOrgId: "org_sync", name: "Sync Co" });
    await sync.membershipUpserted({
      clerkOrgId: "org_sync",
      clerkUserId: "user_sync",
      email: "s@x.com",
      name: "S",
      clerkRole: "org:admin",
    });
    const org = await repos.orgs.findByClerkOrgId("org_sync");
    const members = await repos.memberships.listByOrganization(org!.id);
    expect(members).toHaveLength(1);
    expect(members[0]!.role).toBe("admin");
  });
});
