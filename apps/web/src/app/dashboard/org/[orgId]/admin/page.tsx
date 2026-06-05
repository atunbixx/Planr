import { redirect } from "next/navigation";
import { getCurrentUser } from "../../../../../server/auth";
import { getServerCaller } from "../../../../../server/caller";
import {
  renameWorkspaceAction,
  deleteWorkspaceAction,
  setRoleAction,
  removeMemberAction,
  inviteAction,
  revokeInviteAction,
} from "./actions";

export const dynamic = "force-dynamic";

const ROLES = ["admin", "planner", "editor", "viewer"] as const;

export default async function AdminPage({
  params,
}: {
  params: Promise<{ orgId: string }>;
}) {
  const { orgId } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  // The console is owner/admin-only; settings() throws FORBIDDEN otherwise → bounce to the org page.
  let settings;
  try {
    settings = await (await getServerCaller()).admin.settings({ organizationId: orgId });
  } catch {
    redirect(`/dashboard/org/${orgId}`);
  }
  const { organization, members, pendingInvitations } = settings;

  return (
    <main>
      <a className="back" href={`/dashboard/org/${orgId}`}>
        ← Events
      </a>
      <p className="eyebrow">Workspace settings</p>
      <h1>{organization.name}</h1>

      <section className="makepanel">
        <h2>Rename workspace</h2>
        <form action={renameWorkspaceAction}>
          <input type="hidden" name="organizationId" value={orgId} />
          <input aria-label="Workspace name" name="name" defaultValue={organization.name} required />
          <button type="submit">Save</button>
        </form>
      </section>

      <section className="adminsec">
        <h2>Members ({members.length})</h2>
        <ul className="memberlist">
          {members.map((m) => {
            const isSelf = m.userId === user.id;
            const isOwner = m.role === "owner";
            return (
              <li key={m.userId} data-member={m.userId} data-role={m.role}>
                <span className="mname">{m.name ?? m.email ?? "Member"}</span>
                <span className="memail">{m.email}</span>
                {isOwner || isSelf ? (
                  <span className="mrole">{m.role}</span>
                ) : (
                  <>
                    <form action={setRoleAction} className="ginline">
                      <input type="hidden" name="organizationId" value={orgId} />
                      <input type="hidden" name="userId" value={m.userId} />
                      <select aria-label={`Role for ${m.name ?? m.email}`} name="role" defaultValue={m.role}>
                        {ROLES.map((r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))}
                      </select>
                      <button type="submit" className="ghost">
                        Set
                      </button>
                    </form>
                    <form action={removeMemberAction} className="ginline">
                      <input type="hidden" name="organizationId" value={orgId} />
                      <input type="hidden" name="userId" value={m.userId} />
                      <button type="submit" className="ghost">
                        Remove
                      </button>
                    </form>
                  </>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      <section className="adminsec">
        <h2>Invitations</h2>
        <form action={inviteAction} className="ginline inviteform">
          <input type="hidden" name="organizationId" value={orgId} />
          <input aria-label="Invite email" name="email" type="email" placeholder="email to invite" required />
          <select aria-label="Invite role" name="role" defaultValue="viewer">
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
          <button type="submit">Invite</button>
        </form>
        <ul className="invitelist">
          {pendingInvitations.map((inv) => (
            <li key={inv.id} data-invite={inv.id}>
              <span className="iemail">{inv.email}</span>
              <span className="irole">{inv.role}</span>
              <form action={revokeInviteAction} className="ginline">
                <input type="hidden" name="organizationId" value={orgId} />
                <input type="hidden" name="invitationId" value={inv.id} />
                <button type="submit" className="ghost">
                  Revoke
                </button>
              </form>
            </li>
          ))}
          {pendingInvitations.length === 0 ? <li className="empty">No pending invitations.</li> : null}
        </ul>
      </section>

      <section className="dangerzone">
        <h2>Danger zone</h2>
        <p>
          Deleting <strong>{organization.name}</strong> removes the workspace and everything in it —
          events, guests, budgets, seating, announcements. This cannot be undone.
        </p>
        <form action={deleteWorkspaceAction} className="ginline">
          <input type="hidden" name="organizationId" value={orgId} />
          <input type="hidden" name="expectedName" value={organization.name} />
          <input
            aria-label="Type the workspace name to confirm"
            name="confirm"
            placeholder={`Type "${organization.name}" to confirm`}
            required
          />
          <button type="submit" className="danger">
            Delete workspace
          </button>
        </form>
      </section>
    </main>
  );
}
