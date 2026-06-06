import { describe, it, expect } from "vitest";
import { makeFakeRepositories } from "../testing/fakes";
import { makeAuthorizationService } from "./authorization.service";

async function seedMember(role: "owner" | "admin" | "planner" | "editor" | "viewer") {
  const repos = makeFakeRepositories();
  const org = await repos.orgs.create({ name: "Org" });
  const user = await repos.users.upsertByAuthUserId({ authUserId: "a1", email: "a@b.com", name: null });
  await repos.memberships.upsert({ organizationId: org.id, userId: user.id, role });
  return { repos, org, user, authz: makeAuthorizationService(repos) };
}

describe("authorization service", () => {
  it("requireMembership returns the member's role", async () => {
    const { authz, org, user } = await seedMember("planner");
    expect(await authz.requireMembership(user.id, org.id)).toBe("planner");
  });

  it("requireMembership throws for a non-member", async () => {
    const { authz, org } = await seedMember("owner");
    await expect(authz.requireMembership("ghost", org.id)).rejects.toThrowError(/not a member/i);
  });

  it("requirePermission allows a planner to create events", async () => {
    const { authz, org, user } = await seedMember("planner");
    await expect(authz.requirePermission(user.id, org.id, "event:create")).resolves.toBe("planner");
  });

  it("requirePermission denies a viewer from creating events", async () => {
    const { authz, org, user } = await seedMember("viewer");
    await expect(
      authz.requirePermission(user.id, org.id, "event:create"),
    ).rejects.toThrowError(/forbidden/i);
  });
});
