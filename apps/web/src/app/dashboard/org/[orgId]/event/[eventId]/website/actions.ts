"use server";

import { revalidatePath } from "next/cache";
import { getServerCaller } from "../../../../../../../server/caller";

const clean = (v: FormDataEntryValue | null) => {
  const s = String(v ?? "").trim();
  return s === "" ? null : s;
};

export async function saveWebsiteAction(formData: FormData) {
  const eventId = String(formData.get("eventId") ?? "");
  const orgId = String(formData.get("orgId") ?? "");
  const theme = String(formData.get("theme") ?? "classic") as "classic" | "modern" | "romantic";
  if (!eventId) return;
  await (await getServerCaller()).website.update({
    eventId,
    patch: {
      theme,
      published: formData.get("published") === "on",
      headline: clean(formData.get("headline")),
      welcomeMessage: clean(formData.get("welcomeMessage")),
      story: clean(formData.get("story")),
      scheduleText: clean(formData.get("scheduleText")),
      travelText: clean(formData.get("travelText")),
    },
  });
  revalidatePath(`/dashboard/org/${orgId}/event/${eventId}/website`);
}
