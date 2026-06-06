import { z } from "zod";

const blankToNull = (v: unknown) => (typeof v === "string" && v.trim() === "" ? null : v);

// A guest may only set a *real* response — "awaiting" is the host-only/initial state.
export const rsvpResponseInput = z.object({
  rsvpStatus: z.enum(["coming", "declined", "maybe"]),
  plusOne: z.boolean().optional(),
  mealChoice: z.preprocess(blankToNull, z.string().max(80).nullish()),
});

export type RsvpResponseInput = z.infer<typeof rsvpResponseInput>;
