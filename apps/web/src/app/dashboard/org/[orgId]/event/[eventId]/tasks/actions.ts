"use server";

import { revalidatePath } from "next/cache";
import { getServerCaller } from "../../../../../../../server/caller";

function paths(formData: FormData): { eventId: string; orgId: string } {
  return {
    eventId: String(formData.get("eventId") ?? ""),
    orgId: String(formData.get("orgId") ?? ""),
  };
}

export async function addTaskAction(formData: FormData) {
  const { eventId, orgId } = paths(formData);
  const title = String(formData.get("title") ?? "").trim();
  const dueDate = String(formData.get("dueDate") ?? "");
  if (!eventId || !title) return;
  await (await getServerCaller()).tasks.create({ eventId, task: { title, dueDate } });
  revalidatePath(`/dashboard/org/${orgId}/event/${eventId}/tasks`);
}

export async function setTaskDoneAction(formData: FormData) {
  const { eventId, orgId } = paths(formData);
  const taskId = String(formData.get("taskId") ?? "");
  const done = String(formData.get("done") ?? "") === "true";
  if (!eventId || !taskId) return;
  await (await getServerCaller()).tasks.update({ eventId, taskId, patch: { done } });
  revalidatePath(`/dashboard/org/${orgId}/event/${eventId}/tasks`);
}

export async function setTaskDueAction(formData: FormData) {
  const { eventId, orgId } = paths(formData);
  const taskId = String(formData.get("taskId") ?? "");
  const dueDate = String(formData.get("dueDate") ?? "");
  if (!eventId || !taskId) return;
  await (await getServerCaller()).tasks.update({ eventId, taskId, patch: { dueDate } });
  revalidatePath(`/dashboard/org/${orgId}/event/${eventId}/tasks`);
}

export async function removeTaskAction(formData: FormData) {
  const { eventId, orgId } = paths(formData);
  const taskId = String(formData.get("taskId") ?? "");
  if (!eventId || !taskId) return;
  await (await getServerCaller()).tasks.remove({ eventId, taskId });
  revalidatePath(`/dashboard/org/${orgId}/event/${eventId}/tasks`);
}
