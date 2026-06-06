import type { Repositories, RegistryItemRecord, EventRecord } from "../ports/repositories";
import { makeAuthorizationService } from "../services/authorization.service";
import { resolveModuleAccess } from "../entitlements/resolver";
import { NotFoundError, ForbiddenError } from "../errors";
import {
  registryItemInput,
  toRegistryItemWrite,
  toRegistryItemPatch,
  type RegistryItemInput,
} from "./registry.dto";
import { FREE_LAUNCH } from "../billing/launch";

export function makeRegistryService(repos: Repositories, opts: { freeLaunch?: boolean } = {}) {
  const authz = makeAuthorizationService(repos);
  const freeLaunch = opts.freeLaunch ?? FREE_LAUNCH;

  async function assertModuleAvailable(event: EventRecord): Promise<void> {
    if (freeLaunch) return;
    const held = await repos.entitlements.heldFor({
      organizationId: event.organizationId,
      eventId: event.id,
    });
    const access = resolveModuleAccess({
      module: "gift_registry",
      eventType: event.eventTypeKey,
      held,
    });
    if (access.locked) throw new ForbiddenError(`The registry module is locked (${access.reason}).`);
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
    async list(userId: string, input: { eventId: string }): Promise<RegistryItemRecord[]> {
      const event = await gateRead(userId, input.eventId);
      return repos.registry.listByEvent({ organizationId: event.organizationId, eventId: event.id });
    },
    async create(
      userId: string,
      input: { eventId: string; item: RegistryItemInput },
    ): Promise<RegistryItemRecord> {
      const event = await gateWrite(userId, input.eventId);
      const write = toRegistryItemWrite(registryItemInput.parse(input.item));
      return repos.registry.create({ organizationId: event.organizationId, eventId: event.id, ...write });
    },
    async update(
      userId: string,
      input: { eventId: string; itemId: string; patch: Partial<RegistryItemInput> },
    ): Promise<RegistryItemRecord> {
      const event = await gateWrite(userId, input.eventId);
      const patch = toRegistryItemPatch(registryItemInput.partial().parse(input.patch));
      const updated = await repos.registry.update({
        organizationId: event.organizationId,
        eventId: event.id,
        id: input.itemId,
        patch,
      });
      if (!updated) throw new NotFoundError("Registry item not found.");
      return updated;
    },
    async remove(userId: string, input: { eventId: string; itemId: string }): Promise<void> {
      const event = await gateWrite(userId, input.eventId);
      const ok = await repos.registry.remove({
        organizationId: event.organizationId,
        eventId: event.id,
        id: input.itemId,
      });
      if (!ok) throw new NotFoundError("Registry item not found.");
    },
  };
}

export type RegistryService = ReturnType<typeof makeRegistryService>;

export interface PublicGift {
  id: string;
  title: string;
  url: string | null;
  note: string | null;
  priceCents: number;
}

/** Public gift list for a PUBLISHED event website (by slug). Returns [] otherwise. */
export function makePublicRegistryService(repos: Repositories) {
  return {
    async forSlug(slug: string): Promise<PublicGift[]> {
      const website = await repos.websites.getBySlug(slug);
      if (!website || !website.published) return [];
      const items = await repos.registry.listByEvent({
        organizationId: website.organizationId,
        eventId: website.eventId,
      });
      return items.map((i) => ({
        id: i.id,
        title: i.title,
        url: i.url,
        note: i.note,
        priceCents: i.priceCents,
      }));
    },
  };
}

export type PublicRegistryService = ReturnType<typeof makePublicRegistryService>;
