import { z } from "zod";
import { router, publicProcedure, authedProcedure } from "../trpc";

// tRPC boundary schema for guest payloads. The authoritative validator is core's `guestInput`,
// which the GuestService re-parses on every write — this mirrors its shape for input typing and
// must stay in sync with packages/core/src/guests/guest.dto.ts.
const guestInput = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().max(200).optional(),
  phone: z.string().max(40).optional(),
  groupLabel: z.string().max(80).optional(),
  plusOne: z.boolean().optional(),
  rsvpStatus: z.enum(["awaiting", "coming", "declined", "maybe"]).optional(),
  notes: z.string().max(2000).optional(),
});

// Boundary schema for task payloads (mirrors core's `taskInput`; the TaskService re-parses on write).
// dueDate is an optional ISO-8601 / yyyy-mm-dd string or "" — core coerces it to Date | null.
const taskInput = z.object({
  title: z.string().trim().min(1).max(200),
  notes: z.string().max(2000).optional(),
  done: z.boolean().optional(),
  dueDate: z.string().max(40).optional(),
});

// Boundary schema for budget-item payloads (mirrors core's `budgetItemInput`; the BudgetService
// re-parses on write). Amounts are decimal STRINGS so they convert to exact pence in core.
const budgetItemInput = z.object({
  label: z.string().trim().min(1).max(160),
  category: z.string().max(80).optional(),
  estimated: z.string().max(20).optional(),
  paid: z.string().max(20).optional(),
  notes: z.string().max(2000).optional(),
});

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

  collaboration: router({
    members: authedProcedure
      .input(z.object({ organizationId: z.string() }))
      .query(({ ctx, input }) =>
        ctx.container.collaboration.listMembers(input.organizationId, ctx.user.id),
      ),
    pending: authedProcedure
      .input(z.object({ organizationId: z.string() }))
      .query(({ ctx, input }) =>
        ctx.container.collaboration.listPendingInvitations(input.organizationId, ctx.user.id),
      ),
    invite: authedProcedure
      .input(
        z.object({
          organizationId: z.string(),
          email: z.string().email(),
          role: z.enum(["admin", "planner", "editor", "viewer"]),
        }),
      )
      .mutation(({ ctx, input }) =>
        ctx.container.collaboration.invite({
          organizationId: input.organizationId,
          inviterUserId: ctx.user.id,
          email: input.email,
          role: input.role,
        }),
      ),
    removeMember: authedProcedure
      .input(z.object({ organizationId: z.string(), userId: z.string() }))
      .mutation(({ ctx, input }) =>
        ctx.container.collaboration.removeMember({
          organizationId: input.organizationId,
          actorUserId: ctx.user.id,
          targetUserId: input.userId,
        }),
      ),
    acceptByToken: authedProcedure
      .input(z.object({ token: z.string() }))
      .mutation(({ ctx, input }) =>
        ctx.container.collaboration.acceptByToken(ctx.user.id, input.token),
      ),
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

  guests: router({
    summary: authedProcedure
      .input(z.object({ eventId: z.string() }))
      .query(({ ctx, input }) => ctx.container.guests.summary(ctx.user.id, input)),
    list: authedProcedure
      .input(
        z.object({
          eventId: z.string(),
          limit: z.number().int().min(1).max(100).optional(),
          cursor: z.string().optional(),
        }),
      )
      .query(({ ctx, input }) => ctx.container.guests.list(ctx.user.id, input)),
    create: authedProcedure
      .input(z.object({ eventId: z.string(), guest: guestInput }))
      .mutation(({ ctx, input }) =>
        ctx.container.guests.create(ctx.user.id, { eventId: input.eventId, guest: input.guest }),
      ),
    update: authedProcedure
      .input(
        z.object({
          eventId: z.string(),
          guestId: z.string(),
          patch: guestInput.partial(),
        }),
      )
      .mutation(({ ctx, input }) =>
        ctx.container.guests.update(ctx.user.id, {
          eventId: input.eventId,
          guestId: input.guestId,
          patch: input.patch,
        }),
      ),
    remove: authedProcedure
      .input(z.object({ eventId: z.string(), guestId: z.string() }))
      .mutation(({ ctx, input }) =>
        ctx.container.guests.remove(ctx.user.id, {
          eventId: input.eventId,
          guestId: input.guestId,
        }),
      ),
  }),

  tasks: router({
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
      .input(
        z.object({
          eventId: z.string(),
          taskId: z.string(),
          patch: taskInput.partial(),
        }),
      )
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
        ctx.container.tasks.remove(ctx.user.id, {
          eventId: input.eventId,
          taskId: input.taskId,
        }),
      ),
  }),

  budget: router({
    summary: authedProcedure
      .input(z.object({ eventId: z.string() }))
      .query(({ ctx, input }) => ctx.container.budget.summary(ctx.user.id, input)),
    list: authedProcedure
      .input(
        z.object({
          eventId: z.string(),
          limit: z.number().int().min(1).max(100).optional(),
          cursor: z.string().optional(),
        }),
      )
      .query(({ ctx, input }) => ctx.container.budget.list(ctx.user.id, input)),
    create: authedProcedure
      .input(z.object({ eventId: z.string(), item: budgetItemInput }))
      .mutation(({ ctx, input }) =>
        ctx.container.budget.create(ctx.user.id, { eventId: input.eventId, item: input.item }),
      ),
    update: authedProcedure
      .input(
        z.object({
          eventId: z.string(),
          itemId: z.string(),
          patch: budgetItemInput.partial(),
        }),
      )
      .mutation(({ ctx, input }) =>
        ctx.container.budget.update(ctx.user.id, {
          eventId: input.eventId,
          itemId: input.itemId,
          patch: input.patch,
        }),
      ),
    remove: authedProcedure
      .input(z.object({ eventId: z.string(), itemId: z.string() }))
      .mutation(({ ctx, input }) =>
        ctx.container.budget.remove(ctx.user.id, {
          eventId: input.eventId,
          itemId: input.itemId,
        }),
      ),
  }),
});

export type AppRouter = typeof appRouter;
