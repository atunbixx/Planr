import { z } from "zod";
import { router, publicProcedure, authedProcedure } from "../trpc";

const registryItemInput = z.object({
  title: z.string().trim().min(1).max(160),
  url: z.string().max(500).optional(),
  note: z.string().max(2000).optional(),
  price: z.string().max(20).optional(),
});

export const registryRouter = router({
  list: authedProcedure
    .input(z.object({ eventId: z.string() }))
    .query(({ ctx, input }) => ctx.container.registry.list(ctx.user.id, input)),
  create: authedProcedure
    .input(z.object({ eventId: z.string(), item: registryItemInput }))
    .mutation(({ ctx, input }) =>
      ctx.container.registry.create(ctx.user.id, { eventId: input.eventId, item: input.item }),
    ),
  update: authedProcedure
    .input(z.object({ eventId: z.string(), itemId: z.string(), patch: registryItemInput.partial() }))
    .mutation(({ ctx, input }) =>
      ctx.container.registry.update(ctx.user.id, {
        eventId: input.eventId,
        itemId: input.itemId,
        patch: input.patch,
      }),
    ),
  remove: authedProcedure
    .input(z.object({ eventId: z.string(), itemId: z.string() }))
    .mutation(({ ctx, input }) =>
      ctx.container.registry.remove(ctx.user.id, { eventId: input.eventId, itemId: input.itemId }),
    ),
  // PUBLIC — gifts for a published event site.
  publicForSlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(({ ctx, input }) => ctx.container.publicRegistry.forSlug(input.slug)),
});
