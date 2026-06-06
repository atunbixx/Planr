"use server";

import { revalidatePath } from "next/cache";
import { getServerCaller } from "../../../../../../../server/caller";

export async function removePhotoAction(formData: FormData) {
  const eventId = String(formData.get("eventId") ?? "");
  const orgId = String(formData.get("orgId") ?? "");
  const photoId = String(formData.get("photoId") ?? "");
  if (!eventId || !photoId) return;
  await (await getServerCaller()).photos.remove({ eventId, photoId });
  revalidatePath(`/dashboard/org/${orgId}/event/${eventId}/photos`);
}
