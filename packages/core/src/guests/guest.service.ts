import type { Repositories, GuestRecord, GuestSummary, EventRecord } from "../ports/repositories";
import { makeAuthorizationService } from "../services/authorization.service";
import { resolveModuleAccess } from "../entitlements/resolver";
import { NotFoundError, ForbiddenError } from "../errors";
import { guestInput, toGuestWrite, toGuestPatch, type GuestInput } from "./guest.dto";
import { FREE_LAUNCH } from "../billing/launch";

const MAX_LIMIT = 100;
const DEFAULT_LIMIT = 50;

export function makeGuestService(repos: Repositories, opts: { freeLaunch?: boolean } = {}) {
  const authz = makeAuthorizationService(repos);
  const freeLaunch = opts.freeLaunch ?? FREE_LAUNCH;

  async function assertModuleAvailable(event: EventRecord): Promise<void> {
    if (freeLaunch) return; // launch: everything available; the gate stays wired for later
    const held = await repos.entitlements.heldFor({
      organizationId: event.organizationId,
      eventId: event.id,
    });
    const access = resolveModuleAccess({ module: "guests", eventType: event.eventTypeKey, held });
    if (access.locked) {
      throw new ForbiddenError(`The guests module is locked (${access.reason}).`);
    }
  }

  /** Resolve the event, assert the caller is a member, and assert the module is available. */
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
    async summary(userId: string, input: { eventId: string }): Promise<GuestSummary> {
      const event = await gateRead(userId, input.eventId);
      return repos.guests.summaryByEvent({
        organizationId: event.organizationId,
        eventId: event.id,
      });
    },

    async list(
      userId: string,
      input: { eventId: string; limit?: number; cursor?: string },
    ): Promise<{ guests: GuestRecord[]; nextCursor: string | null }> {
      const event = await gateRead(userId, input.eventId);
      const limit = Math.min(Math.max(input.limit ?? DEFAULT_LIMIT, 1), MAX_LIMIT);
      return repos.guests.listByEvent({
        organizationId: event.organizationId,
        eventId: event.id,
        limit,
        cursor: input.cursor,
      });
    },

    async create(userId: string, input: { eventId: string; guest: GuestInput }): Promise<GuestRecord> {
      const event = await gateWrite(userId, input.eventId);
      const write = toGuestWrite(guestInput.parse(input.guest));
      return repos.guests.create({
        organizationId: event.organizationId,
        eventId: event.id,
        ...write,
      });
    },

    async update(
      userId: string,
      input: { eventId: string; guestId: string; patch: Partial<GuestInput> },
    ): Promise<GuestRecord> {
      const event = await gateWrite(userId, input.eventId);
      const patch = toGuestPatch(guestInput.partial().parse(input.patch));
      const updated = await repos.guests.update({
        organizationId: event.organizationId,
        eventId: event.id,
        id: input.guestId,
        patch,
      });
      if (!updated) throw new NotFoundError("Guest not found.");
      return updated;
    },

    async remove(userId: string, input: { eventId: string; guestId: string }): Promise<void> {
      const event = await gateWrite(userId, input.eventId);
      const ok = await repos.guests.remove({
        organizationId: event.organizationId,
        eventId: event.id,
        id: input.guestId,
      });
      if (!ok) throw new NotFoundError("Guest not found.");
    },
  };
}

export type GuestService = ReturnType<typeof makeGuestService>;
