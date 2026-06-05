import { z } from "zod";

// A guest may only set a *real* response — "awaiting" is the host-only/initial state.
export const rsvpResponseInput = z.object({
  rsvpStatus: z.enum(["coming", "declined", "maybe"]),
  plusOne: z.boolean().optional(),
});

export type RsvpResponseInput = z.infer<typeof rsvpResponseInput>;
