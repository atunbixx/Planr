"use server";

import { revalidatePath } from "next/cache";
import { getServerCaller } from "../../server/caller";

export async function createOrgAction(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;
  await (await getServerCaller()).organizations.create({ name });
  revalidatePath("/dashboard");
}

export async function createEventAction(formData: FormData) {
  const organizationId = String(formData.get("organizationId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const eventTypeKey = String(formData.get("eventTypeKey") ?? "wedding") as
    | "wedding"
    | "birthday"
    | "funeral"
    | "bridal_shower"
    | "corporate";
  if (!organizationId || !name) return;
  await (await getServerCaller()).events.create({ organizationId, eventTypeKey, name });
  revalidatePath(`/dashboard/org/${organizationId}`);
  revalidatePath("/dashboard");
}
