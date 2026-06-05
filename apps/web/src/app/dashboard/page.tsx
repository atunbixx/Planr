import { redirect } from "next/navigation";
import { workspaceTerms } from "@planr/core";
import { getCurrentUser } from "../../server/auth";
import { getServerCaller } from "../../server/caller";
import { createEventAction } from "./actions";
import { SignOutButton } from "../../components/sign-out-button";

export const dynamic = "force-dynamic";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ w?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  const caller = await getServerCaller();
  const workspaces = await caller.workspaces.list();
  if (workspaces.length === 0) redirect("/onboarding");

  const { w } = await searchParams;
  const current = workspaces.find((ws) => ws.id === w) ?? workspaces[0]!;
  const terms = workspaceTerms(current.type);
  const events = await caller.events.list({ organizationId: current.id });

  return (
    <main>
      <header>
        <h1>{current.name}</h1>
        <span>{user.email ?? "(no email)"}</span>
        <SignOutButton />
      </header>

      {workspaces.length > 1 && (
        <nav aria-label="Workspaces">
          <span>Switch: </span>
          {workspaces.map((ws) => (
            <a key={ws.id} href={`/dashboard?w=${ws.id}`} aria-current={ws.id === current.id}>
              {ws.name}{" "}
            </a>
          ))}
        </nav>
      )}

      <section>
        <h2>{terms.newEvent}</h2>
        <form action={createEventAction}>
          <input type="hidden" name="organizationId" value={current.id} />
          <input aria-label="Event name" name="name" required />
          <select aria-label="Event type" name="eventTypeKey" defaultValue="wedding">
            <option value="wedding">Wedding</option>
            <option value="birthday">Birthday</option>
            <option value="bridal_shower">Baby / bridal shower</option>
            <option value="funeral">Funeral / memorial</option>
            <option value="corporate">Party / other gathering</option>
          </select>
          <button type="submit">{terms.newEvent}</button>
        </form>
      </section>

      <section>
        <h2>
          {terms.eventsHeading} ({events.length})
        </h2>
        <ul>
          {events.map((e) => (
            <li key={e.id}>
              <a href={`/dashboard/org/${current.id}/event/${e.id}`}>
                {e.name} ({e.eventTypeKey})
              </a>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
