"use server";

import { revalidatePath } from "next/cache";
import { getServerCaller } from "../../../server/caller";
import { container } from "../../../server/container";
import { uploadEventPhoto } from "../../../lib/storage";

export async function respondAction(formData: FormData) {
  const token = String(formData.get("token") ?? "");
  const rsvpStatus = String(formData.get("rsvpStatus") ?? "") as "coming" | "declined" | "maybe";
  const plusOne = formData.get("plusOne") === "on";
  const mealChoice = String(formData.get("mealChoice") ?? "");
  if (!token || !["coming", "declined", "maybe"].includes(rsvpStatus)) return;
  await (await getServerCaller()).rsvp.respond({
    token,
    response: { rsvpStatus, plusOne, mealChoice },
  });
  revalidatePath(`/rsvp/${token}`);
}

const MAX_BYTES = 10 * 1024 * 1024; // 10MB

export async function uploadPhotoAction(formData: FormData) {
  const token = String(formData.get("token") ?? "");
  const caption = String(formData.get("caption") ?? "").trim() || null;
  const file = formData.get("photo");
  if (!token || !(file instanceof File) || file.size === 0) return;
  if (!file.type.startsWith("image/") || file.size > MAX_BYTES) return;
  // Upload to storage server-side, then record against the guest's event (token = capability).
  const storagePath = await uploadEventPhoto(file);
  await container.publicPhotos.addByToken(token, { storagePath, caption });
  revalidatePath(`/rsvp/${token}`);
}
