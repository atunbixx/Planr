import type {
  Repositories,
  OrganizationRecord,
  MembershipRecord,
  MemberView,
  InvitationRecord,
} from "../ports/repositories";
import type { Role, OrgType } from "../types";
import { makeAuthorizationService } from "./authorization.service";
import { isSupportedCurrency } from "../billing/currencies";
import { NotFoundError } from "../errors";

export interface AuthUserInput {
  authUserId: string;
  email: string | null;
  name: string | null;
}

export interface WorkspaceSettings {
  organization: OrganizationRecord;
  members: MemberView[];
  pendingInvitations: InvitationRecord[];
}

export function makeTenancyService(repos: Repositories) {
  const authz = makeAuthorizationService(repos);
  return {
    async provisionOrganization(input: {
      name: string;
      type?: OrgType;
      creator: AuthUserInput;
    }): Promise<{ organization: OrganizationRecord; ownerMembership: MembershipRecord }> {
      const organization = await repos.orgs.create({ name: input.name, type: input.type });
      const owner = await repos.users.upsertByAuthUserId(input.creator);
      const ownerMembership = await repos.memberships.upsert({
        organizationId: organization.id,
        userId: owner.id,
        role: "owner",
      });
      return { organization, ownerMembership };
    },

    async addMember(input: {
      organizationId: string;
      user: AuthUserInput;
      role: Role;
    }): Promise<MembershipRecord> {
      const user = await repos.users.upsertByAuthUserId(input.user);
      return repos.memberships.upsert({
        organizationId: input.organizationId,
        userId: user.id,
        role: input.role,
      });
    },

    /** Owner/admin console data — gated on member:invite (so viewers/editors can't open it). */
    async workspaceSettings(
      userId: string,
      input: { organizationId: string },
    ): Promise<WorkspaceSettings> {
      await authz.requirePermission(userId, input.organizationId, "member:invite");
      const [organization, members, pendingInvitations] = await Promise.all([
        repos.orgs.findById(input.organizationId),
        repos.memberships.listMembersWithUsers(input.organizationId),
        repos.invitations.listPendingByOrganization(input.organizationId),
      ]);
      if (!organization) throw new NotFoundError("Workspace not found.");
      return { organization, members, pendingInvitations };
    },

    async renameOrganization(
      userId: string,
      input: { organizationId: string; name: string },
    ): Promise<OrganizationRecord> {
      await authz.requirePermission(userId, input.organizationId, "member:invite");
      const name = input.name.trim();
      if (name.length < 1 || name.length > 80) {
        throw new Error("Workspace name must be 1–80 characters.");
      }
      return repos.orgs.rename({ id: input.organizationId, name });
    },

    async deleteOrganization(
      userId: string,
      input: { organizationId: string },
    ): Promise<void> {
      // Destructive — owner only (org:delete).
      await authz.requirePermission(userId, input.organizationId, "org:delete");
      await repos.orgs.delete(input.organizationId);
    },

    async setWorkspaceCurrency(
      userId: string,
      input: { organizationId: string; currency: string },
    ): Promise<OrganizationRecord> {
      await authz.requirePermission(userId, input.organizationId, "member:invite");
      if (!isSupportedCurrency(input.currency)) {
        throw new Error(`Unsupported currency "${input.currency}".`);
      }
      return repos.orgs.setCurrency({ id: input.organizationId, currency: input.currency });
    },
  };
}

export type TenancyService = ReturnType<typeof makeTenancyService>;
