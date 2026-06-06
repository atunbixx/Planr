"use server";

import { revalidatePath } from "next/cache";
import { getServerCaller } from "../../../server/caller";

// A guest contributes to a cash fund from the public event site. Token-free:
// the slug + a valid cash-fund item id are the capability.
export async function contributeAction(formData: FormData) {
  const slug = String(formData.get("slug") ?? "");
  const itemId = String(formData.get("itemId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const amount = String(formData.get("amount") ?? "").trim();
  const message = String(formData.get("message") ?? "");
  if (!slug || !itemId || !name || !amount) return;
  await (await getServerCaller()).registry.contribute({
    slug,
    itemId,
    contribution: { name, amount, message },
  });
  revalidatePath(`/e/${slug}`);
}
