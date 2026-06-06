import { z } from "zod";
import type { TaskWrite } from "../ports/repositories";

// dueDate arrives as an ISO-8601 string, a bare yyyy-mm-dd (HTML date input), "" or null on the wire.
// Input type: optional string | null. Output type: Date | null.
// Transforms preserve `undefined` (field absent → leave undefined so partial patches skip it) and
// only coerce explicit blank/null → null. Create-time nulling of absent fields is the mappers' job.
const dueDate = z
  .union([
    z.string().datetime({ offset: true }),
    z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    z.literal(""),
    z.null(),
  ])
  .optional()
  .transform((s) => (s === undefined ? undefined : s === null || s === "" ? null : new Date(s)));

export const taskInput = z.object({
  title: z.string().trim().min(1).max(200),
  notes: z
    .string()
    .max(2000)
    .nullish()
    .transform((s) => (s === undefined ? undefined : s === null || s.trim() === "" ? null : s)),
  done: z.boolean().optional(),
  dueDate,
});

/** Caller / wire-facing shape (pre-parse): dueDate is an optional string. */
export type TaskInput = z.input<typeof taskInput>;
/** Parsed shape (post-parse): dueDate is a Date | null. Used by the write-mappers. */
type TaskParsed = z.output<typeof taskInput>;

/** Normalise a parsed input into a full TaskWrite (optionals → null / defaults). */
export function toTaskWrite(input: TaskParsed): TaskWrite {
  return {
    title: input.title,
    notes: input.notes ?? null,
    done: input.done ?? false,
    dueDate: input.dueDate ?? null,
  };
}

/** Partial patch (for updates): only the provided fields, normalised. */
export function toTaskPatch(input: Partial<TaskParsed>): Partial<TaskWrite> {
  const patch: Partial<TaskWrite> = {};
  if (input.title !== undefined) patch.title = input.title;
  if (input.notes !== undefined) patch.notes = input.notes ?? null;
  if (input.done !== undefined) patch.done = input.done;
  if (input.dueDate !== undefined) patch.dueDate = input.dueDate ?? null;
  return patch;
}
