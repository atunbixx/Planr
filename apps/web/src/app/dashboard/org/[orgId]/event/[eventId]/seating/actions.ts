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
  revalidatePath(`/dashboard/org/${orgId}/event/${eventId}/seating`);
}

export async function addTableAction(formData: FormData) {
  const { eventId, orgId } = paths(formData);
  const label = String(formData.get("label") ?? "").trim();
  const capacity = Number(formData.get("capacity") ?? 0);
  if (!eventId || !label) return;
  await (await getServerCaller()).seating.createTable({ eventId, table: { label, capacity } });
  revalidate(orgId, eventId);
}

export async function setTableAction(formData: FormData) {
  const { eventId, orgId } = paths(formData);
  const tableId = String(formData.get("tableId") ?? "");
  const label = String(formData.get("label") ?? "").trim();
  const capacity = Number(formData.get("capacity") ?? 0);
  if (!eventId || !tableId || !label) return;
  await (await getServerCaller()).seating.updateTable({ eventId, tableId, patch: { label, capacity } });
  revalidate(orgId, eventId);
}

export async function removeTableAction(formData: FormData) {
  const { eventId, orgId } = paths(formData);
  const tableId = String(formData.get("tableId") ?? "");
  if (!eventId || !tableId) return;
  await (await getServerCaller()).seating.removeTable({ eventId, tableId });
  revalidate(orgId, eventId);
}

export async function assignGuestAction(formData: FormData) {
  const { eventId, orgId } = paths(formData);
  const tableId = String(formData.get("tableId") ?? "");
  const guestId = String(formData.get("guestId") ?? "");
  if (!eventId || !tableId || !guestId) return;
  await (await getServerCaller()).seating.assign({ eventId, tableId, guestId });
  revalidate(orgId, eventId);
}

export async function unassignGuestAction(formData: FormData) {
  const { eventId, orgId } = paths(formData);
  const guestId = String(formData.get("guestId") ?? "");
  if (!eventId || !guestId) return;
  await (await getServerCaller()).seating.unassign({ eventId, guestId });
  revalidate(orgId, eventId);
}
