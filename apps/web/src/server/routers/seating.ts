import { z } from "zod";
import { router, authedProcedure } from "../trpc";

// Boundary schema for seating-table payloads (mirrors core's `seatingTableInput`; the SeatingService
// re-parses on write). capacity is coerced from the form string to an integer in 1..64.
const seatingTableInput = z.object({
  label: z.string().trim().min(1).max(80),
  capacity: z.coerce.number().int().min(1).max(64),
});

export const seatingRouter = router({
  plan: authedProcedure
    .input(z.object({ eventId: z.string() }))
    .query(({ ctx, input }) => ctx.container.seating.plan(ctx.user.id, input)),
  createTable: authedProcedure
    .input(z.object({ eventId: z.string(), table: seatingTableInput }))
    .mutation(({ ctx, input }) =>
      ctx.container.seating.createTable(ctx.user.id, { eventId: input.eventId, table: input.table }),
    ),
  updateTable: authedProcedure
    .input(z.object({ eventId: z.string(), tableId: z.string(), patch: seatingTableInput.partial() }))
    .mutation(({ ctx, input }) =>
      ctx.container.seating.updateTable(ctx.user.id, {
        eventId: input.eventId,
        tableId: input.tableId,
        patch: input.patch,
      }),
    ),
  removeTable: authedProcedure
    .input(z.object({ eventId: z.string(), tableId: z.string() }))
    .mutation(({ ctx, input }) =>
      ctx.container.seating.removeTable(ctx.user.id, {
        eventId: input.eventId,
        tableId: input.tableId,
      }),
    ),
  assign: authedProcedure
    .input(z.object({ eventId: z.string(), tableId: z.string(), guestId: z.string() }))
    .mutation(({ ctx, input }) =>
      ctx.container.seating.assign(ctx.user.id, {
        eventId: input.eventId,
        tableId: input.tableId,
        guestId: input.guestId,
      }),
    ),
  unassign: authedProcedure
    .input(z.object({ eventId: z.string(), guestId: z.string() }))
    .mutation(({ ctx, input }) =>
      ctx.container.seating.unassign(ctx.user.id, {
        eventId: input.eventId,
        guestId: input.guestId,
      }),
    ),
});
