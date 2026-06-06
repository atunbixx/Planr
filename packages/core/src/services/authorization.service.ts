import type { Repositories } from "../ports/repositories";
import type { Role, Permission } from "../types";
import { roleHasPermission } from "../rbac/policy";
import { ForbiddenError } from "../errors";

export function makeAuthorizationService(repos: Repositories) {
  return {
    async requireMembership(userId: string, organizationId: string): Promise<Role> {
      const membership = await repos.memberships.find({ organizationId, userId });
      if (!membership) {
        throw new ForbiddenError(`User is not a member of organization "${organizationId}".`);
      }
      return membership.role;
    },

    async requirePermission(
      userId: string,
      organizationId: string,
      permission: Permission,
    ): Promise<Role> {
      const role = await this.requireMembership(userId, organizationId);
      if (!roleHasPermission(role, permission)) {
        throw new ForbiddenError(`Forbidden: role "${role}" lacks permission "${permission}".`);
      }
      return role;
    },
  };
}

export type AuthorizationService = ReturnType<typeof makeAuthorizationService>;
