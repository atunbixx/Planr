import { redirect } from "next/navigation";
import { workspaceTerms, roleHasPermission } from "@planr/core";
import { getCurrentUser } from "../../server/auth";
import { getServerCaller } from "../../server/caller";
import { createEventAction, inviteMemberAction, removeMemberAction } from "./actions";
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
  const members = await caller.collaboration.members({ organizationId: current.id });
  const me = members.find((m) => m.userId === user.id);
  const canManage = me ? roleHasPermission(me.role, "member:invite") : false;

  return (
    <main>
      <header className="wshead">
        <h1>{current.name}</h1>
        <div className="who">
          {canManage && (
            <a className="ghost" href={`/dashboard/org/${current.id}/admin`}>
              Workspace settings
            </a>
          )}
          <span>{user.email ?? "(no email)"}</span>
          <SignOutButton />
        </div>
      </header>

      {workspaces.length > 1 && (
        <nav className="switcher" aria-label="Workspaces">
          {workspaces.map((ws) => (
            <a key={ws.id} href={`/dashboard?w=${ws.id}`} aria-current={ws.id === current.id}>
              {ws.name}
            </a>
          ))}
        </nav>
      )}

      <section className="makepanel">
        <h2>{terms.newEvent}</h2>
        <form action={createEventAction}>
          <input type="hidden" name="organizationId" value={current.id} />
          <input aria-label="Event name" name="name" placeholder="Name your event…" required />
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
        {events.length === 0 ? (
          <p className="empty">Nothing planned yet — start something above.</p>
        ) : (
          <ul className="events">
            {events.map((e) => (
              <li key={e.id}>
                <a href={`/dashboard/org/${current.id}/event/${e.id}`}>
                  <span className="ename">{e.name}</span>
                  <span className="etype">{e.eventTypeKey.replace(/_/g, " ")}</span>
                </a>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2>
          {terms.members} ({members.length})
        </h2>
        <ul className="members">
          {members.map((m) => (
            <li key={m.userId}>
              <span className="mwho">{m.email ?? m.userId}</span>
              <span className="mrole">{m.role}</span>
              {canManage && m.userId !== user.id && m.role !== "owner" && (
                <form action={removeMemberAction} className="minline">
                  <input type="hidden" name="organizationId" value={current.id} />
                  <input type="hidden" name="userId" value={m.userId} />
                  <button type="submit" className="ghost">
                    Remove
                  </button>
                </form>
              )}
            </li>
          ))}
        </ul>
        {canManage && (
          <form action={inviteMemberAction} className="invite">
            <input type="hidden" name="organizationId" value={current.id} />
            <input
              aria-label="Invite email"
              name="email"
              type="email"
              placeholder="name@email.com"
              required
            />
            <select aria-label="Invite role" name="role" defaultValue="editor">
              <option value="editor">Can edit</option>
              <option value="planner">Planner</option>
              <option value="admin">Admin</option>
              <option value="viewer">View only</option>
            </select>
            <button type="submit">{terms.invite}</button>
          </form>
        )}
      </section>
    </main>
  );
}
