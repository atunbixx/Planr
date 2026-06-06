import type { Repositories, EventRecord, GuestSummary } from "../ports/repositories";
import type { RsvpStatus } from "../types";
import { makeAuthorizationService } from "../services/authorization.service";
import { resolveModuleAccess } from "../entitlements/resolver";
import { NotFoundError, ForbiddenError } from "../errors";
import { rsvpResponseInput, type RsvpResponseInput } from "./rsvp.dto";
import { FREE_LAUNCH } from "../billing/launch";

export interface PublicRsvpView {
  eventName: string;
  guestName: string;
  rsvpStatus: RsvpStatus;
  plusOne: boolean;
  mealChoice: string | null;
}

const INVALID = "This RSVP link isn't valid.";

/**
 * Public, UNAUTHENTICATED RSVP. The capability is the token — there is no userId, no membership check
 * and no module gate. It can only read a minimal view of, and set the RSVP of, the single guest the
 * token belongs to. It never returns org/email/other-guest data.
 */
export function makePublicRsvpService(repos: Repositories) {
  async function viewOf(guest: {
    eventId: string;
    name: string;
    rsvpStatus: RsvpStatus;
    plusOne: boolean;
    mealChoice: string | null;
  }): Promise<PublicRsvpView> {
    const event = await repos.events.getById(guest.eventId);
    if (!event) throw new NotFoundError(INVALID);
    return {
      eventName: event.name,
      guestName: guest.name,
      rsvpStatus: guest.rsvpStatus,
      plusOne: guest.plusOne,
      mealChoice: guest.mealChoice,
    };
  }

  return {
    async get(token: string): Promise<PublicRsvpView> {
      const guest = await repos.guests.findByRsvpToken(token);
      if (!guest) throw new NotFoundError(INVALID);
      return viewOf(guest);
    },

    async respond(token: string, input: RsvpResponseInput): Promise<PublicRsvpView> {
      const parsed = rsvpResponseInput.parse(input);
      const updated = await repos.guests.setRsvpByToken({
        token,
        rsvpStatus: parsed.rsvpStatus,
        plusOne: parsed.plusOne,
        mealChoice: parsed.mealChoice,
      });
      if (!updated) throw new NotFoundError(INVALID);
      return viewOf(updated);
    },
  };
}

export type PublicRsvpService = ReturnType<typeof makePublicRsvpService>;

export interface RsvpOverview {
  summary: GuestSummary;
  guests: { id: string; name: string; rsvpStatus: RsvpStatus; token: string }[];
}

/** Host-side RSVP dashboard — authed and gated on the "rsvp" module. Read-only over guest data. */
export function makeRsvpService(repos: Repositories, opts: { freeLaunch?: boolean } = {}) {
  const authz = makeAuthorizationService(repos);
  const freeLaunch = opts.freeLaunch ?? FREE_LAUNCH;

  async function gateRead(userId: string, eventId: string): Promise<EventRecord> {
    const event = await repos.events.getById(eventId);
    if (!event) throw new NotFoundError("Event not found.");
    await authz.requireMembership(userId, event.organizationId);
    if (!freeLaunch) {
      const held = await repos.entitlements.heldFor({
        organizationId: event.organizationId,
        eventId: event.id,
      });
      const access = resolveModuleAccess({ module: "rsvp", eventType: event.eventTypeKey, held });
      if (access.locked) throw new ForbiddenError(`The rsvp module is locked (${access.reason}).`);
    }
    return event;
  }

  return {
    async overview(userId: string, input: { eventId: string }): Promise<RsvpOverview> {
      const event = await gateRead(userId, input.eventId);
      const scope = { organizationId: event.organizationId, eventId: event.id };
      const [summary, page] = await Promise.all([
        repos.guests.summaryByEvent(scope),
        repos.guests.listByEvent({ ...scope, limit: 1000 }),
      ]);
      return {
        summary,
        guests: page.guests.map((g) => ({
          id: g.id,
          name: g.name,
          rsvpStatus: g.rsvpStatus,
          token: g.rsvpToken,
        })),
      };
    },
  };
}

export type RsvpService = ReturnType<typeof makeRsvpService>;
