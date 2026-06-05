import { z } from "zod";
import { router, authedProcedure } from "../trpc";

export const collaborationRouter = router({
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
  setMemberRole: authedProcedure
    .input(
      z.object({
        organizationId: z.string(),
        userId: z.string(),
        role: z.enum(["admin", "planner", "editor", "viewer"]),
      }),
    )
    .mutation(({ ctx, input }) =>
      ctx.container.collaboration.setMemberRole({
        organizationId: input.organizationId,
        actorUserId: ctx.user.id,
        targetUserId: input.userId,
        role: input.role,
      }),
    ),
  revokeInvitation: authedProcedure
    .input(z.object({ organizationId: z.string(), invitationId: z.string() }))
    .mutation(({ ctx, input }) =>
      ctx.container.collaboration.revokeInvitation({
        organizationId: input.organizationId,
        actorUserId: ctx.user.id,
        invitationId: input.invitationId,
      }),
    ),
});
