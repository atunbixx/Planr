import { redirect } from "next/navigation";
import { getCurrentUser } from "../../../../../../../server/auth";
import { getServerCaller } from "../../../../../../../server/caller";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  awaiting: "Awaiting",
  coming: "Coming",
  declined: "Declined",
  maybe: "Maybe",
};

function baseUrl(): string {
  return process.env.NEXT_PUBLIC_BASE_URL ?? "";
}

export default async function RsvpHostPage({
  params,
}: {
  params: Promise<{ orgId: string; eventId: string }>;
}) {
  const { orgId, eventId } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  const { summary, guests } = await (await getServerCaller()).rsvp.overview({ eventId });
  const origin = baseUrl();

  return (
    <main>
      <a className="back" href={`/dashboard/org/${orgId}/event/${eventId}`}>
        ← Event
      </a>
      <p className="eyebrow">RSVP</p>
      <h1>Responses &amp; links</h1>

      <p className="gsummary">
        <strong>{summary.total}</strong> invited · <strong>{summary.coming}</strong> coming ·{" "}
        <strong>{summary.declined}</strong> declined · <strong>{summary.maybe}</strong> maybe ·{" "}
        <strong>{summary.awaiting}</strong> awaiting
      </p>

      <p className="rsvphint">
        Share each guest&apos;s private link — they can RSVP without an account.
      </p>

      <ul className="rsvplist">
        {guests.map((g) => {
          const link = `${origin}/rsvp/${g.token}`;
          return (
            <li key={g.id} data-guest={g.id} data-rsvp={g.rsvpStatus}>
              <span className="gname">{g.name}</span>
              <span className="rstatus">{STATUS_LABEL[g.rsvpStatus] ?? g.rsvpStatus}</span>
              <input
                className="rlink"
                type="text"
                readOnly
                aria-label={`RSVP link for ${g.name}`}
                value={link}
              />
              <a className="ghost rlinkopen" href={`/rsvp/${g.token}`} target="_blank" rel="noreferrer">
                Open
              </a>
            </li>
          );
        })}
        {guests.length === 0 ? (
          <li className="empty">No guests yet — add some on the Guests page.</li>
        ) : null}
      </ul>
    </main>
  );
}
