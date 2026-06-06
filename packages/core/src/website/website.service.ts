import type {
  Repositories,
  EventRecord,
  EventWebsiteRecord,
  EventWebsitePatch,
} from "../ports/repositories";
import { makeAuthorizationService } from "../services/authorization.service";
import { NotFoundError } from "../errors";
import { slugify } from "./slug";

export interface PublicSite {
  website: EventWebsiteRecord;
  event: { name: string; date: Date | null; eventTypeKey: string; currency: string };
}

const SUFFIX = "abcdefghijklmnopqrstuvwxyz0123456789";

/** Host-side website editor — authed; reads/edits require membership / content:edit. */
export function makeWebsiteService(
  repos: Repositories,
  deps: { randomSuffix?: () => string } = {},
) {
  const authz = makeAuthorizationService(repos);
  const randomSuffix =
    deps.randomSuffix ??
    (() =>
      Array.from({ length: 4 }, () => SUFFIX[Math.floor(Math.random() * SUFFIX.length)]).join(""));

  async function uniqueSlug(base: string): Promise<string> {
    let slug = base;
    for (let i = 0; i < 10; i++) {
      if (!(await repos.websites.slugExists(slug))) return slug;
      slug = `${base}-${randomSuffix()}`;
    }
    return `${base}-${randomSuffix()}${randomSuffix()}`;
  }

  async function loadEvent(eventId: string): Promise<EventRecord> {
    const event = await repos.events.getById(eventId);
    if (!event) throw new NotFoundError("Event not found.");
    return event;
  }

  return {
    /** Get the editor view, creating a draft (with a unique slug) on first access. */
    async editor(userId: string, input: { eventId: string }): Promise<EventWebsiteRecord> {
      const event = await loadEvent(input.eventId);
      await authz.requirePermission(userId, event.organizationId, "content:edit");
      const scope = { organizationId: event.organizationId, eventId: event.id };
      const existing = await repos.websites.getByEvent(scope);
      if (existing) return existing;
      const slug = await uniqueSlug(slugify(event.name));
      return repos.websites.create({ ...scope, slug });
    },

    async update(
      userId: string,
      input: { eventId: string; patch: EventWebsitePatch },
    ): Promise<EventWebsiteRecord> {
      const event = await loadEvent(input.eventId);
      await authz.requirePermission(userId, event.organizationId, "content:edit");
      // ensure a row exists
      const scope = { organizationId: event.organizationId, eventId: event.id };
      if (!(await repos.websites.getByEvent(scope))) {
        const slug = await uniqueSlug(slugify(event.name));
        await repos.websites.create({ ...scope, slug });
      }
      const updated = await repos.websites.update({ ...scope, patch: input.patch });
      if (!updated) throw new NotFoundError("Website not found.");
      return updated;
    },
  };
}

export type WebsiteService = ReturnType<typeof makeWebsiteService>;

/** Public, unauthenticated read of a PUBLISHED event site by slug. */
export function makePublicWebsiteService(repos: Repositories) {
  return {
    async getBySlug(slug: string): Promise<PublicSite | null> {
      const website = await repos.websites.getBySlug(slug);
      if (!website || !website.published) return null;
      const event = await repos.events.getById(website.eventId);
      if (!event) return null;
      const org = await repos.orgs.findById(event.organizationId);
      return {
        website,
        event: {
          name: event.name,
          date: event.date,
          eventTypeKey: event.eventTypeKey,
          currency: org?.currency ?? "GBP",
        },
      };
    },
  };
}

export type PublicWebsiteService = ReturnType<typeof makePublicWebsiteService>;
