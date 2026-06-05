import { z } from "zod";
import { router, authedProcedure } from "../trpc";

// Boundary schema for budget-item payloads (mirrors core's `budgetItemInput`; the BudgetService
// re-parses on write). Amounts are decimal STRINGS so they convert to exact pence in core.
const budgetItemInput = z.object({
  label: z.string().trim().min(1).max(160),
  category: z.string().max(80).optional(),
  estimated: z.string().max(20).optional(),
  paid: z.string().max(20).optional(),
  notes: z.string().max(2000).optional(),
});

export const budgetRouter = router({
  summary: authedProcedure
    .input(z.object({ eventId: z.string() }))
    .query(({ ctx, input }) => ctx.container.budget.summary(ctx.user.id, input)),
  list: authedProcedure
    .input(
      z.object({
        eventId: z.string(),
        limit: z.number().int().min(1).max(100).optional(),
        cursor: z.string().optional(),
      }),
    )
    .query(({ ctx, input }) => ctx.container.budget.list(ctx.user.id, input)),
  create: authedProcedure
    .input(z.object({ eventId: z.string(), item: budgetItemInput }))
    .mutation(({ ctx, input }) =>
      ctx.container.budget.create(ctx.user.id, { eventId: input.eventId, item: input.item }),
    ),
  update: authedProcedure
    .input(z.object({ eventId: z.string(), itemId: z.string(), patch: budgetItemInput.partial() }))
    .mutation(({ ctx, input }) =>
      ctx.container.budget.update(ctx.user.id, {
        eventId: input.eventId,
        itemId: input.itemId,
        patch: input.patch,
      }),
    ),
  remove: authedProcedure
    .input(z.object({ eventId: z.string(), itemId: z.string() }))
    .mutation(({ ctx, input }) =>
      ctx.container.budget.remove(ctx.user.id, { eventId: input.eventId, itemId: input.itemId }),
    ),
});
