import type { Repositories, EntitlementRecord } from "../ports/repositories";
import { getPlan } from "../billing/plans";

export function makeBillingService(repos: Repositories) {
  return {
    /**
     * Grants every entitlement a plan confers, idempotently. Called from a verified
     * billing webhook (Plan 6) — NOT directly from a user-facing mutation.
     * Event-scoped plans attach to `eventId`; org-scoped plans attach to the org (null eventId).
     */
    async applyPlanPurchase(input: {
      organizationId: string;
      eventId: string | null;
      planKey: string;
      source: string;
    }): Promise<EntitlementRecord[]> {
      const plan = getPlan(input.planKey);
      if (plan.scope === "event" && !input.eventId) {
        throw new Error(`Plan "${plan.key}" is event-scoped and requires an eventId.`);
      }
      const eventId = plan.scope === "organization" ? null : input.eventId;
      const granted: EntitlementRecord[] = [];
      for (const key of plan.grants) {
        granted.push(
          await repos.entitlements.grantIfAbsent({
            organizationId: input.organizationId,
            eventId,
            key,
            source: input.source,
          }),
        );
      }
      return granted;
    },
  };
}

export type BillingService = ReturnType<typeof makeBillingService>;
