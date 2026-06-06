import { describe, it, expect } from "vitest";
import { makeFakeRepositories } from "../testing/fakes";
import { makeTenancyService } from "./tenancy.service";
import { makeEventService } from "./event.service";

async function setup() {
  const repos = makeFakeRepositories();
  const tenancy = makeTenancyService(repos);
  const events = makeEventService(repos);
  const { organization, ownerMembership } = await tenancy.provisionOrganization({
    name: "Smith Wedding",
    creator: { authUserId: "auth_owner", email: "owner@x.com", name: "Owner" },
  });
  const ownerUserId = ownerMembership.userId;
  // an admin and a viewer
  const adminM = await tenancy.addMember({
    organizationId: organization.id,
    user: { authUserId: "auth_admin", email: "admin@x.com", name: "Adm" },
    role: "admin",
  });
  const viewerM = await tenancy.addMember({
    organizationId: organization.id,
    user: { authUserId: "auth_viewer", email: "viewer@x.com", name: "Vee" },
    role: "viewer",
  });
  return { repos, tenancy, events, organization, ownerUserId, adminUserId: adminM.userId, viewerUserId: viewerM.userId };
}

describe("tenancy admin", () => {
  it("workspaceSettings returns composed data for owner/admin, forbidden for a viewer", async () => {
    const { tenancy, organization, ownerUserId, adminUserId, viewerUserId } = await setup();
    const s = await tenancy.workspaceSettings(ownerUserId, { organizationId: organization.id });
    expect(s.organization).toMatchObject({ id: organization.id, name: "Smith Wedding" });
    expect(s.members.map((m) => m.role).sort()).toEqual(["admin", "owner", "viewer"]);
    await expect(
      tenancy.workspaceSettings(adminUserId, { organizationId: organization.id }),
    ).resolves.toBeDefined();
    await expect(
      tenancy.workspaceSettings(viewerUserId, { organizationId: organization.id }),
    ).rejects.toThrowError(/forbidden/i);
  });

  it("renames the workspace (owner/admin), validates the name, forbids a viewer", async () => {
    const { tenancy, organization, ownerUserId, adminUserId, viewerUserId } = await setup();
    const renamed = await tenancy.renameOrganization(adminUserId, {
      organizationId: organization.id,
      name: "  Jones Wedding  ",
    });
    expect(renamed.name).toBe("Jones Wedding"); // trimmed
    await expect(
      tenancy.renameOrganization(ownerUserId, { organizationId: organization.id, name: "" }),
    ).rejects.toThrowError(/1.?80/);
    await expect(
      tenancy.renameOrganization(viewerUserId, { organizationId: organization.id, name: "x" }),
    ).rejects.toThrowError(/forbidden/i);
  });

  it("deletes the workspace for the OWNER only (admin is forbidden)", async () => {
    const { repos, tenancy, events, organization, ownerUserId, adminUserId } = await setup();
    await events.create({
      organizationId: organization.id,
      eventTypeKey: "wedding",
      name: "Day",
      date: null,
    });
    // admin has every permission EXCEPT org:delete
    await expect(
      tenancy.deleteOrganization(adminUserId, { organizationId: organization.id }),
    ).rejects.toThrowError(/forbidden/i);

    await tenancy.deleteOrganization(ownerUserId, { organizationId: organization.id });
    expect(await repos.orgs.findById(organization.id)).toBeNull();
    expect(await repos.memberships.listMembersWithUsers(organization.id)).toHaveLength(0);
    expect(await repos.events.listByOrganization(organization.id)).toHaveLength(0);
  });
});
