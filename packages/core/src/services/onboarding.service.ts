import type { Repositories, OrganizationRecord, EventRecord } from "../ports/repositories";
import type { EventTypeKey } from "../types";
import { makeTenancyService, type AuthUserInput } from "./tenancy.service";
import { makeEventService } from "./event.service";

export function makeOnboardingService(repos: Repositories) {
  const tenancy = makeTenancyService(repos);
  const events = makeEventService(repos);

  return {
    async completeIndividual(input: {
      creator: AuthUserInput;
      spaceName: string;
      firstEvent: { eventTypeKey: EventTypeKey; name: string; date?: Date | null };
    }): Promise<{ organization: OrganizationRecord; event: EventRecord }> {
      const { organization } = await tenancy.provisionOrganization({
        name: input.spaceName,
        type: "individual",
        creator: input.creator,
      });
      const event = await events.create({
        organizationId: organization.id,
        eventTypeKey: input.firstEvent.eventTypeKey,
        name: input.firstEvent.name,
        date: input.firstEvent.date ?? null,
      });
      return { organization, event };
    },

    async completeBusiness(input: {
      creator: AuthUserInput;
      businessName: string;
    }): Promise<{ organization: OrganizationRecord }> {
      const { organization } = await tenancy.provisionOrganization({
        name: input.businessName,
        type: "business",
        creator: input.creator,
      });
      return { organization };
    },
  };
}

export type OnboardingService = ReturnType<typeof makeOnboardingService>;
