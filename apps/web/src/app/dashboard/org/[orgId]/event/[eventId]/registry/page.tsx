import { redirect } from "next/navigation";
import { getCurrentUser } from "../../../../../../../server/auth";
import { getServerCaller } from "../../../../../../../server/caller";
import { addGiftAction, removeGiftAction } from "./actions";
import { formatMoney } from "../../../../../../../lib/money";

export const dynamic = "force-dynamic";

export default async function RegistryPage({
  params,
}: {
  params: Promise<{ orgId: string; eventId: string }>;
}) {
  const { orgId, eventId } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  const caller = await getServerCaller();
  const [org, items] = await Promise.all([
    caller.organizations.get({ organizationId: orgId }),
    caller.registry.list({ eventId }),
  ]);

  return (
    <main>
      <a className="back" href={`/dashboard/org/${orgId}/event/${eventId}`}>
        ← Event
      </a>
      <p className="eyebrow">Gift registry</p>
      <h1>Your gift list</h1>
      <p className="rsvphint">Gifts you add here appear on your published event website.</p>

      <section className="makepanel">
        <h2>Add a gift</h2>
        <form action={addGiftAction}>
          <input type="hidden" name="eventId" value={eventId} />
          <input type="hidden" name="orgId" value={orgId} />
          <input aria-label="Gift title" name="title" placeholder="e.g. Stand mixer" required />
          <input aria-label="Gift link" name="url" type="url" placeholder="link (optional)" />
          <input aria-label="Gift price" name="price" type="number" step="0.01" min="0" placeholder="price" />
          <input aria-label="Gift note" name="note" placeholder="note (optional)" />
          <button type="submit">Add gift</button>
        </form>
      </section>

      <ul className="gifts">
        {items.map((g) => (
          <li key={g.id} data-gift={g.id}>
            <span className="gtitle">{g.title}</span>
            {g.priceCents > 0 ? <span className="gprice">{formatMoney(g.priceCents, org.currency)}</span> : null}
            {g.url ? (
              <a className="glink" href={g.url} target="_blank" rel="noreferrer">
                View
              </a>
            ) : null}
            <form action={removeGiftAction} className="ginline">
              <input type="hidden" name="eventId" value={eventId} />
              <input type="hidden" name="orgId" value={orgId} />
              <input type="hidden" name="itemId" value={g.id} />
              <button type="submit" className="ghost">
                Remove
              </button>
            </form>
          </li>
        ))}
        {items.length === 0 ? <li className="empty">No gifts yet — add your first above.</li> : null}
      </ul>
    </main>
  );
}
