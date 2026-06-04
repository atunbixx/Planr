import { describe, it, expect } from "vitest";
import { makeFakeRepositories } from "../testing/fakes";
import { makeClerkSync } from "./clerk-sync";

describe("Clerk sync orchestrator", () => {
  it("upserts a user on user.created/updated", async () => {
    const repos = makeFakeRepositories();
    const sync = makeClerkSync(repos);
    await sync.userUpserted({ clerkUserId: "user_1", email: "a@b.com", name: "Ada" });
    expect(await repos.users.findByClerkUserId("user_1")).toMatchObject({ email: "a@b.com" });
  });

  it("upserts an organization on organization.created/updated", async () => {
    const repos = makeFakeRepositories();
    const sync = makeClerkSync(repos);
    await sync.organizationUpserted({ clerkOrgId: "org_1", name: "Smith Wedding" });
    expect(await repos.orgs.findByClerkOrgId("org_1")).toMatchObject({ name: "Smith Wedding" });
  });

  it("creates a membership with the mapped role, resolving org+user", async () => {
    const repos = makeFakeRepositories();
    const sync = makeClerkSync(repos);
    await sync.organizationUpserted({ clerkOrgId: "org_1", name: "Smith Wedding" });
    await sync.membershipUpserted({
      clerkOrgId: "org_1",
      clerkUserId: "user_2",
      email: "c@d.com",
      name: "Bo",
      clerkRole: "org:admin",
    });
    const org = await repos.orgs.findByClerkOrgId("org_1");
    const members = await repos.memberships.listByOrganization(org!.id);
    expect(members).toHaveLength(1);
    expect(members[0]!.role).toBe("admin");
  });

  it("removes a membership on organizationMembership.deleted", async () => {
    const repos = makeFakeRepositories();
    const sync = makeClerkSync(repos);
    await sync.organizationUpserted({ clerkOrgId: "org_1", name: "Smith Wedding" });
    await sync.membershipUpserted({
      clerkOrgId: "org_1",
      clerkUserId: "user_2",
      email: "c@d.com",
      name: "Bo",
      clerkRole: "org:member",
    });
    await sync.membershipDeleted({ clerkOrgId: "org_1", clerkUserId: "user_2" });
    const org = await repos.orgs.findByClerkOrgId("org_1");
    expect(await repos.memberships.listByOrganization(org!.id)).toHaveLength(0);
  });

  it("ignores membership events for an unknown organization without throwing", async () => {
    const repos = makeFakeRepositories();
    const sync = makeClerkSync(repos);
    await expect(
      sync.membershipDeleted({ clerkOrgId: "org_missing", clerkUserId: "user_2" }),
    ).resolves.toBeUndefined();
  });
});
