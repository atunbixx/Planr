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
const str = (fd: FormData, k: string) => String(fd.get(k) ?? "");

export async function addVendorAction(formData: FormData) {
  const { eventId, orgId } = paths(formData);
  const name = str(formData, "name").trim();
  if (!eventId || !name) return;
  await (await getServerCaller()).vendors.create({
    eventId,
    vendor: {
      name,
      category: str(formData, "category"),
      contactName: str(formData, "contactName"),
      contactEmail: str(formData, "contactEmail"),
      contactPhone: str(formData, "contactPhone"),
      website: str(formData, "website"),
      status: (str(formData, "status") || "researching") as Status,
      cost: str(formData, "cost"),
      deposit: str(formData, "deposit"),
      notes: str(formData, "notes"),
    },
  });
  revalidate(orgId, eventId);
}

export async function updateVendorAction(formData: FormData) {
  const { eventId, orgId } = paths(formData);
  const vendorId = str(formData, "vendorId");
  const name = str(formData, "name").trim();
  if (!eventId || !vendorId || !name) return;
  await (await getServerCaller()).vendors.update({
    eventId,
    vendorId,
    patch: {
      name,
      category: str(formData, "category"),
      contactName: str(formData, "contactName"),
      contactEmail: str(formData, "contactEmail"),
      contactPhone: str(formData, "contactPhone"),
      website: str(formData, "website"),
      status: (str(formData, "status") || "researching") as Status,
      cost: str(formData, "cost"),
      deposit: str(formData, "deposit"),
      notes: str(formData, "notes"),
    },
  });
  revalidate(orgId, eventId);
}

// Quick stage change from a card (the pipeline board).
export async function moveVendorAction(formData: FormData) {
  const { eventId, orgId } = paths(formData);
  const vendorId = str(formData, "vendorId");
  const status = str(formData, "status") as Status;
  if (!eventId || !vendorId) return;
  await (await getServerCaller()).vendors.update({ eventId, vendorId, patch: { status } });
  revalidate(orgId, eventId);
}

export async function removeVendorAction(formData: FormData) {
  const { eventId, orgId } = paths(formData);
  const vendorId = str(formData, "vendorId");
  if (!eventId || !vendorId) return;
  await (await getServerCaller()).vendors.remove({ eventId, vendorId });
  revalidate(orgId, eventId);
}
