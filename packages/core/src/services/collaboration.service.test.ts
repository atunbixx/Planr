import { describe, it, expect } from "vitest";
import { makeFakeRepositories } from "../testing/fakes";
import { makeTenancyService } from "./tenancy.service";
import { makeCollaborationService } from "./collaboration.service";

let counter = 0;
const newToken = () => `tok_${++counter}`;

async function setupOwner() {
  const repos = makeFakeRepositories();
  const tenancy = makeTenancyService(repos);
  const { organization, ownerMembership } = await tenancy.provisionOrganization({
    name: "Smith Wedding",
    creator: { authUserId: "auth_owner", email: "owner@x.com", name: "Owner" },
  });
  const collab = makeCollaborationService(repos, { newToken });
  return { repos, organization, ownerUserId: ownerMembership.userId, collab };
}

describe("collaboration service", () => {
  it("an owner invites an email; the invite is pending and normalised", async () => {
    const { collab, organization, ownerUserId } = await setupOwner();
    const inv = await collab.invite({
      organizationId: organization.id,
      inviterUserId: ownerUserId,
      email: "Partner@X.com",
      role: "editor",
    });
    expect(inv.status).toBe("pending");
    expect(inv.email).toBe("partner@x.com");
    expect(inv.token).toBe("tok_1");
  });

  it("rejects an invite from a viewer (no member:invite permission)", async () => {
    const { repos, collab, organization } = await setupOwner();
    const viewer = await repos.users.upsertByAuthUserId({ authUserId: "v", email: "v@x.com", name: null });
    await repos.memberships.upsert({ organizationId: organization.id, userId: viewer.id, role: "viewer" });
    await expect(
      collab.invite({ organizationId: organization.id, inviterUserId: viewer.id, email: "x@y.com", role: "editor" }),
    ).rejects.toThrowError(/forbidden/i);
  });

  it("auto-accepts pending invites for an email, creating a membership", async () => {
    const { repos, collab, organization, ownerUserId } = await setupOwner();
    await collab.invite({
      organizationId: organization.id,
      inviterUserId: ownerUserId,
      email: "partner@x.com",
      role: "editor",
    });
    const partner = await repos.users.upsertByAuthUserId({ authUserId: "auth_p", email: "partner@x.com", name: "P" });
    const accepted = await collab.acceptPendingForEmail(partner.id, "partner@x.com");
    expect(accepted).toBe(1);
    const members = await collab.listMembers(organization.id, ownerUserId);
    expect(members.map((m) => m.userId)).toContain(partner.id);
    expect(members.find((m) => m.userId === partner.id)!.role).toBe("editor");
    expect(await collab.listPendingInvitations(organization.id, ownerUserId)).toHaveLength(0);
  });

  it("accepts by token", async () => {
    const { repos, collab, organization, ownerUserId } = await setupOwner();
    const inv = await collab.invite({
      organizationId: organization.id,
      inviterUserId: ownerUserId,
      email: "friend@x.com",
      role: "planner",
    });
    const friend = await repos.users.upsertByAuthUserId({ authUserId: "auth_f", email: "friend@x.com", name: null });
    const orgId = await collab.acceptByToken(friend.id, inv.token);
    expect(orgId).toBe(organization.id);
    expect(await repos.memberships.find({ organizationId: organization.id, userId: friend.id })).toMatchObject({
      role: "planner",
    });
  });

  it("removes a member but never the last owner", async () => {
    const { repos, collab, organization, ownerUserId } = await setupOwner();
    const partner = await repos.users.upsertByAuthUserId({ authUserId: "auth_p2", email: "p2@x.com", name: null });
    await repos.memberships.upsert({ organizationId: organization.id, userId: partner.id, role: "editor" });
    await collab.removeMember({ organizationId: organization.id, actorUserId: ownerUserId, targetUserId: partner.id });
    expect(await repos.memberships.find({ organizationId: organization.id, userId: partner.id })).toBeNull();
    await expect(
      collab.removeMember({ organizationId: organization.id, actorUserId: ownerUserId, targetUserId: ownerUserId }),
    ).rejects.toThrowError(/last owner/i);
  });
});
