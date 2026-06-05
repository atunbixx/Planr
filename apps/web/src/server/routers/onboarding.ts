import { z } from "zod";
import { router, authedProcedure } from "../trpc";

export const onboardingRouter = router({
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
});
