import { describe, it, expect } from "vitest";
import { makeFakeRepositories } from "../testing/fakes";
import { makeOnboardingService } from "./onboarding.service";

const creator = { authUserId: "auth_1", email: "a@b.com", name: "Ada" };

describe("onboarding service", () => {
  it("completeIndividual creates an individual workspace + owner + first event", async () => {
    const repos = makeFakeRepositories();
    const svc = makeOnboardingService(repos);
    const { organization, event } = await svc.completeIndividual({
      creator,
      spaceName: "Ada's Planning",
      firstEvent: { eventTypeKey: "wedding", name: "Our Wedding" },
    });
    expect(organization.type).toBe("individual");
    expect(organization.name).toBe("Ada's Planning");
    expect(event.eventTypeKey).toBe("wedding");
    expect(event.organizationId).toBe(organization.id);
    const members = await repos.memberships.listByOrganization(organization.id);
    expect(members[0]!.role).toBe("owner");
    expect(await repos.events.listByOrganization(organization.id)).toHaveLength(1);
  });

  it("completeBusiness creates a business workspace + owner, no event", async () => {
    const repos = makeFakeRepositories();
    const svc = makeOnboardingService(repos);
    const { organization } = await svc.completeBusiness({ creator, businessName: "Bliss Events" });
    expect(organization.type).toBe("business");
    expect(organization.name).toBe("Bliss Events");
    expect(await repos.events.listByOrganization(organization.id)).toHaveLength(0);
    const members = await repos.memberships.listByOrganization(organization.id);
    expect(members[0]!.role).toBe("owner");
  });
});
