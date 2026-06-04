import { describe, it, expect } from "vitest";
import { makeFakeRepositories } from "../testing/fakes";
import { makeTenancyService } from "./tenancy.service";

describe("tenancy service", () => {
  it("provisions an organization with its creator as owner", async () => {
    const repos = makeFakeRepositories();
    const svc = makeTenancyService(repos);
    const { organization, ownerMembership } = await svc.provisionOrganization({
      clerkOrgId: "org_1",
      name: "Smith Wedding",
      creator: { clerkUserId: "user_1", email: "a@b.com", name: "Ada" },
    });
    expect(organization.clerkOrgId).toBe("org_1");
    expect(ownerMembership.role).toBe("owner");
    const members = await repos.memberships.listByOrganization(organization.id);
    expect(members).toHaveLength(1);
  });

  it("is idempotent — re-provisioning the same org keeps one owner membership", async () => {
    const repos = makeFakeRepositories();
    const svc = makeTenancyService(repos);
    const input = {
      clerkOrgId: "org_1",
      name: "Smith Wedding",
      creator: { clerkUserId: "user_1", email: "a@b.com", name: "Ada" },
    };
    const first = await svc.provisionOrganization(input);
    const second = await svc.provisionOrganization(input);
    expect(second.organization.id).toBe(first.organization.id);
    expect(await repos.memberships.listByOrganization(first.organization.id)).toHaveLength(1);
  });

  it("adds a member with the given role", async () => {
    const repos = makeFakeRepositories();
    const svc = makeTenancyService(repos);
    const { organization } = await svc.provisionOrganization({
      clerkOrgId: "org_1",
      name: "Smith Wedding",
      creator: { clerkUserId: "user_1", email: "a@b.com", name: "Ada" },
    });
    const membership = await svc.addMember({
      organizationId: organization.id,
      user: { clerkUserId: "user_2", email: "c@d.com", name: "Bo" },
      role: "planner",
    });
    expect(membership.role).toBe("planner");
    expect(await repos.memberships.listByOrganization(organization.id)).toHaveLength(2);
  });
});
