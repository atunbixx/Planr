import { describe, it, expect } from "vitest";
import { makeFakeRepositories } from "../testing/fakes";
import { makeTenancyService } from "../services/tenancy.service";
import { makeEventService } from "../services/event.service";
import { makeWebsiteService, makePublicWebsiteService } from "./website.service";

async function setup() {
  const repos = makeFakeRepositories();
  const tenancy = makeTenancyService(repos);
  const events = makeEventService(repos);
  const { organization, ownerMembership } = await tenancy.provisionOrganization({
    name: "Smith Wedding",
    creator: { authUserId: "auth_o", email: "o@x.com", name: "O" },
  });
  const event = await events.create({
    organizationId: organization.id,
    eventTypeKey: "wedding",
    name: "Sophie & James",
    date: new Date("2027-06-12T00:00:00.000Z"),
  });
  return {
    repos,
    organization,
    event,
    ownerUserId: ownerMembership.userId,
    host: makeWebsiteService(repos, { randomSuffix: () => "x1" }),
    pub: makePublicWebsiteService(repos),
  };
}

describe("website service", () => {
  it("creates a draft with a slug on first editor access, then edits + publishes", async () => {
    const { host, ownerUserId, event } = await setup();
    const draft = await host.editor(ownerUserId, { eventId: event.id });
    expect(draft.slug).toBe("sophie-james");
    expect(draft.published).toBe(false);
    // idempotent: second access returns the same row
    const again = await host.editor(ownerUserId, { eventId: event.id });
    expect(again.id).toBe(draft.id);

    const updated = await host.update(ownerUserId, {
      eventId: event.id,
      patch: { headline: "We're getting married!", story: "How we met…", published: true, theme: "modern" },
    });
    expect(updated).toMatchObject({ headline: "We're getting married!", published: true, theme: "modern" });
  });

  it("public getBySlug returns only PUBLISHED sites", async () => {
    const { host, pub, ownerUserId, event } = await setup();
    const draft = await host.editor(ownerUserId, { eventId: event.id });
    // unpublished → not found
    expect(await pub.getBySlug(draft.slug)).toBeNull();
    await host.update(ownerUserId, { eventId: event.id, patch: { published: true } });
    const site = await pub.getBySlug(draft.slug);
    expect(site).not.toBeNull();
    expect(site!.event.name).toBe("Sophie & James");
    expect(site!.event.date).not.toBeNull();
    expect(await pub.getBySlug("nope")).toBeNull();
  });

  it("forbids a viewer from editing the website", async () => {
    const { host, repos, organization, event } = await setup();
    const viewer = await repos.users.upsertByAuthUserId({ authUserId: "auth_v", email: "v@x.com", name: null });
    await repos.memberships.upsert({ organizationId: organization.id, userId: viewer.id, role: "viewer" });
    await expect(host.editor(viewer.id, { eventId: event.id })).rejects.toThrowError(/forbidden/i);
  });

  it("generates distinct slugs when the base is taken", async () => {
    const { host, repos, organization, ownerUserId, event } = await setup();
    await host.editor(ownerUserId, { eventId: event.id }); // takes "sophie-james"
    const event2 = await makeEventService(repos).create({
      organizationId: organization.id,
      eventTypeKey: "wedding",
      name: "Sophie & James",
      date: null,
    });
    void event;
    const second = await host.editor(ownerUserId, { eventId: event2.id });
    expect(second.slug).toBe("sophie-james-x1");
  });
});
