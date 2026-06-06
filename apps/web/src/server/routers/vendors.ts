import { z } from "zod";
import { router, authedProcedure } from "../trpc";

const vendorInput = z.object({
  name: z.string().trim().min(1).max(160),
  category: z.string().max(80).optional(),
  contactName: z.string().max(120).optional(),
  contactEmail: z.string().max(200).optional(),
  contactPhone: z.string().max(40).optional(),
  website: z.string().max(200).optional(),
  status: z.enum(["researching", "contacted", "quoted", "booked", "declined"]).optional(),
  cost: z.string().max(20).optional(),
  deposit: z.string().max(20).optional(),
  notes: z.string().max(2000).optional(),
});

export const vendorsRouter = router({
  summary: authedProcedure
    .input(z.object({ eventId: z.string() }))
    .query(({ ctx, input }) => ctx.container.vendors.summary(ctx.user.id, input)),
  list: authedProcedure
    .input(z.object({ eventId: z.string() }))
    .query(({ ctx, input }) => ctx.container.vendors.list(ctx.user.id, input)),
  create: authedProcedure
    .input(z.object({ eventId: z.string(), vendor: vendorInput }))
    .mutation(({ ctx, input }) =>
      ctx.container.vendors.create(ctx.user.id, { eventId: input.eventId, vendor: input.vendor }),
    ),
  update: authedProcedure
    .input(z.object({ eventId: z.string(), vendorId: z.string(), patch: vendorInput.partial() }))
    .mutation(({ ctx, input }) =>
      ctx.container.vendors.update(ctx.user.id, {
        eventId: input.eventId,
        vendorId: input.vendorId,
        patch: input.patch,
      }),
    ),
  remove: authedProcedure
    .input(z.object({ eventId: z.string(), vendorId: z.string() }))
    .mutation(({ ctx, input }) =>
      ctx.container.vendors.remove(ctx.user.id, { eventId: input.eventId, vendorId: input.vendorId }),
    ),
});
