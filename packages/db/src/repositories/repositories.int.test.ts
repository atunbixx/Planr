import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { startTestDb, type TestDb } from "../testing/test-db";
import { createRepositories } from "./index";

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
  it("upserts organizations idempotently by clerkOrgId", async () => {
    const a = await repos.orgs.upsertByClerkOrgId({ clerkOrgId: "org_1", name: "Smith" });
    const b = await repos.orgs.upsertByClerkOrgId({ clerkOrgId: "org_1", name: "Smith 2" });
    expect(b.id).toBe(a.id);
    expect(b.name).toBe("Smith 2");
  });

  it("enforces one membership per (org,user) and lists by org", async () => {
    const org = await repos.orgs.upsertByClerkOrgId({ clerkOrgId: "org_2", name: "Jones" });
    const user = await repos.users.upsertByClerkUserId({
      clerkUserId: "user_1",
      email: "a@b.com",
      name: "Ada",
    });
    await repos.memberships.upsert({ organizationId: org.id, userId: user.id, role: "viewer" });
    await repos.memberships.upsert({ organizationId: org.id, userId: user.id, role: "admin" });
    const list = await repos.memberships.listByOrganization(org.id);
    expect(list).toHaveLength(1);
    expect(list[0]!.role).toBe("admin");
  });

  it("creates events scoped to an organization and finds by id", async () => {
    const org = await repos.orgs.upsertByClerkOrgId({ clerkOrgId: "org_3", name: "Lee" });
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
    const org = await repos.orgs.upsertByClerkOrgId({ clerkOrgId: "org_4", name: "Kim" });
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
    const org = await repos.orgs.upsertByClerkOrgId({ clerkOrgId: "org_6", name: "Ng" });
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
    // querying with a different event must NOT leak the event-level grant
    const heldOther = await repos.entitlements.heldFor({
      organizationId: org.id,
      eventId: "some_other_event",
    });
    expect([...heldOther].sort()).toEqual(["all_access"]);
    // querying with null event must also return only org-level
    const heldNull = await repos.entitlements.heldFor({ organizationId: org.id, eventId: null });
    expect([...heldNull].sort()).toEqual(["all_access"]);
  });

  it("partial unique index blocks duplicate org-level grants", async () => {
    const org = await repos.orgs.upsertByClerkOrgId({ clerkOrgId: "org_5", name: "Park" });
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
});
