import { z } from "zod";
import type { RegistryItemWrite } from "../ports/repositories";

const optionalText = (max: number) =>
  z
    .string()
    .max(max)
    .nullish()
    .transform((s) => (s === undefined ? undefined : s === null || s.trim() === "" ? null : s));

function majorStringToCents(s: string): number {
  const [whole, frac = ""] = s.split(".");
  return Number(whole) * 100 + Number((frac + "00").slice(0, 2));
}
const optionalPrice = z
  .union([z.literal(""), z.string().regex(/^\d+(\.\d{1,2})?$/, "enter an amount like 50 or 49.99")])
  .optional()
  .transform((s) => (s === undefined || s === "" ? undefined : majorStringToCents(s)));

export const registryItemInput = z.object({
  title: z.string().trim().min(1).max(160),
  url: optionalText(500),
  note: optionalText(2000),
  price: optionalPrice,
});

export type RegistryItemInput = z.input<typeof registryItemInput>;
type Parsed = z.output<typeof registryItemInput>;

export function toRegistryItemWrite(input: Parsed): RegistryItemWrite {
  return {
    title: input.title,
    url: input.url ?? null,
    note: input.note ?? null,
    priceCents: input.price ?? 0,
  };
}

export function toRegistryItemPatch(input: Partial<Parsed>): Partial<RegistryItemWrite> {
  const p: Partial<RegistryItemWrite> = {};
  if (input.title !== undefined) p.title = input.title;
  if (input.url !== undefined) p.url = input.url ?? null;
  if (input.note !== undefined) p.note = input.note ?? null;
  if (input.price !== undefined) p.priceCents = input.price;
  return p;
}
