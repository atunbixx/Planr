"use server";

import { revalidatePath } from "next/cache";
import { getServerCaller } from "../../server/caller";

export async function createEventAction(formData: FormData) {
  const organizationId = String(formData.get("organizationId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const eventTypeKey = String(formData.get("eventTypeKey") ?? "wedding") as
    | "wedding"
    | "birthday"
    | "funeral"
    | "bridal_shower"
    | "corporate";
  const date = String(formData.get("date") ?? "");
  if (!organizationId || !name) return;
  await (await getServerCaller()).events.create({ organizationId, eventTypeKey, name, date });
  revalidatePath(`/dashboard/org/${organizationId}`);
  revalidatePath("/dashboard");
}

export async function inviteMemberAction(formData: FormData) {
  const organizationId = String(formData.get("organizationId") ?? "");
  const email = String(formData.get("email") ?? "").trim();
  const role = String(formData.get("role") ?? "editor") as
    | "admin"
    | "planner"
    | "editor"
    | "viewer";
  if (!organizationId || !email) return;
  await (await getServerCaller()).collaboration.invite({ organizationId, email, role });
  revalidatePath("/dashboard");
}

export async function removeMemberAction(formData: FormData) {
  const organizationId = String(formData.get("organizationId") ?? "");
  const userId = String(formData.get("userId") ?? "");
  if (!organizationId || !userId) return;
  await (await getServerCaller()).collaboration.removeMember({ organizationId, userId });
  revalidatePath("/dashboard");
}
