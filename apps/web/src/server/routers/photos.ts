import { z } from "zod";
import { router, publicProcedure, authedProcedure } from "../trpc";

export const photosRouter = router({
  // HOST gallery
  list: authedProcedure
    .input(z.object({ eventId: z.string() }))
    .query(({ ctx, input }) => ctx.container.photos.list(ctx.user.id, input)),
  remove: authedProcedure
    .input(z.object({ eventId: z.string(), photoId: z.string() }))
    .mutation(({ ctx, input }) =>
      ctx.container.photos.remove(ctx.user.id, { eventId: input.eventId, photoId: input.photoId }),
    ),
  // PUBLIC slideshow (published site)
  publicBySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(({ ctx, input }) => ctx.container.publicPhotos.listBySlug(input.slug)),
});
