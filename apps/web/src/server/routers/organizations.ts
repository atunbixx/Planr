import { z } from "zod";
import { SUPPORTED_CURRENCIES, NotFoundError } from "@planr/core";
import { router, authedProcedure } from "../trpc";

export const organizationsRouter = router({
  list: authedProcedure.query(({ ctx }) => ctx.container.repos.orgs.listForUser(ctx.user.id)),
  get: authedProcedure
    .input(z.object({ organizationId: z.string() }))
    .query(async ({ ctx, input }) => {
      await ctx.container.authz.requireMembership(ctx.user.id, input.organizationId);
      const org = await ctx.container.repos.orgs.findById(input.organizationId);
      if (!org) throw new NotFoundError("Workspace not found.");
      return org;
    }),
  create: authedProcedure
    .input(z.object({ name: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const { organization } = await ctx.container.tenancy.provisionOrganization({
        name: input.name,
        creator: { authUserId: ctx.user.authUserId, email: ctx.user.email, name: ctx.user.name },
      });
      return organization;
    }),
  setCurrency: authedProcedure
    .input(z.object({ organizationId: z.string(), currency: z.enum(SUPPORTED_CURRENCIES) }))
    .mutation(({ ctx, input }) =>
      ctx.container.tenancy.setWorkspaceCurrency(ctx.user.id, {
        organizationId: input.organizationId,
        currency: input.currency,
      }),
    ),
});
