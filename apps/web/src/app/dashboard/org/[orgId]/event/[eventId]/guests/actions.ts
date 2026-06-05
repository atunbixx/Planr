"use server";

import { revalidatePath } from "next/cache";
import { getServerCaller } from "../../../../../../../server/caller";

export async function addGuestAction(formData: FormData) {
  const eventId = String(formData.get("eventId") ?? "");
  const orgId = String(formData.get("orgId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "");
  const groupLabel = String(formData.get("groupLabel") ?? "");
  const rsvpStatus = String(formData.get("rsvpStatus") ?? "awaiting") as
    | "awaiting"
    | "coming"
    | "declined"
    | "maybe";
  if (!eventId || !name) return;
  await (await getServerCaller()).guests.create({
    eventId,
    guest: { name, email, groupLabel, rsvpStatus },
  });
  revalidatePath(`/dashboard/org/${orgId}/event/${eventId}/guests`);
}

export async function setGuestRsvpAction(formData: FormData) {
  const eventId = String(formData.get("eventId") ?? "");
  const orgId = String(formData.get("orgId") ?? "");
  const guestId = String(formData.get("guestId") ?? "");
  const rsvpStatus = String(formData.get("rsvpStatus") ?? "awaiting") as
    | "awaiting"
    | "coming"
    | "declined"
    | "maybe";
  if (!eventId || !guestId) return;
  await (await getServerCaller()).guests.update({ eventId, guestId, patch: { rsvpStatus } });
  revalidatePath(`/dashboard/org/${orgId}/event/${eventId}/guests`);
}

export async function removeGuestAction(formData: FormData) {
  const eventId = String(formData.get("eventId") ?? "");
  const orgId = String(formData.get("orgId") ?? "");
  const guestId = String(formData.get("guestId") ?? "");
  if (!eventId || !guestId) return;
  await (await getServerCaller()).guests.remove({ eventId, guestId });
  revalidatePath(`/dashboard/org/${orgId}/event/${eventId}/guests`);
}
