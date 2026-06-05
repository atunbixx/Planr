import { getServerCaller } from "../../../server/caller";
import { respondAction } from "./actions";

export const dynamic = "force-dynamic";

type View = { eventName: string; guestName: string; rsvpStatus: string; plusOne: boolean };

const OPTIONS = [
  { value: "coming", label: "Joyfully accepts" },
  { value: "maybe", label: "Might make it" },
  { value: "declined", label: "Regretfully declines" },
] as const;

const STATUS_LABEL: Record<string, string> = {
  coming: "Coming",
  maybe: "Maybe",
  declined: "Not coming",
};

export default async function PublicRsvpPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  let view: View | null = null;
  try {
    view = await (await getServerCaller()).rsvp.get({ token });
  } catch {
    view = null;
  }

  if (!view) {
    return (
      <main className="rsvppublic">
        <p className="eyebrow">RSVP</p>
        <h1>This link isn&apos;t valid</h1>
        <p>The RSVP link may have expired or been mistyped. Please check with your host.</p>
      </main>
    );
  }

  const responded = view.rsvpStatus !== "awaiting";

  return (
    <main className="rsvppublic">
      <p className="eyebrow">You&apos;re invited</p>
      <h1>{view.eventName}</h1>
      <p className="rsvpwho">
        Hello <strong>{view.guestName}</strong> — will you be joining us?
      </p>

      {responded ? (
        <p className="rsvpconfirm" data-status={view.rsvpStatus}>
          Thanks! You&apos;re marked as <strong>{STATUS_LABEL[view.rsvpStatus]}</strong>
          {view.plusOne ? " (plus one)" : ""}. You can change your answer below.
        </p>
      ) : null}

      <form action={respondAction} className="rsvpform">
        <input type="hidden" name="token" value={token} />
        <fieldset className="rsvpchoices">
          {OPTIONS.map((o) => (
            <label key={o.value} className="rsvpchoice">
              <input
                type="radio"
                name="rsvpStatus"
                value={o.value}
                defaultChecked={view!.rsvpStatus === o.value}
                required
              />
              <span>{o.label}</span>
            </label>
          ))}
        </fieldset>
        <label className="rsvpplus">
          <input type="checkbox" name="plusOne" defaultChecked={view.plusOne} />
          <span>I&apos;ll bring a plus-one</span>
        </label>
        <button type="submit">Send RSVP</button>
      </form>
    </main>
  );
}
