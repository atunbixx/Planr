import { redirect } from "next/navigation";
import { getCurrentUser } from "../../../../../../../server/auth";
import { getServerCaller } from "../../../../../../../server/caller";
import {
  addTableAction,
  setTableAction,
  removeTableAction,
  assignGuestAction,
  unassignGuestAction,
} from "./actions";

export const dynamic = "force-dynamic";

export default async function SeatingPage({
  params,
}: {
  params: Promise<{ orgId: string; eventId: string }>;
}) {
  const { orgId, eventId } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  const plan = await (await getServerCaller()).seating.plan({ eventId });
  const { tables, unassigned, summary } = plan;

  return (
    <main>
      <a className="back" href={`/dashboard/org/${orgId}/event/${eventId}`}>
        ← Event
      </a>
      <p className="eyebrow">Seating</p>
      <h1>Who sits where</h1>

      <p className="gsummary" data-over={summary.overCapacityTables}>
        <strong>{summary.tableCount}</strong> tables · <strong>{summary.assignedCount}</strong> seated ·{" "}
        <strong>{summary.unassignedCount}</strong> unseated · <strong>{summary.totalCapacity}</strong> seats
        {summary.overCapacityTables > 0 ? (
          <>
            {" "}
            · <strong className="seatover">{summary.overCapacityTables} over capacity</strong>
          </>
        ) : null}
      </p>

      <section className="makepanel">
        <h2>Add a table</h2>
        <form action={addTableAction}>
          <input type="hidden" name="eventId" value={eventId} />
          <input type="hidden" name="orgId" value={orgId} />
          <input aria-label="Table label" name="label" placeholder="e.g. Top table" required />
          <input
            aria-label="Table capacity"
            name="capacity"
            type="number"
            min="1"
            max="64"
            defaultValue={8}
          />
          <button type="submit">Add table</button>
        </form>
      </section>

      <div className="tablegrid">
        {tables.map((t) => (
          <section key={t.id} className="tablecard" data-table={t.id} data-over-capacity={t.overCapacity}>
            <header className="tablehead">
              <span className="tname">{t.label}</span>
              <span className="tcount">
                {t.guests.length}/{t.capacity}
              </span>
            </header>

            <ul className="seated">
              {t.guests.map((g) => (
                <li key={g.id} data-guest={g.id}>
                  <span>{g.name}</span>
                  <form action={unassignGuestAction}>
                    <input type="hidden" name="eventId" value={eventId} />
                    <input type="hidden" name="orgId" value={orgId} />
                    <input type="hidden" name="guestId" value={g.id} />
                    <button type="submit" className="ghost" aria-label={`Unseat ${g.name}`}>
                      ✕
                    </button>
                  </form>
                </li>
              ))}
              {t.guests.length === 0 ? <li className="empty">No one seated yet</li> : null}
            </ul>

            <div className="tableedit">
              <form action={setTableAction} className="ginline">
                <input type="hidden" name="eventId" value={eventId} />
                <input type="hidden" name="orgId" value={orgId} />
                <input type="hidden" name="tableId" value={t.id} />
                <input aria-label={`Rename ${t.label}`} name="label" defaultValue={t.label} />
                <input
                  aria-label={`Capacity for ${t.label}`}
                  name="capacity"
                  type="number"
                  min="1"
                  max="64"
                  defaultValue={t.capacity}
                />
                <button type="submit" className="ghost">
                  Save
                </button>
              </form>
              <form action={removeTableAction} className="ginline">
                <input type="hidden" name="eventId" value={eventId} />
                <input type="hidden" name="orgId" value={orgId} />
                <input type="hidden" name="tableId" value={t.id} />
                <button type="submit" className="ghost">
                  Delete table
                </button>
              </form>
            </div>
          </section>
        ))}
      </div>

      <section className="pool">
        <h2>Unseated guests ({unassigned.length})</h2>
        {tables.length === 0 ? (
          <p className="poolhint">Add a table first, then seat your guests.</p>
        ) : null}
        <ul className="poollist">
          {unassigned.map((g) => (
            <li key={g.id} data-unseated={g.id}>
              <span className="gname">{g.name}</span>
              <form action={assignGuestAction} className="ginline">
                <input type="hidden" name="eventId" value={eventId} />
                <input type="hidden" name="orgId" value={orgId} />
                <input type="hidden" name="guestId" value={g.id} />
                <select aria-label={`Seat ${g.name} at`} name="tableId" defaultValue="" required>
                  <option value="" disabled>
                    Seat at…
                  </option>
                  {tables.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.label}
                    </option>
                  ))}
                </select>
                <button type="submit" className="ghost" disabled={tables.length === 0}>
                  Seat
                </button>
              </form>
            </li>
          ))}
          {unassigned.length === 0 ? <li className="empty">Everyone has a seat 🎉</li> : null}
        </ul>
      </section>
    </main>
  );
}
