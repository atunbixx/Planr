import { z } from "zod";
import type { TaskWrite } from "../ports/repositories";

const blankToNull = (v: unknown) => (typeof v === "string" && v.trim() === "" ? null : v);

// dueDate arrives as an ISO-8601 string (or blank) from the wire; normalise to Date | null.
const dueDate = z.preprocess(
  blankToNull,
  z
    .string()
    .datetime({ offset: true })
    .or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)) // accept a bare yyyy-mm-dd (date input)
    .nullish()
    .transform((s) => (s == null ? null : new Date(s))),
);

export const taskInput = z.object({
  title: z.string().trim().min(1).max(200),
  notes: z.preprocess(blankToNull, z.string().max(2000).nullish()),
  done: z.boolean().optional(),
  dueDate,
});

export type TaskInput = z.infer<typeof taskInput>;

/** Normalise a parsed input into a full TaskWrite (optionals → null / defaults). */
export function toTaskWrite(input: TaskInput): TaskWrite {
  return {
    title: input.title,
    notes: input.notes ?? null,
    done: input.done ?? false,
    dueDate: input.dueDate ?? null,
  };
}

/** Partial patch (for updates): only the provided fields, normalised. */
export function toTaskPatch(input: Partial<TaskInput>): Partial<TaskWrite> {
  const patch: Partial<TaskWrite> = {};
  if (input.title !== undefined) patch.title = input.title;
  if (input.notes !== undefined) patch.notes = input.notes ?? null;
  if (input.done !== undefined) patch.done = input.done;
  if (input.dueDate !== undefined) patch.dueDate = input.dueDate ?? null;
  return patch;
}
