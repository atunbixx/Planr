"use server";

import { revalidatePath } from "next/cache";
import { getServerCaller } from "../../../../../../../server/caller";

type Status = "researching" | "contacted" | "quoted" | "booked" | "declined";

function paths(formData: FormData): { eventId: string; orgId: string } {
  return {
    eventId: String(formData.get("eventId") ?? ""),
    orgId: String(formData.get("orgId") ?? ""),
  };
}
function revalidate(orgId: string, eventId: string) {
  revalidatePath(`/dashboard/org/${orgId}/event/${eventId}/vendors`);
}

export async function addVendorAction(formData: FormData) {
  const { eventId, orgId } = paths(formData);
  const name = String(formData.get("name") ?? "").trim();
  const category = String(formData.get("category") ?? "");
  const contactEmail = String(formData.get("contactEmail") ?? "");
  const status = String(formData.get("status") ?? "researching") as Status;
  const cost = String(formData.get("cost") ?? "");
  if (!eventId || !name) return;
  await (await getServerCaller()).vendors.create({
    eventId,
    vendor: { name, category, contactEmail, status, cost },
  });
  revalidate(orgId, eventId);
}

export async function updateVendorAction(formData: FormData) {
  const { eventId, orgId } = paths(formData);
  const vendorId = String(formData.get("vendorId") ?? "");
  const status = String(formData.get("status") ?? "researching") as Status;
  const cost = String(formData.get("cost") ?? "");
  if (!eventId || !vendorId) return;
  await (await getServerCaller()).vendors.update({ eventId, vendorId, patch: { status, cost } });
  revalidate(orgId, eventId);
}

export async function removeVendorAction(formData: FormData) {
  const { eventId, orgId } = paths(formData);
  const vendorId = String(formData.get("vendorId") ?? "");
  if (!eventId || !vendorId) return;
  await (await getServerCaller()).vendors.remove({ eventId, vendorId });
  revalidate(orgId, eventId);
}
