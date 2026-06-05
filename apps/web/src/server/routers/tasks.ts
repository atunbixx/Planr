import { z } from "zod";
import { router, authedProcedure } from "../trpc";

// Boundary schema for task payloads (mirrors core's `taskInput`; the TaskService re-parses on write).
// dueDate is an optional ISO-8601 / yyyy-mm-dd string or "" — core coerces it to Date | null.
const taskInput = z.object({
  title: z.string().trim().min(1).max(200),
  notes: z.string().max(2000).optional(),
  done: z.boolean().optional(),
  dueDate: z.string().max(40).optional(),
});

export const tasksRouter = router({
  summary: authedProcedure
    .input(z.object({ eventId: z.string() }))
    .query(({ ctx, input }) => ctx.container.tasks.summary(ctx.user.id, input)),
  list: authedProcedure
    .input(
      z.object({
        eventId: z.string(),
        limit: z.number().int().min(1).max(100).optional(),
        cursor: z.string().optional(),
      }),
    )
    .query(({ ctx, input }) => ctx.container.tasks.list(ctx.user.id, input)),
  create: authedProcedure
    .input(z.object({ eventId: z.string(), task: taskInput }))
    .mutation(({ ctx, input }) =>
      ctx.container.tasks.create(ctx.user.id, { eventId: input.eventId, task: input.task }),
    ),
  update: authedProcedure
    .input(z.object({ eventId: z.string(), taskId: z.string(), patch: taskInput.partial() }))
    .mutation(({ ctx, input }) =>
      ctx.container.tasks.update(ctx.user.id, {
        eventId: input.eventId,
        taskId: input.taskId,
        patch: input.patch,
      }),
    ),
  remove: authedProcedure
    .input(z.object({ eventId: z.string(), taskId: z.string() }))
    .mutation(({ ctx, input }) =>
      ctx.container.tasks.remove(ctx.user.id, { eventId: input.eventId, taskId: input.taskId }),
    ),
});
