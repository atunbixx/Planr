import { z } from "zod";
import type { VendorWrite } from "../ports/repositories";

const optionalText = (max: number) =>
  z
    .string()
    .max(max)
    .nullish()
    .transform((s) => (s === undefined ? undefined : s === null || s.trim() === "" ? null : s));

// Cost parsed from a decimal string straight to integer minor units (exact; see budget.dto).
function majorStringToCents(s: string): number {
  const [whole, frac = ""] = s.split(".");
  return Number(whole) * 100 + Number((frac + "00").slice(0, 2));
}
const optionalCost = z
  .union([z.literal(""), z.string().regex(/^\d+(\.\d{1,2})?$/, "enter an amount like 1500 or 1500.50")])
  .optional()
  .transform((s) => (s === undefined || s === "" ? undefined : majorStringToCents(s)));

export const vendorInput = z.object({
  name: z.string().trim().min(1).max(160),
  category: optionalText(80),
  contactName: optionalText(120),
  contactEmail: optionalText(200),
  contactPhone: optionalText(40),
  website: optionalText(200),
  status: z.enum(["researching", "contacted", "quoted", "booked", "declined"]).optional(),
  cost: optionalCost,
  deposit: optionalCost,
  notes: optionalText(2000),
});

export type VendorInput = z.input<typeof vendorInput>;
type VendorParsed = z.output<typeof vendorInput>;

export function toVendorWrite(input: VendorParsed): VendorWrite {
  return {
    name: input.name,
    category: input.category ?? null,
    contactName: input.contactName ?? null,
    contactEmail: input.contactEmail ?? null,
    contactPhone: input.contactPhone ?? null,
    website: input.website ?? null,
    status: input.status ?? "researching",
    costCents: input.cost ?? 0,
    depositPaidCents: input.deposit ?? 0,
    notes: input.notes ?? null,
  };
}

export function toVendorPatch(input: Partial<VendorParsed>): Partial<VendorWrite> {
  const p: Partial<VendorWrite> = {};
  if (input.name !== undefined) p.name = input.name;
  if (input.category !== undefined) p.category = input.category ?? null;
  if (input.contactName !== undefined) p.contactName = input.contactName ?? null;
  if (input.contactEmail !== undefined) p.contactEmail = input.contactEmail ?? null;
  if (input.contactPhone !== undefined) p.contactPhone = input.contactPhone ?? null;
  if (input.website !== undefined) p.website = input.website ?? null;
  if (input.status !== undefined) p.status = input.status;
  if (input.cost !== undefined) p.costCents = input.cost;
  if (input.deposit !== undefined) p.depositPaidCents = input.deposit;
  if (input.notes !== undefined) p.notes = input.notes ?? null;
  return p;
}
