import { z } from "zod";
import type { GuestWrite } from "../ports/repositories";

const blankToNull = (v: unknown) => (typeof v === "string" && v.trim() === "" ? null : v);

export const guestInput = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.preprocess(blankToNull, z.string().email().max(200).nullish()),
  phone: z.preprocess(blankToNull, z.string().max(40).nullish()),
  groupLabel: z.preprocess(blankToNull, z.string().max(80).nullish()),
  plusOne: z.boolean().optional(),
  rsvpStatus: z.enum(["awaiting", "coming", "declined", "maybe"]).optional(),
  mealChoice: z.preprocess(blankToNull, z.string().max(80).nullish()),
  notes: z.preprocess(blankToNull, z.string().max(2000).nullish()),
});

export type GuestInput = z.infer<typeof guestInput>;

/** Normalise a parsed input into a full GuestWrite (optionals → null / defaults). */
export function toGuestWrite(input: GuestInput): GuestWrite {
  return {
    name: input.name,
    email: input.email ?? null,
    phone: input.phone ?? null,
    groupLabel: input.groupLabel ?? null,
    plusOne: input.plusOne ?? false,
    rsvpStatus: input.rsvpStatus ?? "awaiting",
    mealChoice: input.mealChoice ?? null,
    notes: input.notes ?? null,
  };
}

/** Partial patch (for updates): only the provided fields, normalised. */
export function toGuestPatch(input: Partial<GuestInput>): Partial<GuestWrite> {
  const patch: Partial<GuestWrite> = {};
  if (input.name !== undefined) patch.name = input.name;
  if (input.email !== undefined) patch.email = input.email ?? null;
  if (input.phone !== undefined) patch.phone = input.phone ?? null;
  if (input.groupLabel !== undefined) patch.groupLabel = input.groupLabel ?? null;
  if (input.plusOne !== undefined) patch.plusOne = input.plusOne;
  if (input.rsvpStatus !== undefined) patch.rsvpStatus = input.rsvpStatus;
  if (input.mealChoice !== undefined) patch.mealChoice = input.mealChoice ?? null;
  if (input.notes !== undefined) patch.notes = input.notes ?? null;
  return patch;
}
