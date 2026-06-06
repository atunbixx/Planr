import { describe, it, expect } from "vitest";
import { makeFakeRepositories } from "./fakes";

describe("in-memory fake repositories", () => {
  it("creates organizations and lists them for a member", async () => {
    const { orgs, users, memberships } = makeFakeRepositories();
    const org = await orgs.create({ name: "Smith Wedding" });
    const user = await users.upsertByAuthUserId({ authUserId: "auth_1", email: "a@b.com", name: "Ada" });
    await memberships.upsert({ organizationId: org.id, userId: user.id, role: "owner" });
    expect(await orgs.findById(org.id)).toMatchObject({ name: "Smith Wedding" });
    expect(await orgs.listForUser(user.id)).toHaveLength(1);
  });

  it("enforces one membership per (org,user) on upsert", async () => {
    const { memberships } = makeFakeRepositories();
    await memberships.upsert({ organizationId: "o1", userId: "u1", role: "viewer" });
    await memberships.upsert({ organizationId: "o1", userId: "u1", role: "admin" });
    const list = await memberships.listByOrganization("o1");
    expect(list).toHaveLength(1);
    expect(list[0]!.role).toBe("admin");
  });

  it("returns org-level and matching event-level entitlements from heldFor", async () => {
    const { entitlements } = makeFakeRepositories();
    await entitlements.grant({ organizationId: "o1", eventId: null, key: "all_access", source: "plan:agency" });
    await entitlements.grant({ organizationId: "o1", eventId: "e1", key: "event_type:wedding", source: "purchase:1" });
    await entitlements.grant({ organizationId: "o1", eventId: "e2", key: "module:vendor_matching", source: "purchase:2" });
    const held = await entitlements.heldFor({ organizationId: "o1", eventId: "e1" });
    expect(held.sort()).toEqual(["all_access", "event_type:wedding"]);
  });
});
