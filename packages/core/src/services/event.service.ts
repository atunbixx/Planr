import type { Repositories, EventRecord } from "../ports/repositories";
import type { EventTypeKey, ModuleKey } from "../types";
import { modulesForEventType } from "../capabilities/registry";
import { resolveModuleAccess, type ModuleAccess } from "../entitlements/resolver";

export interface ResolvedModule extends ModuleAccess {
  module: ModuleKey;
}

export function makeEventService(repos: Repositories) {
  return {
    async create(input: {
      organizationId: string;
      eventTypeKey: EventTypeKey;
      name: string;
      date: Date | null;
    }): Promise<EventRecord> {
      return repos.events.create(input);
    },

    async list(organizationId: string): Promise<EventRecord[]> {
      return repos.events.listByOrganization(organizationId);
    },

    async get(input: { organizationId: string; eventId: string }): Promise<EventRecord | null> {
      return repos.events.findById({ organizationId: input.organizationId, id: input.eventId });
    },

    async update(input: {
      organizationId: string;
      eventId: string;
      patch: { name?: string; date?: Date | null };
    }): Promise<EventRecord | null> {
      return repos.events.update({
        organizationId: input.organizationId,
        id: input.eventId,
        patch: input.patch,
      });
    },

    async resolveModules(input: {
      organizationId: string;
      eventId: string;
    }): Promise<ResolvedModule[]> {
      const event = await repos.events.findById({
        organizationId: input.organizationId,
        id: input.eventId,
      });
      if (!event) {
        throw new Error(
          `Event "${input.eventId}" not found in organization "${input.organizationId}".`,
        );
      }
      const held = await repos.entitlements.heldFor({
        organizationId: input.organizationId,
        eventId: event.id,
      });
      return modulesForEventType(event.eventTypeKey).map((m) => ({
        module: m.key,
        ...resolveModuleAccess({ module: m.key, eventType: event.eventTypeKey, held }),
      }));
    },
  };
}

export type EventService = ReturnType<typeof makeEventService>;
