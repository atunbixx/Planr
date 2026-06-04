import type { Repositories, OrganizationRecord, MembershipRecord } from "../ports/repositories";
import type { Role } from "../types";

interface ClerkUserInput {
  clerkUserId: string;
  email: string;
  name: string | null;
}

export function makeTenancyService(repos: Repositories) {
  return {
    async provisionOrganization(input: {
      clerkOrgId: string;
      name: string;
      creator: ClerkUserInput;
    }): Promise<{ organization: OrganizationRecord; ownerMembership: MembershipRecord }> {
      const organization = await repos.orgs.upsertByClerkOrgId({
        clerkOrgId: input.clerkOrgId,
        name: input.name,
      });
      const owner = await repos.users.upsertByClerkUserId(input.creator);
      const ownerMembership = await repos.memberships.upsert({
        organizationId: organization.id,
        userId: owner.id,
        role: "owner",
      });
      return { organization, ownerMembership };
    },

    async addMember(input: {
      organizationId: string;
      user: ClerkUserInput;
      role: Role;
    }): Promise<MembershipRecord> {
      const user = await repos.users.upsertByClerkUserId(input.user);
      return repos.memberships.upsert({
        organizationId: input.organizationId,
        userId: user.id,
        role: input.role,
      });
    },
  };
}

export type TenancyService = ReturnType<typeof makeTenancyService>;
