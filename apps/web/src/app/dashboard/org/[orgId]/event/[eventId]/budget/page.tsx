import { redirect } from "next/navigation";
import { getCurrentUser } from "../../../../../../../server/auth";
import { getServerCaller } from "../../../../../../../server/caller";
import {
  addBudgetItemAction,
  setBudgetItemPaidAction,
  setBudgetItemEstimatedAction,
  removeBudgetItemAction,
} from "./actions";
import { formatMoney } from "../../../../../../../lib/money";

export const dynamic = "force-dynamic";

function centsToInput(cents: number): string {
  return `${Math.floor(cents / 100)}.${String(cents % 100).padStart(2, "0")}`;
}

export default async function BudgetPage({
  params,
}: {
  params: Promise<{ orgId: string; eventId: string }>;
}) {
  const { orgId, eventId } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  const caller = await getServerCaller();
  const [org, summary, list] = await Promise.all([
    caller.organizations.get({ organizationId: orgId }),
    caller.budget.summary({ eventId }),
    caller.budget.list({ eventId, limit: 100 }),
  ]);
  const { items } = list;
  const fmt = (cents: number) => formatMoney(cents, org.currency);

  return (
    <main>
      <a className="back" href={`/dashboard/org/${orgId}/event/${eventId}`}>
        ← Event
      </a>
      <p className="eyebrow">Budget</p>
      <h1>Where the money goes</h1>

      <p className="gsummary" data-remaining={summary.remainingCents}>
        <strong>{fmt(summary.totalEstimatedCents)}</strong> budgeted ·{" "}
        <strong>{fmt(summary.totalPaidCents)}</strong> paid ·{" "}
        <strong className="bremain">{fmt(summary.remainingCents)}</strong>{" "}
        {summary.remainingCents < 0 ? "over" : "to go"}
      </p>

      <section className="makepanel">
        <h2>Add a budget item</h2>
        <form action={addBudgetItemAction}>
          <input type="hidden" name="eventId" value={eventId} />
          <input type="hidden" name="orgId" value={orgId} />
          <input aria-label="Item label" name="label" placeholder="e.g. Venue deposit" required />
          <input aria-label="Item category" name="category" placeholder="category (optional)" />
          <input
            aria-label="Estimated amount"
            name="estimated"
            type="number"
            step="0.01"
            min="0"
            placeholder="estimated £"
          />
          <input
            aria-label="Paid amount"
            name="paid"
            type="number"
            step="0.01"
            min="0"
            placeholder="paid £"
          />
          <button type="submit">Add item</button>
        </form>
      </section>

      <ul className="budget">
        {items.map((b) => {
          const overpaid = b.paidCents > b.estimatedCents;
          return (
            <li key={b.id} data-item={b.id} data-overpaid={overpaid}>
              <span className="bname">{b.label}</span>
              {b.category ? <span className="bcat">{b.category}</span> : null}
              <span className="bamount">
                {fmt(b.paidCents)} / {fmt(b.estimatedCents)}
              </span>
              <form action={setBudgetItemEstimatedAction} className="ginline">
                <input type="hidden" name="eventId" value={eventId} />
                <input type="hidden" name="orgId" value={orgId} />
                <input type="hidden" name="itemId" value={b.id} />
                <input
                  aria-label={`Estimated for ${b.label}`}
                  name="estimated"
                  type="number"
                  step="0.01"
                  min="0"
                  defaultValue={centsToInput(b.estimatedCents)}
                />
                <button type="submit" className="ghost">
                  Est.
                </button>
              </form>
              <form action={setBudgetItemPaidAction} className="ginline">
                <input type="hidden" name="eventId" value={eventId} />
                <input type="hidden" name="orgId" value={orgId} />
                <input type="hidden" name="itemId" value={b.id} />
                <input
                  aria-label={`Paid for ${b.label}`}
                  name="paid"
                  type="number"
                  step="0.01"
                  min="0"
                  defaultValue={centsToInput(b.paidCents)}
                />
                <button type="submit" className="ghost">
                  Paid
                </button>
              </form>
              <form action={removeBudgetItemAction} className="ginline">
                <input type="hidden" name="eventId" value={eventId} />
                <input type="hidden" name="orgId" value={orgId} />
                <input type="hidden" name="itemId" value={b.id} />
                <button type="submit" className="ghost">
                  Remove
                </button>
              </form>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
