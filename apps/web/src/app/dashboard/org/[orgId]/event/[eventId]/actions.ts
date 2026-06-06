"use server";

import { revalidatePath } from "next/cache";
import { getServerCaller } from "../../../../../../server/caller";

export async function setEventDateAction(formData: FormData) {
  const organizationId = String(formData.get("organizationId") ?? "");
  const eventId = String(formData.get("eventId") ?? "");
  const date = String(formData.get("date") ?? "");
  if (!organizationId || !eventId) return;
  await (await getServerCaller()).events.update({ organizationId, eventId, date });
  revalidatePath(`/dashboard/org/${organizationId}/event/${eventId}`);
}
