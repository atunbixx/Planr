import { describe, it, expect } from "vitest";
import { makeFakeRepositories } from "../testing/fakes";
import { makeTenancyService } from "../services/tenancy.service";
import { makeEventService } from "../services/event.service";
import { makeWebsiteService } from "../website/website.service";
import { makeRegistryService, makePublicRegistryService } from "./registry.service";

async function setup(opts: { freeLaunch?: boolean } = {}) {
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
    name: "Our Wedding",
    date: null,
  });
  return {
    repos,
    organization,
    event,
    ownerUserId: ownerMembership.userId,
    registry: makeRegistryService(repos, { freeLaunch: opts.freeLaunch ?? true }),
    website: makeWebsiteService(repos, { randomSuffix: () => "x1" }),
    pub: makePublicRegistryService(repos),
  };
}

describe("registry service", () => {
  it("host adds, lists, edits and removes gifts", async () => {
    const { registry, event, ownerUserId } = await setup();
    const item = await registry.create(ownerUserId, {
      eventId: event.id,
      item: { title: "Toaster", url: "https://shop/toaster", price: "49.99" },
    });
    expect(item).toMatchObject({ title: "Toaster", priceCents: 4999 });
    expect(await registry.list(ownerUserId, { eventId: event.id })).toHaveLength(1);
    const updated = await registry.update(ownerUserId, {
      eventId: event.id,
      itemId: item.id,
      patch: { price: "59.99" },
    });
    expect(updated.priceCents).toBe(5999);
    await registry.remove(ownerUserId, { eventId: event.id, itemId: item.id });
    expect(await registry.list(ownerUserId, { eventId: event.id })).toHaveLength(0);
  });

  it("public forSlug returns gifts only for a PUBLISHED site", async () => {
    const { registry, website, pub, event, ownerUserId } = await setup();
    await registry.create(ownerUserId, { eventId: event.id, item: { title: "Kettle" } });
    const site = await website.editor(ownerUserId, { eventId: event.id });
    expect(await pub.forSlug(site.slug)).toEqual([]); // unpublished
    await website.update(ownerUserId, { eventId: event.id, patch: { published: true } });
    const gifts = await pub.forSlug(site.slug);
    expect(gifts).toHaveLength(1);
    expect(Object.keys(gifts[0]!).sort()).toEqual(["id", "note", "priceCents", "title", "url"]);
    expect(await pub.forSlug("nope")).toEqual([]);
  });

  it("forbids a viewer from editing the registry", async () => {
    const { registry, repos, organization, event } = await setup();
    const viewer = await repos.users.upsertByAuthUserId({ authUserId: "auth_v", email: "v@x.com", name: null });
    await repos.memberships.upsert({ organizationId: organization.id, userId: viewer.id, role: "viewer" });
    await expect(
      registry.create(viewer.id, { eventId: event.id, item: { title: "x" } }),
    ).rejects.toThrowError(/forbidden/i);
  });

  it("locks when freeLaunch is off (gift_registry is non-baseline)", async () => {
    const paid = await setup({ freeLaunch: false });
    await expect(paid.registry.list(paid.ownerUserId, { eventId: paid.event.id })).rejects.toThrowError(/locked/i);
  });
});
