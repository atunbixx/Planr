import { redirect } from "next/navigation";
import { getCurrentUser } from "../../../../../../server/auth";
import { getServerCaller } from "../../../../../../server/caller";
import { setEventDateAction } from "./actions";
import { formatMoney } from "../../../../../../lib/money";

export const dynamic = "force-dynamic";

// Modules with a real page today. Everything else shows "Coming soon".
const BUILT = new Set(["guests", "tasks", "budget", "seating", "rsvp", "messaging", "vendors"]);

const EVENT_LABEL: Record<string, string> = {
  wedding: "Your wedding",
  birthday: "Your birthday",
  funeral: "In memory",
  bridal_shower: "The celebration",
  corporate: "Your event",
};

function pretty(module: string): string {
  return module.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
function pct(part: number, whole: number): number {
  return whole <= 0 ? 0 : Math.min(100, Math.round((part / whole) * 100));
}
function prettyDate(d: Date): string {
  return new Date(d).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}
function countdown(date: Date | null): { big: string; small: string } {
  if (!date) return { big: "—", small: "no date set yet" };
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const days = Math.round((d.getTime() - today.getTime()) / 86_400_000);
  if (days === 0) return { big: "Today", small: "the big day is here 🎉" };
  if (days > 0) return { big: String(days), small: days === 1 ? "day to go" : "days to go" };
  const ago = Math.abs(days);
  return { big: String(ago), small: ago === 1 ? "day ago" : "days ago" };
}

export default async function EventDashboard({
  params,
}: {
  params: Promise<{ orgId: string; eventId: string }>;
}) {
  const { orgId, eventId } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  const caller = await getServerCaller();

  const [org, event, guests, tasks, budget, seating, modules] = await Promise.all([
    caller.organizations.get({ organizationId: orgId }),
    caller.events.get({ organizationId: orgId, eventId }),
    caller.guests.summary({ eventId }),
    caller.tasks.summary({ eventId }),
    caller.budget.summary({ eventId }),
    caller.seating.plan({ eventId }),
    caller.events.modules({ organizationId: orgId, eventId }),
  ]);
  const gbp = (cents: number) => formatMoney(cents, org.currency, { compact: true });

  const firstName = user.name?.split(" ")[0] ?? null;
  const cd = countdown(event.date);
  const base = `/dashboard/org/${orgId}/event/${eventId}`;

  const cards = [
    {
      key: "guests",
      label: "Guests",
      big: `${guests.coming}`,
      unit: `of ${guests.total} coming`,
      sub: `${guests.awaiting} awaiting · ${guests.declined} declined`,
      pct: pct(guests.coming + guests.declined + guests.maybe, guests.total),
      accent: "sage",
    },
    {
      key: "tasks",
      label: "Checklist",
      big: `${tasks.done}`,
      unit: `of ${tasks.total} done`,
      sub: tasks.overdue > 0 ? `${tasks.overdue} overdue` : `${tasks.remaining} to go`,
      warn: tasks.overdue > 0,
      pct: pct(tasks.done, tasks.total),
      accent: "gold",
    },
    {
      key: "budget",
      label: "Budget",
      big: gbp(budget.totalPaidCents),
      unit: `paid of ${gbp(budget.totalEstimatedCents)}`,
      sub: budget.remainingCents < 0 ? `${gbp(-budget.remainingCents)} over` : `${gbp(budget.remainingCents)} to go`,
      warn: budget.remainingCents < 0,
      pct: pct(budget.totalPaidCents, budget.totalEstimatedCents),
      accent: "clay",
    },
    {
      key: "seating",
      label: "Seating",
      big: `${seating.summary.assignedCount}`,
      unit: `of ${seating.summary.assignedCount + seating.summary.unassignedCount} seated`,
      sub:
        seating.summary.overCapacityTables > 0
          ? `${seating.summary.overCapacityTables} table over capacity`
          : `${seating.summary.tableCount} tables`,
      warn: seating.summary.overCapacityTables > 0,
      pct: pct(seating.summary.assignedCount, seating.summary.assignedCount + seating.summary.unassignedCount),
      accent: "sage",
    },
  ];

  return (
    <main className="dash">
      <a className="back" href={`/dashboard?w=${orgId}`}>
        ← All events
      </a>

      <section className="dashhero">
        <div className="dashhero-text">
          <p className="eyebrow">
            {firstName ? `Hi ${firstName} — ` : ""}
            {EVENT_LABEL[event.eventTypeKey] ?? "Your event"}
          </p>
          <h1>{event.name}</h1>
          {event.date ? (
            <p className="dashdate">{prettyDate(event.date)}</p>
          ) : (
            <form action={setEventDateAction} className="dashdateset ginline">
              <input type="hidden" name="organizationId" value={orgId} />
              <input type="hidden" name="eventId" value={eventId} />
              <input aria-label="Event date" name="date" type="date" required />
              <button type="submit" className="ghost">
                Set the date
              </button>
            </form>
          )}
        </div>
        <div className="countdown" data-state={event.date ? (cd.small.includes("ago") ? "past" : "future") : "none"}>
          <span className="cd-big">{cd.big}</span>
          <span className="cd-small">{cd.small}</span>
        </div>
      </section>

      <section className="statgrid">
        {cards.map((c) => (
          <a key={c.key} className="statcard" data-accent={c.accent} href={`${base}/${c.key}`}>
            <span className="stat-label">{c.label}</span>
            <span className="stat-big">
              {c.big} <span className="stat-unit">{c.unit}</span>
            </span>
            <span className={`stat-sub${c.warn ? " warn" : ""}`}>{c.sub}</span>
            <span className="stat-bar" aria-hidden="true">
              <span className="stat-bar-fill" style={{ width: `${c.pct}%` }} />
            </span>
          </a>
        ))}
      </section>

      <section className="dashtools">
        <div className="dashtools-head">
          <h2>All tools</h2>
          <a className="ghost" href={`${base}/website`}>
            Event website
          </a>
        </div>
        <ul className="modules">
          {modules.map((m) => {
            const built = BUILT.has(m.module);
            return (
              <li key={m.module} data-module={m.module} data-locked={m.locked} data-built={built}>
                {built ? (
                  <a className="mname mlink" href={`${base}/${m.module}`}>
                    {pretty(m.module)}
                  </a>
                ) : (
                  <span className="mname">{pretty(m.module)}</span>
                )}
                <span className="mstatus">{built ? "Open →" : "Coming soon"}</span>
              </li>
            );
          })}
        </ul>
      </section>
    </main>
  );
}
