import type { Repositories, TaskRecord, TaskSummary, EventRecord } from "../ports/repositories";
import { makeAuthorizationService } from "../services/authorization.service";
import { resolveModuleAccess } from "../entitlements/resolver";
import { NotFoundError, ForbiddenError } from "../errors";
import { taskInput, toTaskWrite, toTaskPatch, type TaskInput } from "./task.dto";
import { checklistTemplateFor } from "./checklist-template";
import { FREE_LAUNCH } from "../billing/launch";

const MAX_LIMIT = 100;
const DEFAULT_LIMIT = 50;

export function makeTaskService(repos: Repositories, opts: { freeLaunch?: boolean } = {}) {
  const authz = makeAuthorizationService(repos);
  const freeLaunch = opts.freeLaunch ?? FREE_LAUNCH;

  async function assertModuleAvailable(event: EventRecord): Promise<void> {
    if (freeLaunch) return; // launch: everything available; the gate stays wired for later
    const held = await repos.entitlements.heldFor({
      organizationId: event.organizationId,
      eventId: event.id,
    });
    const access = resolveModuleAccess({ module: "tasks", eventType: event.eventTypeKey, held });
    if (access.locked) {
      throw new ForbiddenError(`The tasks module is locked (${access.reason}).`);
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
    async summary(userId: string, input: { eventId: string; now?: Date }): Promise<TaskSummary> {
      const event = await gateRead(userId, input.eventId);
      return repos.tasks.summaryByEvent({
        organizationId: event.organizationId,
        eventId: event.id,
        now: input.now ?? new Date(),
      });
    },

    async list(
      userId: string,
      input: { eventId: string; limit?: number; cursor?: string },
    ): Promise<{ tasks: TaskRecord[]; nextCursor: string | null }> {
      const event = await gateRead(userId, input.eventId);
      const limit = Math.min(Math.max(input.limit ?? DEFAULT_LIMIT, 1), MAX_LIMIT);
      return repos.tasks.listByEvent({
        organizationId: event.organizationId,
        eventId: event.id,
        limit,
        cursor: input.cursor,
      });
    },

    async create(userId: string, input: { eventId: string; task: TaskInput }): Promise<TaskRecord> {
      const event = await gateWrite(userId, input.eventId);
      const write = toTaskWrite(taskInput.parse(input.task));
      return repos.tasks.create({
        organizationId: event.organizationId,
        eventId: event.id,
        ...write,
      });
    },

    async update(
      userId: string,
      input: { eventId: string; taskId: string; patch: Partial<TaskInput> },
    ): Promise<TaskRecord> {
      const event = await gateWrite(userId, input.eventId);
      const patch = toTaskPatch(taskInput.partial().parse(input.patch));
      const updated = await repos.tasks.update({
        organizationId: event.organizationId,
        eventId: event.id,
        id: input.taskId,
        patch,
      });
      if (!updated) throw new NotFoundError("Task not found.");
      return updated;
    },

    async remove(userId: string, input: { eventId: string; taskId: string }): Promise<void> {
      const event = await gateWrite(userId, input.eventId);
      const ok = await repos.tasks.remove({
        organizationId: event.organizationId,
        eventId: event.id,
        id: input.taskId,
      });
      if (!ok) throw new NotFoundError("Task not found.");
    },

    /**
     * One-shot: populate the event's checklist from its event-type template, with due dates derived
     * from the event date. Requires a date, a non-empty template, and an empty checklist (so it can't
     * duplicate). Returns the number of tasks created.
     */
    async generateFromTemplate(
      userId: string,
      input: { eventId: string },
    ): Promise<{ created: number }> {
      const event = await gateWrite(userId, input.eventId);
      if (!event.date) {
        throw new ForbiddenError("Set an event date before generating a checklist.");
      }
      const template = checklistTemplateFor(event.eventTypeKey);
      if (template.length === 0) {
        throw new ForbiddenError("No checklist template for this event type yet.");
      }
      const existing = await repos.tasks.summaryByEvent({
        organizationId: event.organizationId,
        eventId: event.id,
        now: new Date(),
      });
      if (existing.total > 0) {
        throw new ForbiddenError("This checklist already has tasks.");
      }
      const eventTime = event.date.getTime();
      for (const item of template) {
        const dueDate = new Date(eventTime - item.offsetDays * 86_400_000);
        await repos.tasks.create({
          organizationId: event.organizationId,
          eventId: event.id,
          title: item.title,
          notes: null,
          done: false,
          dueDate,
        });
      }
      return { created: template.length };
    },
  };
}

export type TaskService = ReturnType<typeof makeTaskService>;
