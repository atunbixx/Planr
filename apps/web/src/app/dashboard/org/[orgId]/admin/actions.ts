"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getServerCaller } from "../../../../../server/caller";

function adminPath(orgId: string) {
  return `/dashboard/org/${orgId}/admin`;
}

export async function setCurrencyAction(formData: FormData) {
  const organizationId = String(formData.get("organizationId") ?? "");
  const currency = String(formData.get("currency") ?? "") as
    | "GBP"
    | "USD"
    | "EUR"
    | "AUD"
    | "CAD"
    | "NZD"
    | "ZAR"
    | "AED";
  if (!organizationId || !currency) return;
  await (await getServerCaller()).organizations.setCurrency({ organizationId, currency });
  revalidatePath(adminPath(organizationId));
}

export async function renameWorkspaceAction(formData: FormData) {
  const organizationId = String(formData.get("organizationId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  if (!organizationId || !name) return;
  await (await getServerCaller()).admin.rename({ organizationId, name });
  revalidatePath(adminPath(organizationId));
}

export async function deleteWorkspaceAction(formData: FormData) {
  const organizationId = String(formData.get("organizationId") ?? "");
  const confirm = String(formData.get("confirm") ?? "");
  const expectedName = String(formData.get("expectedName") ?? "");
  if (!organizationId || confirm !== expectedName) return; // type-to-confirm guard (UX)
  await (await getServerCaller()).admin.deleteWorkspace({ organizationId });
  redirect("/dashboard");
}

export async function setRoleAction(formData: FormData) {
  const organizationId = String(formData.get("organizationId") ?? "");
  const userId = String(formData.get("userId") ?? "");
  const role = String(formData.get("role") ?? "") as "admin" | "planner" | "editor" | "viewer";
  if (!organizationId || !userId) return;
  await (await getServerCaller()).collaboration.setMemberRole({ organizationId, userId, role });
  revalidatePath(adminPath(organizationId));
}

export async function removeMemberAction(formData: FormData) {
  const organizationId = String(formData.get("organizationId") ?? "");
  const userId = String(formData.get("userId") ?? "");
  if (!organizationId || !userId) return;
  await (await getServerCaller()).collaboration.removeMember({ organizationId, userId });
  revalidatePath(adminPath(organizationId));
}

export async function inviteAction(formData: FormData) {
  const organizationId = String(formData.get("organizationId") ?? "");
  const email = String(formData.get("email") ?? "").trim();
  const role = String(formData.get("role") ?? "viewer") as "admin" | "planner" | "editor" | "viewer";
  if (!organizationId || !email) return;
  await (await getServerCaller()).collaboration.invite({ organizationId, email, role });
  revalidatePath(adminPath(organizationId));
}

export async function revokeInviteAction(formData: FormData) {
  const organizationId = String(formData.get("organizationId") ?? "");
  const invitationId = String(formData.get("invitationId") ?? "");
  if (!organizationId || !invitationId) return;
  await (await getServerCaller()).collaboration.revokeInvitation({ organizationId, invitationId });
  revalidatePath(adminPath(organizationId));
}
