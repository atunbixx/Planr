import { describe, it, expect } from "vitest";
import { makeFakeRepositories } from "../testing/fakes";
import { makeTenancyService } from "../services/tenancy.service";
import { makeEventService } from "../services/event.service";
import { makeGuestService } from "../guests/guest.service";
import { makeWebsiteService } from "../website/website.service";
import { makePhotoService, makePublicPhotoService } from "./photo.service";

async function setup() {
  const repos = makeFakeRepositories();
  const tenancy = makeTenancyService(repos);
  const events = makeEventService(repos);
  const guestSvc = makeGuestService(repos);
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
  const guest = await guestSvc.create(ownerMembership.userId, { eventId: event.id, guest: { name: "Aunt Mary" } });
  return {
    repos,
    organization,
    event,
    guest,
    ownerUserId: ownerMembership.userId,
    host: makePhotoService(repos),
    pub: makePublicPhotoService(repos),
    website: makeWebsiteService(repos, { randomSuffix: () => "x1" }),
  };
}

describe("photo service", () => {
  it("a guest adds a photo by token; host can list and remove it", async () => {
    const { host, pub, event, guest, ownerUserId } = await setup();
    const added = await pub.addByToken(guest.rsvpToken, { storagePath: "photos/a.jpg", caption: "Us!" });
    expect(added).toMatchObject({ storagePath: "photos/a.jpg", caption: "Us!" });
    const list = await host.list(ownerUserId, { eventId: event.id });
    expect(list).toHaveLength(1);
    await host.remove(ownerUserId, { eventId: event.id, photoId: list[0]!.id });
    expect(await host.list(ownerUserId, { eventId: event.id })).toHaveLength(0);
  });

  it("rejects an upload from an invalid token", async () => {
    const { pub } = await setup();
    await expect(
      pub.addByToken("nope", { storagePath: "x.jpg", caption: null }),
    ).rejects.toThrowError(/valid/i);
  });

  it("public slideshow lists photos only for a PUBLISHED site (safe fields)", async () => {
    const { pub, website, event, guest, ownerUserId } = await setup();
    await pub.addByToken(guest.rsvpToken, { storagePath: "photos/a.jpg", caption: null });
    const site = await website.editor(ownerUserId, { eventId: event.id });
    expect(await pub.listBySlug(site.slug)).toEqual([]); // unpublished
    await website.update(ownerUserId, { eventId: event.id, patch: { published: true } });
    const photos = await pub.listBySlug(site.slug);
    expect(photos).toHaveLength(1);
    expect(Object.keys(photos[0]!).sort()).toEqual(["caption", "id", "storagePath"]);
  });

  it("forbids a non-member from listing the gallery", async () => {
    const { host, repos, event } = await setup();
    const stranger = await repos.users.upsertByAuthUserId({ authUserId: "auth_s", email: "s@x.com", name: null });
    await expect(host.list(stranger.id, { eventId: event.id })).rejects.toThrowError(/member|forbidden/i);
  });
});
