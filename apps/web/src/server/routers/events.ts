import { z } from "zod";
import { NotFoundError } from "@planr/core";
import { router, authedProcedure } from "../trpc";

// yyyy-mm-dd (HTML date input) or full ISO → Date | null; "" / undefined → null.
const toDate = (s?: string): Date | null => (s && s.trim() !== "" ? new Date(s) : null);
const dateString = z.string().max(40).optional();

export const eventsRouter = router({
  list: authedProcedure
    .input(z.object({ organizationId: z.string() }))
    .query(async ({ ctx, input }) => {
      await ctx.container.authz.requireMembership(ctx.user.id, input.organizationId);
      return ctx.container.events.list(input.organizationId);
    }),
  get: authedProcedure
    .input(z.object({ organizationId: z.string(), eventId: z.string() }))
    .query(async ({ ctx, input }) => {
      await ctx.container.authz.requireMembership(ctx.user.id, input.organizationId);
      const event = await ctx.container.events.get(input);
      if (!event) throw new NotFoundError("Event not found.");
      return event;
    }),
  create: authedProcedure
    .input(
      z.object({
        organizationId: z.string(),
        eventTypeKey: z.enum(["wedding", "birthday", "funeral", "bridal_shower", "corporate"]),
        name: z.string().min(1),
        date: dateString,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.container.authz.requirePermission(ctx.user.id, input.organizationId, "event:create");
      return ctx.container.events.create({
        organizationId: input.organizationId,
        eventTypeKey: input.eventTypeKey,
        name: input.name,
        date: toDate(input.date),
      });
    }),
  update: authedProcedure
    .input(
      z.object({
        organizationId: z.string(),
        eventId: z.string(),
        name: z.string().min(1).max(120).optional(),
        date: dateString,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.container.authz.requirePermission(ctx.user.id, input.organizationId, "event:update");
      const patch: { name?: string; date?: Date | null } = {};
      if (input.name !== undefined) patch.name = input.name;
      if (input.date !== undefined) patch.date = toDate(input.date);
      const event = await ctx.container.events.update({
        organizationId: input.organizationId,
        eventId: input.eventId,
        patch,
      });
      if (!event) throw new NotFoundError("Event not found.");
      return event;
    }),
  modules: authedProcedure
    .input(z.object({ organizationId: z.string(), eventId: z.string() }))
    .query(async ({ ctx, input }) => {
      await ctx.container.authz.requireMembership(ctx.user.id, input.organizationId);
      return ctx.container.events.resolveModules({
        organizationId: input.organizationId,
        eventId: input.eventId,
      });
    }),
});
