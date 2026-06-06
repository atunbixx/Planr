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
  revalidatePath(`/dashboard/org/${orgId}/event/${eventId}/messaging`);
}

export async function addAnnouncementAction(formData: FormData) {
  const { eventId, orgId } = paths(formData);
  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  if (!eventId || !title || !body) return;
  await (await getServerCaller()).messaging.create({ eventId, announcement: { title, body } });
  revalidate(orgId, eventId);
}

export async function editAnnouncementAction(formData: FormData) {
  const { eventId, orgId } = paths(formData);
  const id = String(formData.get("id") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  if (!eventId || !id || !title || !body) return;
  await (await getServerCaller()).messaging.update({ eventId, id, patch: { title, body } });
  revalidate(orgId, eventId);
}

export async function removeAnnouncementAction(formData: FormData) {
  const { eventId, orgId } = paths(formData);
  const id = String(formData.get("id") ?? "");
  if (!eventId || !id) return;
  await (await getServerCaller()).messaging.remove({ eventId, id });
  revalidate(orgId, eventId);
}
