import type { Repositories, PhotoRecord, EventRecord } from "../ports/repositories";
import { makeAuthorizationService } from "../services/authorization.service";
import { NotFoundError } from "../errors";

export interface PublicPhoto {
  id: string;
  storagePath: string;
  caption: string | null;
}

/** Host-side photo gallery management — authed. */
export function makePhotoService(repos: Repositories) {
  const authz = makeAuthorizationService(repos);

  async function loadEvent(eventId: string): Promise<EventRecord> {
    const event = await repos.events.getById(eventId);
    if (!event) throw new NotFoundError("Event not found.");
    return event;
  }

  return {
    async list(userId: string, input: { eventId: string }): Promise<PhotoRecord[]> {
      const event = await loadEvent(input.eventId);
      await authz.requireMembership(userId, event.organizationId);
      return repos.photos.listByEvent({ organizationId: event.organizationId, eventId: event.id });
    },
    async remove(userId: string, input: { eventId: string; photoId: string }): Promise<void> {
      const event = await loadEvent(input.eventId);
      await authz.requirePermission(userId, event.organizationId, "content:edit");
      const ok = await repos.photos.remove({
        organizationId: event.organizationId,
        eventId: event.id,
        id: input.photoId,
      });
      if (!ok) throw new NotFoundError("Photo not found.");
    },
  };
}

export type PhotoService = ReturnType<typeof makePhotoService>;

/**
 * Public, unauthenticated photos. Guests add via their RSVP token; the slideshow reads a published
 * event site by slug. The web layer handles the actual file upload to storage; here we only record /
 * read the storage path + caption (no leakage of org/guest data).
 */
export function makePublicPhotoService(repos: Repositories) {
  return {
    async addByToken(
      token: string,
      input: { storagePath: string; caption: string | null },
    ): Promise<PublicPhoto> {
      const guest = await repos.guests.findByRsvpToken(token);
      if (!guest) throw new NotFoundError("This link isn't valid.");
      const photo = await repos.photos.create({
        organizationId: guest.organizationId,
        eventId: guest.eventId,
        storagePath: input.storagePath,
        caption: input.caption,
      });
      return { id: photo.id, storagePath: photo.storagePath, caption: photo.caption };
    },

    async listBySlug(slug: string): Promise<PublicPhoto[]> {
      const website = await repos.websites.getBySlug(slug);
      if (!website || !website.published) return [];
      const photos = await repos.photos.listByEvent({
        organizationId: website.organizationId,
        eventId: website.eventId,
      });
      return photos.map((p) => ({ id: p.id, storagePath: p.storagePath, caption: p.caption }));
    },

    async countByToken(token: string): Promise<number> {
      const guest = await repos.guests.findByRsvpToken(token);
      if (!guest) return 0;
      const photos = await repos.photos.listByEvent({
        organizationId: guest.organizationId,
        eventId: guest.eventId,
      });
      return photos.length;
    },
  };
}

export type PublicPhotoService = ReturnType<typeof makePublicPhotoService>;
