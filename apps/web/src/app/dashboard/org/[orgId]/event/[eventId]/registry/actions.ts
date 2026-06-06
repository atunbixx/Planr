"use server";

import { revalidatePath } from "next/cache";
import { getServerCaller } from "../../../../../../../server/caller";

function paths(formData: FormData): { eventId: string; orgId: string } {
  return {
    eventId: String(formData.get("eventId") ?? ""),
    orgId: String(formData.get("orgId") ?? ""),
  };
}
function revalidate(orgId: string, eventId: string) {
  revalidatePath(`/dashboard/org/${orgId}/event/${eventId}/registry`);
}

export async function addGiftAction(formData: FormData) {
  const { eventId, orgId } = paths(formData);
  const title = String(formData.get("title") ?? "").trim();
  const url = String(formData.get("url") ?? "");
  const note = String(formData.get("note") ?? "");
  const price = String(formData.get("price") ?? "");
  if (!eventId || !title) return;
  await (await getServerCaller()).registry.create({ eventId, item: { title, url, note, price } });
  revalidate(orgId, eventId);
}

export async function removeGiftAction(formData: FormData) {
  const { eventId, orgId } = paths(formData);
  const itemId = String(formData.get("itemId") ?? "");
  if (!eventId || !itemId) return;
  await (await getServerCaller()).registry.remove({ eventId, itemId });
  revalidate(orgId, eventId);
}
