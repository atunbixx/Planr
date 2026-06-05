import { redirect } from "next/navigation";
import { getCurrentUser } from "../../../../server/auth";
import { getServerCaller } from "../../../../server/caller";
import { createEventAction } from "../../actions";

export const dynamic = "force-dynamic";

export default async function OrgPage({ params }: { params: Promise<{ orgId: string }> }) {
  const { orgId } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  const events = await (await getServerCaller()).events.list({ organizationId: orgId });

  return (
    <main>
      <a className="back" href="/dashboard">
        ← Dashboard
      </a>
      <div className="orgbar">
        <h1>Events</h1>
        <a className="ghost orgsettings" href={`/dashboard/org/${orgId}/admin`}>
          Workspace settings
        </a>
      </div>

      <section className="makepanel">
        <h2>Create an event</h2>
        <form action={createEventAction}>
          <input type="hidden" name="organizationId" value={orgId} />
          <input aria-label="Event name" name="name" placeholder="Name your event…" required />
          <select aria-label="Event type" name="eventTypeKey" defaultValue="wedding">
            <option value="wedding">Wedding</option>
            <option value="birthday">Birthday</option>
            <option value="bridal_shower">Baby / bridal shower</option>
            <option value="funeral">Funeral / memorial</option>
            <option value="corporate">Party / other gathering</option>
          </select>
          <button type="submit">Create event</button>
        </form>
      </section>

      <section>
        <h2>Events ({events.length})</h2>
        {events.length === 0 ? (
          <p className="empty">No events here yet.</p>
        ) : (
          <ul className="events">
            {events.map((e) => (
              <li key={e.id}>
                <a href={`/dashboard/org/${orgId}/event/${e.id}`}>
                  <span className="ename">{e.name}</span>
                  <span className="etype">{e.eventTypeKey.replace(/_/g, " ")}</span>
                </a>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
