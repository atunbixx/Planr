import { z } from "zod";
import { router, authedProcedure } from "../trpc";

export const eventsRouter = router({
  list: authedProcedure
    .input(z.object({ organizationId: z.string() }))
    .query(async ({ ctx, input }) => {
      await ctx.container.authz.requireMembership(ctx.user.id, input.organizationId);
      return ctx.container.events.list(input.organizationId);
    }),
  create: authedProcedure
    .input(
      z.object({
        organizationId: z.string(),
        eventTypeKey: z.enum(["wedding", "birthday", "funeral", "bridal_shower", "corporate"]),
        name: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.container.authz.requirePermission(ctx.user.id, input.organizationId, "event:create");
      return ctx.container.events.create({
        organizationId: input.organizationId,
        eventTypeKey: input.eventTypeKey,
        name: input.name,
        date: null,
      });
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
