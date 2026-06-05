import { randomUUID } from "node:crypto";
import type { Repositories, InvitationRecord, MemberView } from "../ports/repositories";
import type { Role } from "../types";
import { makeAuthorizationService } from "./authorization.service";

export type InviteRole = "admin" | "planner" | "editor" | "viewer";

interface CollaborationDeps {
  newToken?: () => string;
}

export function makeCollaborationService(repos: Repositories, deps: CollaborationDeps = {}) {
  const authz = makeAuthorizationService(repos);
  const newToken = deps.newToken ?? (() => randomUUID().replace(/-/g, ""));
  const norm = (email: string) => email.trim().toLowerCase();

  async function assertNotLastOwner(organizationId: string, targetUserId: string): Promise<void> {
    const members = await repos.memberships.listMembersWithUsers(organizationId);
    const owners = members.filter((m) => m.role === "owner");
    if (owners.length === 1 && owners[0]!.userId === targetUserId) {
      throw new Error("Cannot remove or demote the last owner of a workspace.");
    }
  }

  async function membershipFromInvite(userId: string, invite: InvitationRecord): Promise<void> {
    await repos.memberships.upsert({
      organizationId: invite.organizationId,
      userId,
      role: invite.role,
    });
    await repos.invitations.setStatus({ id: invite.id, status: "accepted" });
  }

  return {
    async invite(input: {
      organizationId: string;
      inviterUserId: string;
      email: string;
      role: InviteRole;
    }): Promise<InvitationRecord> {
      await authz.requirePermission(input.inviterUserId, input.organizationId, "member:invite");
      const email = norm(input.email);
      const existing = await repos.invitations.findPending({
        organizationId: input.organizationId,
        email,
      });
      if (existing) return existing;
      return repos.invitations.create({
        organizationId: input.organizationId,
        email,
        role: input.role,
        token: newToken(),
        invitedByUserId: input.inviterUserId,
      });
    },

    async acceptPendingForEmail(userId: string, email: string): Promise<number> {
      const pending = await repos.invitations.listPendingByEmail(norm(email));
      for (const invite of pending) {
        await membershipFromInvite(userId, invite);
      }
      return pending.length;
    },

    async acceptByToken(userId: string, token: string): Promise<string> {
      const invite = await repos.invitations.findByToken(token);
      if (!invite || invite.status !== "pending") {
        throw new Error("This invitation is no longer valid.");
      }
      await membershipFromInvite(userId, invite);
      return invite.organizationId;
    },

    async listMembers(organizationId: string, actorUserId: string): Promise<MemberView[]> {
      await authz.requireMembership(actorUserId, organizationId);
      return repos.memberships.listMembersWithUsers(organizationId);
    },

    async listPendingInvitations(
      organizationId: string,
      actorUserId: string,
    ): Promise<InvitationRecord[]> {
      await authz.requireMembership(actorUserId, organizationId);
      return repos.invitations.listPendingByOrganization(organizationId);
    },

    async removeMember(input: {
      organizationId: string;
      actorUserId: string;
      targetUserId: string;
    }): Promise<void> {
      await authz.requirePermission(input.actorUserId, input.organizationId, "member:remove");
      await assertNotLastOwner(input.organizationId, input.targetUserId);
      await repos.memberships.remove({
        organizationId: input.organizationId,
        userId: input.targetUserId,
      });
    },

    async setMemberRole(input: {
      organizationId: string;
      actorUserId: string;
      targetUserId: string;
      role: Role;
    }): Promise<void> {
      await authz.requirePermission(input.actorUserId, input.organizationId, "member:remove");
      if (input.role !== "owner") {
        await assertNotLastOwner(input.organizationId, input.targetUserId);
      }
      await repos.memberships.upsert({
        organizationId: input.organizationId,
        userId: input.targetUserId,
        role: input.role,
      });
    },

    async revokeInvitation(input: {
      organizationId: string;
      actorUserId: string;
      invitationId: string;
    }): Promise<void> {
      await authz.requirePermission(input.actorUserId, input.organizationId, "member:remove");
      await repos.invitations.setStatus({ id: input.invitationId, status: "revoked" });
    },
  };
}

export type CollaborationService = ReturnType<typeof makeCollaborationService>;
