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
  const [org, items, contributions] = await Promise.all([
    caller.organizations.get({ organizationId: orgId }),
    caller.registry.list({ eventId }),
    caller.registry.contributions({ eventId }),
  ]);
  const fmt = (c: number) => formatMoney(c, org.currency);

  // Roll contributions up per fund.
  const raised: Record<string, number> = {};
  const byItem: Record<string, typeof contributions> = {};
  for (const c of contributions) {
    raised[c.registryItemId] = (raised[c.registryItemId] ?? 0) + c.amountCents;
    (byItem[c.registryItemId] ??= []).push(c);
  }
  const totalRaised = contributions.reduce((s, c) => s + c.amountCents, 0);

  return (
    <main>
      <a className="back" href={`/dashboard/org/${orgId}/event/${eventId}`}>
        ← Event
      </a>
      <p className="eyebrow">Gift registry</p>
      <h1>Your gift list</h1>
      <p className="rsvphint">
        Gifts and cash funds you add here appear on your published event website. Guests can chip in
        to a cash fund right from the site — no account needed.
      </p>
      {totalRaised > 0 ? (
        <p className="reg-raised">
          <strong>{fmt(totalRaised)}</strong> contributed across your cash funds so far.
        </p>
      ) : null}

      <details className="makepanel">
        <summary>+ Add a gift or cash fund</summary>
        <form action={addGiftAction} className="reg-form">
          <input type="hidden" name="eventId" value={eventId} />
          <input type="hidden" name="orgId" value={orgId} />
          <input aria-label="Gift title" name="title" placeholder="e.g. Stand mixer, or Honeymoon fund" required />
          <label className="reg-check">
            <input aria-label="This is a cash fund" name="isCashFund" type="checkbox" value="on" />
            <span>This is a cash fund — guests contribute money</span>
          </label>
          <span className="reg-money">
            <input aria-label="Gift price" name="price" type="number" step="0.01" min="0" placeholder="price (gift)" />
            <input aria-label="Fund goal" name="goal" type="number" step="0.01" min="0" placeholder="goal (cash fund, optional)" />
          </span>
          <input aria-label="Gift link" name="url" type="url" placeholder="link (optional)" />
          <input aria-label="Gift note" name="note" placeholder="note (optional)" />
          <button type="submit">Add to registry</button>
        </form>
      </details>

      <ul className="gifts">
        {items.map((g) => {
          const got = raised[g.id] ?? 0;
          const pct = g.goalCents > 0 ? Math.min(100, Math.round((got / g.goalCents) * 100)) : null;
          const contribs = byItem[g.id] ?? [];
          return (
            <li key={g.id} data-gift={g.id} data-fund={g.isCashFund ? "yes" : "no"}>
              <div className="grow">
                <span className="gtitle">{g.title}</span>
                {g.isCashFund ? <span className="gtag">Cash fund</span> : null}
                {!g.isCashFund && g.priceCents > 0 ? (
                  <span className="gprice">{fmt(g.priceCents)}</span>
                ) : null}
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
              </div>

              {g.isCashFund ? (
                <div className="gfund">
                  <div className="gfund-row">
                    <span>
                      <strong>{fmt(got)}</strong> raised
                      {g.goalCents > 0 ? <span className="gfund-goal"> of {fmt(g.goalCents)}</span> : null}
                    </span>
                    <span className="gfund-count">
                      {contribs.length} {contribs.length === 1 ? "gift" : "gifts"}
                    </span>
                  </div>
                  {pct !== null ? (
                    <span className="gfund-bar" aria-hidden="true">
                      <span className="gfund-fill" style={{ width: `${pct}%` }} />
                    </span>
                  ) : null}
                  {contribs.length > 0 ? (
                    <ul className="gfund-list">
                      {contribs.map((c) => (
                        <li key={c.id}>
                          <span className="gfund-name">{c.name}</span>
                          <span className="gfund-amt">{fmt(c.amountCents)}</span>
                          {c.message ? <span className="gfund-msg">“{c.message}”</span> : null}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              ) : null}
            </li>
          );
        })}
        {items.length === 0 ? <li className="empty">Nothing yet — add a gift or cash fund above.</li> : null}
      </ul>
    </main>
  );
}
