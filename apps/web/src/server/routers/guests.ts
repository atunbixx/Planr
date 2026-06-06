import { z } from "zod";
import { router, authedProcedure } from "../trpc";

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
  mealChoice: z.string().max(80).optional(),
  notes: z.string().max(2000).optional(),
});

export const guestsRouter = router({
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
    .input(z.object({ eventId: z.string(), guestId: z.string(), patch: guestInput.partial() }))
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
      ctx.container.guests.remove(ctx.user.id, { eventId: input.eventId, guestId: input.guestId }),
    ),
});
