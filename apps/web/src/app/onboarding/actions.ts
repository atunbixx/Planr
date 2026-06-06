"use server";

import { redirect } from "next/navigation";
import { getServerCaller } from "../../server/caller";

export async function completeIndividualAction(formData: FormData) {
  const spaceName = String(formData.get("spaceName") ?? "").trim();
  const eventName = String(formData.get("eventName") ?? "").trim();
  const eventTypeKey = String(formData.get("eventTypeKey") ?? "wedding") as
    | "wedding"
    | "birthday"
    | "funeral"
    | "bridal_shower"
    | "corporate";
  const eventDate = String(formData.get("eventDate") ?? "");
  if (!spaceName || !eventName) return;
  const res = await (await getServerCaller()).onboarding.completeIndividual({
    spaceName,
    eventTypeKey,
    eventName,
    eventDate,
  });
  redirect(`/dashboard/org/${res.organizationId}/event/${res.eventId}`);
}

export async function completeBusinessAction(formData: FormData) {
  const businessName = String(formData.get("businessName") ?? "").trim();
  if (!businessName) return;
  await (await getServerCaller()).onboarding.completeBusiness({ businessName });
  redirect("/dashboard");
}
