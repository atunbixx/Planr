import { z } from "zod";
import { router, publicProcedure, authedProcedure } from "../trpc";

// Boundary schema for announcement payloads (mirrors core's `announcementInput`; the service re-parses).
const announcementInput = z.object({
  title: z.string().trim().min(1).max(120),
  body: z.string().trim().min(1).max(4000),
});

export const messagingRouter = router({
  // HOST — authed + gated "messaging".
  list: authedProcedure
    .input(z.object({ eventId: z.string() }))
    .query(({ ctx, input }) => ctx.container.messaging.list(ctx.user.id, input)),
  create: authedProcedure
    .input(z.object({ eventId: z.string(), announcement: announcementInput }))
    .mutation(({ ctx, input }) =>
      ctx.container.messaging.create(ctx.user.id, {
        eventId: input.eventId,
        announcement: input.announcement,
      }),
    ),
  update: authedProcedure
    .input(z.object({ eventId: z.string(), id: z.string(), patch: announcementInput.partial() }))
    .mutation(({ ctx, input }) =>
      ctx.container.messaging.update(ctx.user.id, {
        eventId: input.eventId,
        id: input.id,
        patch: input.patch,
      }),
    ),
  remove: authedProcedure
    .input(z.object({ eventId: z.string(), id: z.string() }))
    .mutation(({ ctx, input }) =>
      ctx.container.messaging.remove(ctx.user.id, { eventId: input.eventId, id: input.id }),
    ),

  // PUBLIC — no auth. Announcements for the guest behind the token (safe fields, [] if invalid).
  publicForToken: publicProcedure
    .input(z.object({ token: z.string() }))
    .query(({ ctx, input }) => ctx.container.publicMessaging.forToken(input.token)),
});
