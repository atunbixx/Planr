import { redirect } from "next/navigation";
import { getCurrentUser } from "../../../../../../../server/auth";
import { getServerCaller } from "../../../../../../../server/caller";
import {
  addTaskAction,
  setTaskDoneAction,
  setTaskDueAction,
  removeTaskAction,
} from "./actions";

export const dynamic = "force-dynamic";

function toDateInput(d: Date | null): string {
  return d ? d.toISOString().slice(0, 10) : "";
}
function prettyDue(d: Date | null): string {
  return d ? d.toISOString().slice(0, 10) : "No due date";
}

export default async function TasksPage({
  params,
}: {
  params: Promise<{ orgId: string; eventId: string }>;
}) {
  const { orgId, eventId } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  const caller = await getServerCaller();
  const summary = await caller.tasks.summary({ eventId });
  const { tasks } = await caller.tasks.list({ eventId, limit: 100 });
  const now = Date.now();

  return (
    <main>
      <a className="back" href={`/dashboard/org/${orgId}/event/${eventId}`}>
        ← Event
      </a>
      <p className="eyebrow">Checklist</p>
      <h1>What&apos;s left to do</h1>

      <p className="gsummary">
        <strong>{summary.total}</strong> tasks · <strong>{summary.done}</strong> done ·{" "}
        <strong>{summary.remaining}</strong> to go · <strong>{summary.overdue}</strong> overdue
      </p>

      <section className="makepanel">
        <h2>Add a task</h2>
        <form action={addTaskAction}>
          <input type="hidden" name="eventId" value={eventId} />
          <input type="hidden" name="orgId" value={orgId} />
          <input aria-label="Task title" name="title" placeholder="e.g. Book the caterer" required />
          <input aria-label="Task due date" name="dueDate" type="date" />
          <button type="submit">Add task</button>
        </form>
      </section>

      <ul className="tasks">
        {tasks.map((t) => {
          const overdue = !t.done && t.dueDate != null && t.dueDate.getTime() < now;
          return (
            <li key={t.id} data-task={t.id} data-done={t.done} data-overdue={overdue}>
              <form action={setTaskDoneAction} className="ginline tcheck">
                <input type="hidden" name="eventId" value={eventId} />
                <input type="hidden" name="orgId" value={orgId} />
                <input type="hidden" name="taskId" value={t.id} />
                <input type="hidden" name="done" value={t.done ? "false" : "true"} />
                <button
                  type="submit"
                  className="ghost"
                  aria-label={t.done ? `Reopen ${t.title}` : `Mark ${t.title} done`}
                >
                  {t.done ? "↺ Reopen" : "✓ Done"}
                </button>
              </form>
              <span className="tname">{t.title}</span>
              <span className="tmeta">{prettyDue(t.dueDate)}</span>
              <form action={setTaskDueAction} className="ginline">
                <input type="hidden" name="eventId" value={eventId} />
                <input type="hidden" name="orgId" value={orgId} />
                <input type="hidden" name="taskId" value={t.id} />
                <input
                  aria-label={`Due date for ${t.title}`}
                  name="dueDate"
                  type="date"
                  defaultValue={toDateInput(t.dueDate)}
                />
                <button type="submit" className="ghost">
                  Save
                </button>
              </form>
              <form action={removeTaskAction} className="ginline">
                <input type="hidden" name="eventId" value={eventId} />
                <input type="hidden" name="orgId" value={orgId} />
                <input type="hidden" name="taskId" value={t.id} />
                <button type="submit" className="ghost">
                  Remove
                </button>
              </form>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
