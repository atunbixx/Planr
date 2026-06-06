import { z } from "zod";
import { router, publicProcedure, authedProcedure } from "../trpc";

// Public response payload (mirrors core's `rsvpResponseInput`; the service re-parses). A guest may only
// set a real response — "awaiting" is intentionally absent.
const rsvpResponseInput = z.object({
  rsvpStatus: z.enum(["coming", "declined", "maybe"]),
  plusOne: z.boolean().optional(),
  mealChoice: z.string().max(80).optional(),
});

export const rsvpRouter = router({
  // PUBLIC — no auth. The token is the capability; the service returns a minimal leak-free view.
  get: publicProcedure
    .input(z.object({ token: z.string() }))
    .query(({ ctx, input }) => ctx.container.publicRsvp.get(input.token)),
  respond: publicProcedure
    .input(z.object({ token: z.string(), response: rsvpResponseInput }))
    .mutation(({ ctx, input }) => ctx.container.publicRsvp.respond(input.token, input.response)),

  // HOST — authed + gated "rsvp".
  overview: authedProcedure
    .input(z.object({ eventId: z.string() }))
    .query(({ ctx, input }) => ctx.container.rsvp.overview(ctx.user.id, input)),
});
