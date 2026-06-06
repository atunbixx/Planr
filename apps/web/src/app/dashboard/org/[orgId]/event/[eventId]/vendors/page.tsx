import { redirect } from "next/navigation";
import { getCurrentUser } from "../../../../../../../server/auth";
import { getServerCaller } from "../../../../../../../server/caller";
import { addVendorAction, updateVendorAction, moveVendorAction, removeVendorAction } from "./actions";
import { formatMoney } from "../../../../../../../lib/money";

export const dynamic = "force-dynamic";

type Vendor = Awaited<
  ReturnType<Awaited<ReturnType<typeof getServerCaller>>["vendors"]["list"]>
>[number];

const STAGES = ["researching", "contacted", "quoted", "booked"] as const;
const ALL_STATUSES = ["researching", "contacted", "quoted", "booked", "declined"] as const;
const STAGE_LABEL: Record<string, string> = {
  researching: "Researching",
  contacted: "Contacted",
  quoted: "Quote in",
  booked: "Booked",
  declined: "Declined",
};
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

function toInput(cents: number): string {
  return cents > 0 ? `${Math.floor(cents / 100)}.${String(cents % 100).padStart(2, "0")}` : "";
}

function VendorCard({
  v,
  orgId,
  eventId,
  currency,
}: {
  v: Vendor;
  orgId: string;
  eventId: string;
  currency: string;
}) {
  const fmt = (c: number) => formatMoney(c, currency);
  const balance = v.costCents - v.depositPaidCents;
  const paidPct = v.costCents > 0 ? Math.min(100, Math.round((v.depositPaidCents / v.costCents) * 100)) : 0;
  return (
    <article className="vcard" data-vendor={v.id} data-status={v.status}>
      <header className="vcard-head">
        <span className="vname">{v.name}</span>
        {v.category ? <span className="vcat">{v.category}</span> : null}
      </header>

      {v.contactName || v.contactEmail || v.contactPhone || v.website ? (
        <div className="vcontact">
          {v.contactName ? <span>{v.contactName}</span> : null}
          {v.contactEmail ? <a href={`mailto:${v.contactEmail}`}>✉ {v.contactEmail}</a> : null}
          {v.contactPhone ? <a href={`tel:${v.contactPhone}`}>☎ {v.contactPhone}</a> : null}
          {v.website ? (
            <a href={v.website} target="_blank" rel="noreferrer">
              ↗ website
            </a>
          ) : null}
        </div>
      ) : null}

      {v.costCents > 0 ? (
        <div className="vpay">
          <div className="vpay-row">
            <span>{fmt(v.depositPaidCents)} paid</span>
            <span className="vpay-bal">{balance > 0 ? `${fmt(balance)} due` : "paid in full"}</span>
          </div>
          <span className="vpay-bar" aria-hidden="true">
            <span className="vpay-fill" style={{ width: `${paidPct}%` }} />
          </span>
          <span className="vpay-total">of {fmt(v.costCents)}</span>
        </div>
      ) : null}

      {v.notes ? <p className="vnotes">{v.notes}</p> : null}

      <div className="vcard-foot">
        <form action={moveVendorAction} className="ginline">
          <input type="hidden" name="eventId" value={eventId} />
          <input type="hidden" name="orgId" value={orgId} />
          <input type="hidden" name="vendorId" value={v.id} />
          <select aria-label={`Stage for ${v.name}`} name="status" defaultValue={v.status}>
            {ALL_STATUSES.map((s) => (
              <option key={s} value={s}>
                {STAGE_LABEL[s]}
              </option>
            ))}
          </select>
          <button type="submit" className="ghost">
            Move
          </button>
        </form>

        <details className="vedit">
          <summary className="ghost">Edit</summary>
          <form action={updateVendorAction} className="vform">
            <input type="hidden" name="eventId" value={eventId} />
            <input type="hidden" name="orgId" value={orgId} />
            <input type="hidden" name="vendorId" value={v.id} />
            <input aria-label={`Name for ${v.name}`} name="name" defaultValue={v.name} required />
            <input aria-label={`Category for ${v.name}`} name="category" defaultValue={v.category ?? ""} placeholder="category" list="vendor-cats" />
            <input aria-label={`Contact name for ${v.name}`} name="contactName" defaultValue={v.contactName ?? ""} placeholder="contact name" />
            <input aria-label={`Email for ${v.name}`} name="contactEmail" defaultValue={v.contactEmail ?? ""} placeholder="email" />
            <input aria-label={`Phone for ${v.name}`} name="contactPhone" defaultValue={v.contactPhone ?? ""} placeholder="phone" />
            <input aria-label={`Website for ${v.name}`} name="website" defaultValue={v.website ?? ""} placeholder="website" />
            <input type="hidden" name="status" value={v.status} />
            <span className="vform-money">
              <input aria-label={`Cost for ${v.name}`} name="cost" type="number" step="0.01" min="0" defaultValue={toInput(v.costCents)} placeholder="total cost" />
              <input aria-label={`Paid for ${v.name}`} name="deposit" type="number" step="0.01" min="0" defaultValue={toInput(v.depositPaidCents)} placeholder="paid so far" />
            </span>
            <textarea aria-label={`Notes for ${v.name}`} name="notes" defaultValue={v.notes ?? ""} rows={2} placeholder="notes" />
            <div className="vform-actions">
              <button type="submit">Save</button>
            </div>
          </form>
          <form action={removeVendorAction} className="vremove">
            <input type="hidden" name="eventId" value={eventId} />
            <input type="hidden" name="orgId" value={orgId} />
            <input type="hidden" name="vendorId" value={v.id} />
            <button type="submit" className="ghost danger-text">
              Remove vendor
            </button>
          </form>
        </details>
      </div>
    </article>
  );
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
  const declined = vendors.filter((v) => v.status === "declined");

  return (
    <main className="vendors-page">
      <a className="back" href={`/dashboard/org/${orgId}/event/${eventId}`}>
        ← Event
      </a>
      <p className="eyebrow">Vendors</p>
      <h1>Supplier pipeline</h1>

      <section className="vsummary">
        <div className="vsum-money">
          <span>
            <strong>{fmt(summary.estimatedCents)}</strong> estimated
          </span>
          <span>
            <strong>{fmt(summary.paidCents)}</strong> paid
          </span>
          <span className="vsum-out">
            <strong>{fmt(summary.outstandingCents)}</strong> outstanding
          </span>
        </div>
        <div className="vsum-stages">
          {ALL_STATUSES.map((s) => (
            <span key={s} className="vsum-chip" data-status={s}>
              {STAGE_LABEL[s]} {summary.byStatus[s]}
            </span>
          ))}
        </div>
      </section>

      <details className="makepanel vaddpanel">
        <summary>+ Add a vendor</summary>
        <form action={addVendorAction} className="vform">
          <input type="hidden" name="eventId" value={eventId} />
          <input type="hidden" name="orgId" value={orgId} />
          <input aria-label="Vendor name" name="name" placeholder="e.g. Bloom Florists" required />
          <input aria-label="Vendor category" name="category" placeholder="category" list="vendor-cats" />
          <input aria-label="Vendor contact name" name="contactName" placeholder="contact name" />
          <input aria-label="Vendor email" name="contactEmail" type="email" placeholder="email" />
          <input aria-label="Vendor phone" name="contactPhone" placeholder="phone" />
          <input aria-label="Vendor website" name="website" placeholder="website" />
          <span className="vform-money">
            <input aria-label="Vendor cost" name="cost" type="number" step="0.01" min="0" placeholder="total cost" />
            <input aria-label="Vendor paid" name="deposit" type="number" step="0.01" min="0" placeholder="paid so far" />
          </span>
          <select aria-label="Vendor status" name="status" defaultValue="researching">
            {ALL_STATUSES.map((s) => (
              <option key={s} value={s}>
                {STAGE_LABEL[s]}
              </option>
            ))}
          </select>
          <textarea aria-label="Vendor notes" name="notes" rows={2} placeholder="notes" />
          <button type="submit">Add vendor</button>
        </form>
      </details>

      <datalist id="vendor-cats">
        {CATEGORIES.map((c) => (
          <option key={c} value={c} />
        ))}
      </datalist>

      <div className="vboard">
        {STAGES.map((stage) => {
          const inStage = vendors.filter((v) => v.status === stage);
          return (
            <section key={stage} className="vcol" data-stage={stage}>
              <header className="vcol-head">
                <span>{STAGE_LABEL[stage]}</span>
                <span className="vcol-count">{inStage.length}</span>
              </header>
              {inStage.map((v) => (
                <VendorCard key={v.id} v={v} orgId={orgId} eventId={eventId} currency={org.currency} />
              ))}
              {inStage.length === 0 ? <p className="vcol-empty">—</p> : null}
            </section>
          );
        })}
      </div>

      {declined.length > 0 ? (
        <details className="vdeclined">
          <summary>Declined ({declined.length})</summary>
          <div className="vboard-declined">
            {declined.map((v) => (
              <VendorCard key={v.id} v={v} orgId={orgId} eventId={eventId} currency={org.currency} />
            ))}
          </div>
        </details>
      ) : null}

      {vendors.length === 0 ? <p className="empty">No vendors yet — add your first above.</p> : null}
    </main>
  );
}
