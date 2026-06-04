import { describe, it, expect } from "vitest";
import { makeFakeRepositories } from "./fakes";

describe("in-memory fake repositories", () => {
  it("upserts an organization by clerkOrgId idempotently", async () => {
    const { orgs } = makeFakeRepositories();
    const a = await orgs.upsertByClerkOrgId({ clerkOrgId: "org_1", name: "Smith Wedding" });
    const b = await orgs.upsertByClerkOrgId({ clerkOrgId: "org_1", name: "Smith Wedding (renamed)" });
    expect(b.id).toBe(a.id);
    expect(b.name).toBe("Smith Wedding (renamed)");
    expect(await orgs.findByClerkOrgId("org_1")).toMatchObject({ id: a.id });
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
