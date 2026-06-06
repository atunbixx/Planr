import { redirect } from "next/navigation";
import { getCurrentUser } from "../../../../../../../server/auth";
import { getServerCaller } from "../../../../../../../server/caller";
import { addGuestAction, setGuestRsvpAction, removeGuestAction } from "./actions";
import { MEAL_OPTIONS } from "../../../../../../../lib/meals";

export const dynamic = "force-dynamic";

const RSVP_OPTIONS = [
  { value: "awaiting", label: "Awaiting" },
  { value: "coming", label: "Coming" },
  { value: "declined", label: "Declined" },
  { value: "maybe", label: "Maybe" },
] as const;

export default async function GuestsPage({
  params,
}: {
  params: Promise<{ orgId: string; eventId: string }>;
}) {
  const { orgId, eventId } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  const caller = await getServerCaller();
  const summary = await caller.guests.summary({ eventId });
  const { guests } = await caller.guests.list({ eventId, limit: 100 });

  return (
    <main>
      <a className="back" href={`/dashboard/org/${orgId}/event/${eventId}`}>
        ← Event
      </a>
      <p className="eyebrow">Guest list</p>
      <h1>Who&apos;s invited</h1>

      <p className="gsummary">
        <strong>{summary.total}</strong> guests · <strong>{summary.coming}</strong> coming ·{" "}
        <strong>{summary.declined}</strong> declined · <strong>{summary.maybe}</strong> maybe ·{" "}
        <strong>{summary.awaiting}</strong> awaiting
      </p>

      <section className="makepanel">
        <h2>Add a guest</h2>
        <form action={addGuestAction}>
          <input type="hidden" name="eventId" value={eventId} />
          <input type="hidden" name="orgId" value={orgId} />
          <input aria-label="Guest name" name="name" placeholder="Full name" required />
          <input aria-label="Guest email" name="email" type="email" placeholder="email (optional)" />
          <input aria-label="Guest group" name="groupLabel" placeholder="group (optional)" />
          <input aria-label="Guest meal" name="mealChoice" placeholder="meal (optional)" list="meal-options" />
          <select aria-label="Guest RSVP" name="rsvpStatus" defaultValue="awaiting">
            {RSVP_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <button type="submit">Add guest</button>
        </form>
      </section>

      <datalist id="meal-options">
        {MEAL_OPTIONS.map((m) => (
          <option key={m} value={m} />
        ))}
      </datalist>

      <ul className="guests">
        {guests.map((g) => (
          <li key={g.id} data-guest={g.id} data-rsvp={g.rsvpStatus}>
            <span className="gname">{g.name}</span>
            <span className="gmeta">
              {g.groupLabel ?? g.email ?? ""}
              {g.mealChoice ? <span className="gmeal">{g.mealChoice}</span> : null}
            </span>
            <form action={setGuestRsvpAction} className="ginline">
              <input type="hidden" name="eventId" value={eventId} />
              <input type="hidden" name="orgId" value={orgId} />
              <input type="hidden" name="guestId" value={g.id} />
              <select aria-label={`RSVP for ${g.name}`} name="rsvpStatus" defaultValue={g.rsvpStatus}>
                {RSVP_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              <button type="submit" className="ghost">
                Save
              </button>
            </form>
            <form action={removeGuestAction} className="ginline">
              <input type="hidden" name="eventId" value={eventId} />
              <input type="hidden" name="orgId" value={orgId} />
              <input type="hidden" name="guestId" value={g.id} />
              <button type="submit" className="ghost">
                Remove
              </button>
            </form>
          </li>
        ))}
      </ul>
    </main>
  );
}
