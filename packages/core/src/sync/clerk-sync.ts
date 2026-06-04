import type { Repositories } from "../ports/repositories";
import { mapClerkRole } from "./clerk-role";

export function makeClerkSync(repos: Repositories) {
  return {
    async userUpserted(evt: { clerkUserId: string; email: string; name: string | null }) {
      await repos.users.upsertByClerkUserId(evt);
    },

    async organizationUpserted(evt: { clerkOrgId: string; name: string }) {
      await repos.orgs.upsertByClerkOrgId(evt);
    },

    async membershipUpserted(evt: {
      clerkOrgId: string;
      clerkUserId: string;
      email: string;
      name: string | null;
      clerkRole: string;
    }) {
      const org = await repos.orgs.findByClerkOrgId(evt.clerkOrgId);
      if (!org) return; // org webhook not yet processed; Clerk will retry/order
      const user = await repos.users.upsertByClerkUserId({
        clerkUserId: evt.clerkUserId,
        email: evt.email,
        name: evt.name,
      });
      await repos.memberships.upsert({
        organizationId: org.id,
        userId: user.id,
        role: mapClerkRole(evt.clerkRole),
      });
    },

    async membershipDeleted(evt: { clerkOrgId: string; clerkUserId: string }) {
      const org = await repos.orgs.findByClerkOrgId(evt.clerkOrgId);
      if (!org) return;
      const user = await repos.users.findByClerkUserId(evt.clerkUserId);
      if (!user) return;
      await repos.memberships.remove({ organizationId: org.id, userId: user.id });
    },
  };
}

export type ClerkSync = ReturnType<typeof makeClerkSync>;
