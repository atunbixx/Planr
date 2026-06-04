import type { Repositories, OrganizationRecord, MembershipRecord } from "../ports/repositories";
import type { Role } from "../types";

export interface AuthUserInput {
  authUserId: string;
  email: string;
  name: string | null;
}

export function makeTenancyService(repos: Repositories) {
  return {
    async provisionOrganization(input: {
      name: string;
      creator: AuthUserInput;
    }): Promise<{ organization: OrganizationRecord; ownerMembership: MembershipRecord }> {
      const organization = await repos.orgs.create({ name: input.name });
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
  };
}

export type TenancyService = ReturnType<typeof makeTenancyService>;
