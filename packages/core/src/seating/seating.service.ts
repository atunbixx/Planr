import type {
  Repositories,
  EventRecord,
  SeatingTableRecord,
  SeatAssignmentRecord,
} from "../ports/repositories";
import { makeAuthorizationService } from "../services/authorization.service";
import { resolveModuleAccess } from "../entitlements/resolver";
import { NotFoundError, ForbiddenError } from "../errors";
import {
  seatingTableInput,
  toSeatingTableWrite,
  toSeatingTablePatch,
  type SeatingTableInput,
} from "./seating.dto";
import { FREE_LAUNCH } from "../billing/launch";

const GUEST_CAP = 1000; // a seating chart loads the whole guest list at once

export interface SeatedGuest {
  id: string;
  name: string;
}
export interface PlanTable {
  id: string;
  label: string;
  capacity: number;
  guests: SeatedGuest[];
  overCapacity: boolean;
}
export interface SeatingPlan {
  tables: PlanTable[];
  unassigned: SeatedGuest[];
  summary: {
    tableCount: number;
    totalCapacity: number;
    assignedCount: number;
    unassignedCount: number;
    overCapacityTables: number;
  };
}

export function makeSeatingService(repos: Repositories, opts: { freeLaunch?: boolean } = {}) {
  const authz = makeAuthorizationService(repos);
  const freeLaunch = opts.freeLaunch ?? FREE_LAUNCH;

  async function assertModuleAvailable(event: EventRecord): Promise<void> {
    if (freeLaunch) return; // launch: everything available; the gate stays wired for later
    const held = await repos.entitlements.heldFor({
      organizationId: event.organizationId,
      eventId: event.id,
    });
    const access = resolveModuleAccess({ module: "seating", eventType: event.eventTypeKey, held });
    if (access.locked) {
      throw new ForbiddenError(`The seating module is locked (${access.reason}).`);
    }
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
    /** The whole chart in one call: tables with their seated guests, plus the unseated pool. */
    async plan(userId: string, input: { eventId: string }): Promise<SeatingPlan> {
      const event = await gateRead(userId, input.eventId);
      const scope = { organizationId: event.organizationId, eventId: event.id };
      const [tables, assignments, guestPage] = await Promise.all([
        repos.seating.listTables(scope),
        repos.seating.listAssignments(scope),
        repos.guests.listByEvent({ ...scope, limit: GUEST_CAP }),
      ]);
      const guestName = new Map(guestPage.guests.map((g) => [g.id, g.name] as const));
      const tableOf = new Map(assignments.map((a) => [a.guestId, a.tableId] as const));

      const tablesView: PlanTable[] = tables.map((t) => {
        const seated = assignments
          .filter((a) => a.tableId === t.id && guestName.has(a.guestId))
          .map((a) => ({ id: a.guestId, name: guestName.get(a.guestId)! }));
        return {
          id: t.id,
          label: t.label,
          capacity: t.capacity,
          guests: seated,
          overCapacity: seated.length > t.capacity,
        };
      });
      const unassigned: SeatedGuest[] = guestPage.guests
        .filter((g) => !tableOf.has(g.id))
        .map((g) => ({ id: g.id, name: g.name }));

      const assignedCount = guestPage.guests.length - unassigned.length;
      return {
        tables: tablesView,
        unassigned,
        summary: {
          tableCount: tables.length,
          totalCapacity: tables.reduce((s, t) => s + t.capacity, 0),
          assignedCount,
          unassignedCount: unassigned.length,
          overCapacityTables: tablesView.filter((t) => t.overCapacity).length,
        },
      };
    },

    async createTable(
      userId: string,
      input: { eventId: string; table: SeatingTableInput },
    ): Promise<SeatingTableRecord> {
      const event = await gateWrite(userId, input.eventId);
      const write = toSeatingTableWrite(seatingTableInput.parse(input.table));
      return repos.seating.createTable({
        organizationId: event.organizationId,
        eventId: event.id,
        ...write,
      });
    },

    async updateTable(
      userId: string,
      input: { eventId: string; tableId: string; patch: Partial<SeatingTableInput> },
    ): Promise<SeatingTableRecord> {
      const event = await gateWrite(userId, input.eventId);
      const patch = toSeatingTablePatch(seatingTableInput.partial().parse(input.patch));
      const updated = await repos.seating.updateTable({
        organizationId: event.organizationId,
        eventId: event.id,
        id: input.tableId,
        patch,
      });
      if (!updated) throw new NotFoundError("Table not found.");
      return updated;
    },

    async removeTable(userId: string, input: { eventId: string; tableId: string }): Promise<void> {
      const event = await gateWrite(userId, input.eventId);
      const ok = await repos.seating.removeTable({
        organizationId: event.organizationId,
        eventId: event.id,
        id: input.tableId,
      });
      if (!ok) throw new NotFoundError("Table not found.");
    },

    /** Seat a guest at a table (moves them if already seated). Over-capacity is allowed and surfaced. */
    async assign(
      userId: string,
      input: { eventId: string; tableId: string; guestId: string },
    ): Promise<SeatAssignmentRecord> {
      const event = await gateWrite(userId, input.eventId);
      const scope = { organizationId: event.organizationId, eventId: event.id };
      const table = await repos.seating.getTable({ ...scope, id: input.tableId });
      if (!table) throw new NotFoundError("Table not found.");
      // The cross-module guard: the guest must belong to THIS event/tenant.
      const guest = await repos.guests.getById({ ...scope, id: input.guestId });
      if (!guest) throw new NotFoundError("Guest not found.");
      return repos.seating.assign({ ...scope, tableId: input.tableId, guestId: input.guestId });
    },

    async unassign(userId: string, input: { eventId: string; guestId: string }): Promise<void> {
      const event = await gateWrite(userId, input.eventId);
      const ok = await repos.seating.unassign({
        organizationId: event.organizationId,
        eventId: event.id,
        guestId: input.guestId,
      });
      if (!ok) throw new NotFoundError("Seat assignment not found.");
    },
  };
}

export type SeatingService = ReturnType<typeof makeSeatingService>;
