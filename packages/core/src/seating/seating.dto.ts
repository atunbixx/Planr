import { z } from "zod";
import type { SeatingTableWrite } from "../ports/repositories";

// capacity is coerced (the wire/form sends a string) to an integer in 1..64.
export const seatingTableInput = z.object({
  label: z.string().trim().min(1).max(80),
  capacity: z.coerce.number().int().min(1).max(64),
});

/** Caller / wire-facing shape (pre-parse): capacity may be a string or number. */
export type SeatingTableInput = z.input<typeof seatingTableInput>;
/** Parsed shape (post-parse): capacity is an integer. */
type SeatingTableParsed = z.output<typeof seatingTableInput>;

export function toSeatingTableWrite(input: SeatingTableParsed): SeatingTableWrite {
  return { label: input.label, capacity: input.capacity };
}

export function toSeatingTablePatch(input: Partial<SeatingTableParsed>): Partial<SeatingTableWrite> {
  const patch: Partial<SeatingTableWrite> = {};
  if (input.label !== undefined) patch.label = input.label;
  if (input.capacity !== undefined) patch.capacity = input.capacity;
  return patch;
}
