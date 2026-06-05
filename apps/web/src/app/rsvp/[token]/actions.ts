"use server";

import { revalidatePath } from "next/cache";
import { getServerCaller } from "../../../server/caller";

export async function respondAction(formData: FormData) {
  const token = String(formData.get("token") ?? "");
  const rsvpStatus = String(formData.get("rsvpStatus") ?? "") as "coming" | "declined" | "maybe";
  const plusOne = formData.get("plusOne") === "on";
  if (!token || !["coming", "declined", "maybe"].includes(rsvpStatus)) return;
  await (await getServerCaller()).rsvp.respond({ token, response: { rsvpStatus, plusOne } });
  revalidatePath(`/rsvp/${token}`);
}
