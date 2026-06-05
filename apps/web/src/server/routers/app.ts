import { z } from "zod";
import { router, publicProcedure, authedProcedure } from "../trpc";

export const appRouter = router({
  me: publicProcedure.query(({ ctx }) => ctx.user),

  workspaces: router({
    list: authedProcedure.query(({ ctx }) => ctx.container.repos.orgs.listForUser(ctx.user.id)),
  }),

  onboarding: router({
    completeIndividual: authedProcedure
      .input(
        z.object({
          spaceName: z.string().min(1),
          eventTypeKey: z.enum(["wedding", "birthday", "funeral", "bridal_shower", "corporate"]),
          eventName: z.string().min(1),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        const { organization, event } = await ctx.container.onboarding.completeIndividual({
          creator: { authUserId: ctx.user.authUserId, email: ctx.user.email, name: ctx.user.name },
          spaceName: input.spaceName,
          firstEvent: { eventTypeKey: input.eventTypeKey, name: input.eventName },
        });
        return { organizationId: organization.id, eventId: event.id };
      }),
    completeBusiness: authedProcedure
      .input(z.object({ businessName: z.string().min(1) }))
      .mutation(async ({ ctx, input }) => {
        const { organization } = await ctx.container.onboarding.completeBusiness({
          creator: { authUserId: ctx.user.authUserId, email: ctx.user.email, name: ctx.user.name },
          businessName: input.businessName,
        });
        return { organizationId: organization.id };
      }),
  }),

  organizations: router({
    list: authedProcedure.query(({ ctx }) => ctx.container.repos.orgs.listForUser(ctx.user.id)),
    create: authedProcedure
      .input(z.object({ name: z.string().min(1) }))
      .mutation(async ({ ctx, input }) => {
        const { organization } = await ctx.container.tenancy.provisionOrganization({
          name: input.name,
          creator: { authUserId: ctx.user.authUserId, email: ctx.user.email, name: ctx.user.name },
        });
        return organization;
      }),
  }),

  events: router({
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
        await ctx.container.authz.requirePermission(
          ctx.user.id,
          input.organizationId,
          "event:create",
        );
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
  }),
});

export type AppRouter = typeof appRouter;
