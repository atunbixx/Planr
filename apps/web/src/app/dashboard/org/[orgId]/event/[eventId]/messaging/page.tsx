import { redirect } from "next/navigation";
import { getCurrentUser } from "../../../../../../../server/auth";
import { getServerCaller } from "../../../../../../../server/caller";
import {
  addAnnouncementAction,
  editAnnouncementAction,
  removeAnnouncementAction,
} from "./actions";

export const dynamic = "force-dynamic";

function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export default async function MessagingPage({
  params,
}: {
  params: Promise<{ orgId: string; eventId: string }>;
}) {
  const { orgId, eventId } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  const announcements = await (await getServerCaller()).messaging.list({ eventId });

  return (
    <main>
      <a className="back" href={`/dashboard/org/${orgId}/event/${eventId}`}>
        ← Event
      </a>
      <p className="eyebrow">Messaging</p>
      <h1>Announcements</h1>
      <p className="rsvphint">Anything you post here shows on every guest&apos;s RSVP page.</p>

      <section className="makepanel">
        <h2>Post an announcement</h2>
        <form action={addAnnouncementAction}>
          <input type="hidden" name="eventId" value={eventId} />
          <input type="hidden" name="orgId" value={orgId} />
          <input aria-label="Announcement title" name="title" placeholder="e.g. Parking details" required />
          <textarea
            aria-label="Announcement body"
            name="body"
            placeholder="Share the details…"
            rows={3}
            required
          />
          <button type="submit">Post</button>
        </form>
      </section>

      <ul className="announce">
        {announcements.map((a) => (
          <li key={a.id} data-announce={a.id}>
            <details>
              <summary>
                <span className="aname">{a.title}</span>
                <span className="adate">{formatDate(a.createdAt)}</span>
              </summary>
              <p className="abody">{a.body}</p>
              <form action={editAnnouncementAction} className="aedit">
                <input type="hidden" name="eventId" value={eventId} />
                <input type="hidden" name="orgId" value={orgId} />
                <input type="hidden" name="id" value={a.id} />
                <input aria-label={`Edit title of ${a.title}`} name="title" defaultValue={a.title} required />
                <textarea aria-label={`Edit body of ${a.title}`} name="body" defaultValue={a.body} rows={2} required />
                <div className="arow">
                  <button type="submit" className="ghost">
                    Save
                  </button>
                </div>
              </form>
              <form action={removeAnnouncementAction} className="aremove">
                <input type="hidden" name="eventId" value={eventId} />
                <input type="hidden" name="orgId" value={orgId} />
                <input type="hidden" name="id" value={a.id} />
                <button type="submit" className="ghost">
                  Delete
                </button>
              </form>
            </details>
          </li>
        ))}
        {announcements.length === 0 ? (
          <li className="empty">No announcements yet — post your first above.</li>
        ) : null}
      </ul>
    </main>
  );
}
