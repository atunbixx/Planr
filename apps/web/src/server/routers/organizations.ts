import { z } from "zod";
import { router, authedProcedure } from "../trpc";

export const organizationsRouter = router({
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
});
