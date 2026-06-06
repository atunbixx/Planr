import { redirect } from "next/navigation";
import { getCurrentUser } from "../../../../../../../server/auth";
import { getServerCaller } from "../../../../../../../server/caller";
import { addVendorAction, updateVendorAction, removeVendorAction } from "./actions";
import { formatMoney } from "../../../../../../../lib/money";

export const dynamic = "force-dynamic";

const STATUSES = ["researching", "contacted", "quoted", "booked", "declined"] as const;
const CATEGORIES = [
  "Venue",
  "Catering",
  "Photography",
  "Florist",
  "Music / DJ",
  "Cake",
  "Hair & Makeup",
  "Transport",
  "Stationery",
  "Other",
];

function centsToInput(cents: number): string {
  return cents > 0 ? `${Math.floor(cents / 100)}.${String(cents % 100).padStart(2, "0")}` : "";
}

export default async function VendorsPage({
  params,
}: {
  params: Promise<{ orgId: string; eventId: string }>;
}) {
  const { orgId, eventId } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  const caller = await getServerCaller();
  const [org, summary, vendors] = await Promise.all([
    caller.organizations.get({ organizationId: orgId }),
    caller.vendors.summary({ eventId }),
    caller.vendors.list({ eventId }),
  ]);
  const fmt = (c: number) => formatMoney(c, org.currency);

  // group by category for the comparison view
  const groups = new Map<string, typeof vendors>();
  for (const v of vendors) {
    const key = v.category ?? "Uncategorised";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(v);
  }

  return (
    <main>
      <a className="back" href={`/dashboard/org/${orgId}/event/${eventId}`}>
        ← Event
      </a>
      <p className="eyebrow">Vendors</p>
      <h1>Your suppliers</h1>

      <p className="gsummary">
        <strong>{summary.total}</strong> vendors · <strong>{summary.booked}</strong> booked ·{" "}
        <strong>{fmt(summary.totalBookedCents)}</strong> committed
      </p>

      <section className="makepanel">
        <h2>Add a vendor</h2>
        <form action={addVendorAction}>
          <input type="hidden" name="eventId" value={eventId} />
          <input type="hidden" name="orgId" value={orgId} />
          <input aria-label="Vendor name" name="name" placeholder="e.g. Bloom Florists" required />
          <input aria-label="Vendor category" name="category" placeholder="category" list="vendor-cats" />
          <datalist id="vendor-cats">
            {CATEGORIES.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
          <input aria-label="Vendor email" name="contactEmail" type="email" placeholder="email (optional)" />
          <input aria-label="Vendor cost" name="cost" type="number" step="0.01" min="0" placeholder="cost" />
          <select aria-label="Vendor status" name="status" defaultValue="researching">
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <button type="submit">Add vendor</button>
        </form>
      </section>

      {[...groups.entries()].map(([category, list]) => (
        <section key={category} className="vencat">
          <h2>{category}</h2>
          <ul className="vendors">
            {list.map((v) => (
              <li key={v.id} data-vendor={v.id} data-status={v.status}>
                <span className="vname">{v.name}</span>
                <span className="vmeta">{v.contactEmail ?? ""}</span>
                <form action={updateVendorAction} className="ginline">
                  <input type="hidden" name="eventId" value={eventId} />
                  <input type="hidden" name="orgId" value={orgId} />
                  <input type="hidden" name="vendorId" value={v.id} />
                  <input
                    aria-label={`Cost for ${v.name}`}
                    name="cost"
                    type="number"
                    step="0.01"
                    min="0"
                    defaultValue={centsToInput(v.costCents)}
                  />
                  <select aria-label={`Status for ${v.name}`} name="status" defaultValue={v.status}>
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                  <button type="submit" className="ghost">
                    Save
                  </button>
                </form>
                <form action={removeVendorAction} className="ginline">
                  <input type="hidden" name="eventId" value={eventId} />
                  <input type="hidden" name="orgId" value={orgId} />
                  <input type="hidden" name="vendorId" value={v.id} />
                  <button type="submit" className="ghost">
                    Remove
                  </button>
                </form>
              </li>
            ))}
          </ul>
        </section>
      ))}
      {vendors.length === 0 ? <p className="empty">No vendors yet — add your first above.</p> : null}
    </main>
  );
}
