import type { Repositories, EntitlementRecord } from "../ports/repositories";
import type { Entitlement } from "../types";

export function makeEntitlementService(repos: Repositories) {
  return {
    async grant(input: {
      organizationId: string;
      eventId: string | null;
      key: Entitlement;
      source: string;
    }): Promise<EntitlementRecord> {
      return repos.entitlements.grant(input);
    },
  };
}

export type EntitlementService = ReturnType<typeof makeEntitlementService>;
