"use server";

import { revalidatePath } from "next/cache";
import { getServerCaller } from "../../../../../../../server/caller";

function paths(formData: FormData): { eventId: string; orgId: string } {
  return {
    eventId: String(formData.get("eventId") ?? ""),
    orgId: String(formData.get("orgId") ?? ""),
  };
}

export async function addBudgetItemAction(formData: FormData) {
  const { eventId, orgId } = paths(formData);
  const label = String(formData.get("label") ?? "").trim();
  const category = String(formData.get("category") ?? "");
  const estimated = String(formData.get("estimated") ?? "");
  const paid = String(formData.get("paid") ?? "");
  if (!eventId || !label) return;
  await (await getServerCaller()).budget.create({
    eventId,
    item: { label, category, estimated, paid },
  });
  revalidatePath(`/dashboard/org/${orgId}/event/${eventId}/budget`);
}

export async function setBudgetItemPaidAction(formData: FormData) {
  const { eventId, orgId } = paths(formData);
  const itemId = String(formData.get("itemId") ?? "");
  const paid = String(formData.get("paid") ?? "");
  if (!eventId || !itemId) return;
  await (await getServerCaller()).budget.update({ eventId, itemId, patch: { paid } });
  revalidatePath(`/dashboard/org/${orgId}/event/${eventId}/budget`);
}

export async function setBudgetItemEstimatedAction(formData: FormData) {
  const { eventId, orgId } = paths(formData);
  const itemId = String(formData.get("itemId") ?? "");
  const estimated = String(formData.get("estimated") ?? "");
  if (!eventId || !itemId) return;
  await (await getServerCaller()).budget.update({ eventId, itemId, patch: { estimated } });
  revalidatePath(`/dashboard/org/${orgId}/event/${eventId}/budget`);
}

export async function removeBudgetItemAction(formData: FormData) {
  const { eventId, orgId } = paths(formData);
  const itemId = String(formData.get("itemId") ?? "");
  if (!eventId || !itemId) return;
  await (await getServerCaller()).budget.remove({ eventId, itemId });
  revalidatePath(`/dashboard/org/${orgId}/event/${eventId}/budget`);
}
