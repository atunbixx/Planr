import { describe, it, expect } from "vitest";
import { makeFakeRepositories } from "../testing/fakes";
import { makeTenancyService } from "./tenancy.service";

describe("tenancy service", () => {
  it("provisions an organization with its creator as owner", async () => {
    const repos = makeFakeRepositories();
    const svc = makeTenancyService(repos);
    const { organization, ownerMembership } = await svc.provisionOrganization({
      name: "Smith Wedding",
      creator: { authUserId: "auth_1", email: "a@b.com", name: "Ada" },
    });
    expect(organization.name).toBe("Smith Wedding");
    expect(ownerMembership.role).toBe("owner");
    const members = await repos.memberships.listByOrganization(organization.id);
    expect(members).toHaveLength(1);
  });

  it("creates a distinct organization on each provision call", async () => {
    const repos = makeFakeRepositories();
    const svc = makeTenancyService(repos);
    const input = {
      name: "Smith Wedding",
      creator: { authUserId: "auth_1", email: "a@b.com", name: "Ada" },
    };
    const first = await svc.provisionOrganization(input);
    const second = await svc.provisionOrganization(input);
    expect(second.organization.id).not.toBe(first.organization.id);
    // the creator is reused (upsert by authUserId), so they own both orgs
    expect(await repos.orgs.listForUser(first.ownerMembership.userId)).toHaveLength(2);
  });

  it("adds a member with the given role", async () => {
    const repos = makeFakeRepositories();
    const svc = makeTenancyService(repos);
    const { organization } = await svc.provisionOrganization({
      name: "Smith Wedding",
      creator: { authUserId: "auth_1", email: "a@b.com", name: "Ada" },
    });
    const membership = await svc.addMember({
      organizationId: organization.id,
      user: { authUserId: "auth_2", email: "c@d.com", name: "Bo" },
      role: "planner",
    });
    expect(membership.role).toBe("planner");
    expect(await repos.memberships.listByOrganization(organization.id)).toHaveLength(2);
  });
});
