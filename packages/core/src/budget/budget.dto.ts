import { z } from "zod";
import type { BudgetItemWrite } from "../ports/repositories";

// Money is parsed from a decimal STRING (e.g. "1500", "19.99", "1500.5") straight to integer minor
// units — never via a float multiply, so it is exact to the penny. Sub-penny precision is rejected
// (regex caps at 2 dp) rather than silently rounded; "" means "not provided".
const MAX_MAJOR = 20_000_000; // £20m cap keeps cents within Postgres Int4 range
function majorStringToCents(s: string): number {
  const [whole, frac = ""] = s.split(".");
  return Number(whole) * 100 + Number((frac + "00").slice(0, 2));
}
const optionalMoney = z
  .union([z.literal(""), z.string().regex(/^\d+(\.\d{1,2})?$/, "enter an amount like 1500 or 1500.50")])
  .optional()
  .transform((s, ctx) => {
    if (s === undefined || s === "") return undefined;
    const cents = majorStringToCents(s);
    if (cents > MAX_MAJOR * 100) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: `amount must be ≤ ${MAX_MAJOR}` });
      return z.NEVER;
    }
    return cents;
  });

// Optional, undefined-preserving, blank → null text field.
const optionalText = (max: number) =>
  z
    .string()
    .max(max)
    .nullish()
    .transform((s) => (s === undefined ? undefined : s === null || s.trim() === "" ? null : s));

export const budgetItemInput = z.object({
  label: z.string().trim().min(1).max(160),
  category: optionalText(80),
  estimated: optionalMoney,
  paid: optionalMoney,
  notes: optionalText(2000),
});

/** Caller / wire-facing shape (pre-parse): amounts are decimal strings. */
export type BudgetItemInput = z.input<typeof budgetItemInput>;
/** Parsed shape (post-parse): amounts are integer cents. Used by the write-mappers. */
type BudgetItemParsed = z.output<typeof budgetItemInput>;

/** Normalise a parsed input into a full BudgetItemWrite (optionals → null / 0). */
export function toBudgetItemWrite(input: BudgetItemParsed): BudgetItemWrite {
  return {
    label: input.label,
    category: input.category ?? null,
    estimatedCents: input.estimated ?? 0,
    paidCents: input.paid ?? 0,
    notes: input.notes ?? null,
  };
}

/** Partial patch (for updates): only the provided fields, normalised. */
export function toBudgetItemPatch(input: Partial<BudgetItemParsed>): Partial<BudgetItemWrite> {
  const patch: Partial<BudgetItemWrite> = {};
  if (input.label !== undefined) patch.label = input.label;
  if (input.category !== undefined) patch.category = input.category ?? null;
  if (input.estimated !== undefined) patch.estimatedCents = input.estimated;
  if (input.paid !== undefined) patch.paidCents = input.paid;
  if (input.notes !== undefined) patch.notes = input.notes ?? null;
  return patch;
}
