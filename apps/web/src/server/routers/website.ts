import { z } from "zod";
import { router, publicProcedure, authedProcedure } from "../trpc";

const text = z.string().max(8000).nullish();

export const websiteRouter = router({
  // HOST — authed (content:edit inside the service). Get-or-create the editable draft.
  editor: authedProcedure
    .input(z.object({ eventId: z.string() }))
    .query(({ ctx, input }) => ctx.container.website.editor(ctx.user.id, input)),
  update: authedProcedure
    .input(
      z.object({
        eventId: z.string(),
        patch: z.object({
          published: z.boolean().optional(),
          theme: z.enum(["classic", "modern", "romantic"]).optional(),
          headline: text,
          welcomeMessage: text,
          story: text,
          scheduleText: text,
          travelText: text,
        }),
      }),
    )
    .mutation(({ ctx, input }) =>
      ctx.container.website.update(ctx.user.id, { eventId: input.eventId, patch: input.patch }),
    ),

  // PUBLIC — no auth. Returns null unless the site is published.
  getPublic: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(({ ctx, input }) => ctx.container.publicWebsite.getBySlug(input.slug)),
});
