import type { Repositories, EventRecord, AnnouncementRecord } from "../ports/repositories";
import { makeAuthorizationService } from "../services/authorization.service";
import { resolveModuleAccess } from "../entitlements/resolver";
import { NotFoundError, ForbiddenError } from "../errors";
import {
  announcementInput,
  toAnnouncementWrite,
  toAnnouncementPatch,
  type AnnouncementInput,
} from "./messaging.dto";
import { FREE_LAUNCH } from "../billing/launch";

/** Host-side announcements — authed, gated on the "messaging" module. */
export function makeMessagingService(repos: Repositories, opts: { freeLaunch?: boolean } = {}) {
  const authz = makeAuthorizationService(repos);
  const freeLaunch = opts.freeLaunch ?? FREE_LAUNCH;

  async function assertModuleAvailable(event: EventRecord): Promise<void> {
    if (freeLaunch) return;
    const held = await repos.entitlements.heldFor({
      organizationId: event.organizationId,
      eventId: event.id,
    });
    const access = resolveModuleAccess({ module: "messaging", eventType: event.eventTypeKey, held });
    if (access.locked) throw new ForbiddenError(`The messaging module is locked (${access.reason}).`);
  }

  async function gateRead(userId: string, eventId: string): Promise<EventRecord> {
    const event = await repos.events.getById(eventId);
    if (!event) throw new NotFoundError("Event not found.");
    await authz.requireMembership(userId, event.organizationId);
    await assertModuleAvailable(event);
    return event;
  }
  async function gateWrite(userId: string, eventId: string): Promise<EventRecord> {
    const event = await repos.events.getById(eventId);
    if (!event) throw new NotFoundError("Event not found.");
    await authz.requirePermission(userId, event.organizationId, "content:edit");
    await assertModuleAvailable(event);
    return event;
  }

  return {
    async list(userId: string, input: { eventId: string }): Promise<AnnouncementRecord[]> {
      const event = await gateRead(userId, input.eventId);
      return repos.announcements.listByEvent({
        organizationId: event.organizationId,
        eventId: event.id,
      });
    },

    async create(
      userId: string,
      input: { eventId: string; announcement: AnnouncementInput },
    ): Promise<AnnouncementRecord> {
      const event = await gateWrite(userId, input.eventId);
      const write = toAnnouncementWrite(announcementInput.parse(input.announcement));
      return repos.announcements.create({
        organizationId: event.organizationId,
        eventId: event.id,
        ...write,
      });
    },

    async update(
      userId: string,
      input: { eventId: string; id: string; patch: Partial<AnnouncementInput> },
    ): Promise<AnnouncementRecord> {
      const event = await gateWrite(userId, input.eventId);
      const patch = toAnnouncementPatch(announcementInput.partial().parse(input.patch));
      const updated = await repos.announcements.update({
        organizationId: event.organizationId,
        eventId: event.id,
        id: input.id,
        patch,
      });
      if (!updated) throw new NotFoundError("Announcement not found.");
      return updated;
    },

    async remove(userId: string, input: { eventId: string; id: string }): Promise<void> {
      const event = await gateWrite(userId, input.eventId);
      const ok = await repos.announcements.remove({
        organizationId: event.organizationId,
        eventId: event.id,
        id: input.id,
      });
      if (!ok) throw new NotFoundError("Announcement not found.");
    },
  };
}

export type MessagingService = ReturnType<typeof makeMessagingService>;

export interface PublicAnnouncement {
  id: string;
  title: string;
  body: string;
  createdAt: Date;
}

/**
 * Public announcements — no auth. Resolves the guest by token, then projects the event's announcements to
 * a safe shape. Returns [] for an unknown token (no oracle), never any org/guest/author data.
 */
export function makePublicMessagingService(repos: Repositories) {
  return {
    async forToken(token: string): Promise<PublicAnnouncement[]> {
      const guest = await repos.guests.findByRsvpToken(token);
      if (!guest) return [];
      const anns = await repos.announcements.listByEvent({
        organizationId: guest.organizationId,
        eventId: guest.eventId,
      });
      return anns.map((a) => ({ id: a.id, title: a.title, body: a.body, createdAt: a.createdAt }));
    },
  };
}

export type PublicMessagingService = ReturnType<typeof makePublicMessagingService>;
