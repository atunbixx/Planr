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
      <p>
        <a href="/dashboard">← Dashboard</a>
      </p>
      <h1>Events</h1>

      <section>
        <h2>Create an event</h2>
        <form action={createEventAction}>
          <input type="hidden" name="organizationId" value={orgId} />
          <input aria-label="Event name" name="name" required />
          <select aria-label="Event type" name="eventTypeKey" defaultValue="wedding">
            <option value="wedding">Wedding</option>
            <option value="birthday">Birthday</option>
            <option value="funeral">Funeral</option>
            <option value="bridal_shower">Bridal shower</option>
            <option value="corporate">Corporate</option>
          </select>
          <button type="submit">Create event</button>
        </form>
      </section>

      <section>
        <h2>Events ({events.length})</h2>
        <ul>
          {events.map((e) => (
            <li key={e.id}>
              <a href={`/dashboard/org/${orgId}/event/${e.id}`}>
                {e.name} ({e.eventTypeKey})
              </a>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
