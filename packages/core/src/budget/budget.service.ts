import type { Repositories, BudgetItemRecord, BudgetSummary, EventRecord } from "../ports/repositories";
import { makeAuthorizationService } from "../services/authorization.service";
import { resolveModuleAccess } from "../entitlements/resolver";
import { NotFoundError, ForbiddenError } from "../errors";
import {
  budgetItemInput,
  toBudgetItemWrite,
  toBudgetItemPatch,
  type BudgetItemInput,
} from "./budget.dto";
import { FREE_LAUNCH } from "../billing/launch";

const MAX_LIMIT = 100;
const DEFAULT_LIMIT = 50;

export function makeBudgetService(repos: Repositories, opts: { freeLaunch?: boolean } = {}) {
  const authz = makeAuthorizationService(repos);
  const freeLaunch = opts.freeLaunch ?? FREE_LAUNCH;

  async function assertModuleAvailable(event: EventRecord): Promise<void> {
    if (freeLaunch) return; // launch: everything available; the gate stays wired for later
    const held = await repos.entitlements.heldFor({
      organizationId: event.organizationId,
      eventId: event.id,
    });
    const access = resolveModuleAccess({ module: "budget", eventType: event.eventTypeKey, held });
    if (access.locked) {
      throw new ForbiddenError(`The budget module is locked (${access.reason}).`);
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
    async summary(userId: string, input: { eventId: string }): Promise<BudgetSummary> {
      const event = await gateRead(userId, input.eventId);
      return repos.budget.summaryByEvent({
        organizationId: event.organizationId,
        eventId: event.id,
      });
    },

    async list(
      userId: string,
      input: { eventId: string; limit?: number; cursor?: string },
    ): Promise<{ items: BudgetItemRecord[]; nextCursor: string | null }> {
      const event = await gateRead(userId, input.eventId);
      const limit = Math.min(Math.max(input.limit ?? DEFAULT_LIMIT, 1), MAX_LIMIT);
      return repos.budget.listByEvent({
        organizationId: event.organizationId,
        eventId: event.id,
        limit,
        cursor: input.cursor,
      });
    },

    async create(
      userId: string,
      input: { eventId: string; item: BudgetItemInput },
    ): Promise<BudgetItemRecord> {
      const event = await gateWrite(userId, input.eventId);
      const write = toBudgetItemWrite(budgetItemInput.parse(input.item));
      return repos.budget.create({
        organizationId: event.organizationId,
        eventId: event.id,
        ...write,
      });
    },

    async update(
      userId: string,
      input: { eventId: string; itemId: string; patch: Partial<BudgetItemInput> },
    ): Promise<BudgetItemRecord> {
      const event = await gateWrite(userId, input.eventId);
      const patch = toBudgetItemPatch(budgetItemInput.partial().parse(input.patch));
      const updated = await repos.budget.update({
        organizationId: event.organizationId,
        eventId: event.id,
        id: input.itemId,
        patch,
      });
      if (!updated) throw new NotFoundError("Budget item not found.");
      return updated;
    },

    async remove(userId: string, input: { eventId: string; itemId: string }): Promise<void> {
      const event = await gateWrite(userId, input.eventId);
      const ok = await repos.budget.remove({
        organizationId: event.organizationId,
        eventId: event.id,
        id: input.itemId,
      });
      if (!ok) throw new NotFoundError("Budget item not found.");
    },
  };
}

export type BudgetService = ReturnType<typeof makeBudgetService>;
