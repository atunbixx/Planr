import { getServerCaller } from "../../../server/caller";
import { respondAction, uploadPhotoAction } from "./actions";
import { MEAL_OPTIONS } from "../../../lib/meals";

export const dynamic = "force-dynamic";

type View = {
  eventName: string;
  guestName: string;
  rsvpStatus: string;
  plusOne: boolean;
  mealChoice: string | null;
};
type Announcement = { id: string; title: string; body: string };

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
  let announcements: Announcement[] = [];
  try {
    const caller = await getServerCaller();
    view = await caller.rsvp.get({ token });
    announcements = await caller.messaging.publicForToken({ token });
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
        <label className="rsvpmeal">
          <span>Meal preference</span>
          <select name="mealChoice" defaultValue={view.mealChoice ?? ""}>
            <option value="">No preference</option>
            {MEAL_OPTIONS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </label>
        <button type="submit">Send RSVP</button>
      </form>

      <section className="rsvpphoto">
        <h2>Share a photo</h2>
        <p>Add a snap from the day — it&apos;ll appear in the couple&apos;s gallery.</p>
        <form action={uploadPhotoAction} className="rsvpphoto-form">
          <input type="hidden" name="token" value={token} />
          <input aria-label="Photo" name="photo" type="file" accept="image/*" required />
          <input aria-label="Photo caption" name="caption" placeholder="caption (optional)" />
          <button type="submit">Upload photo</button>
        </form>
      </section>

      {announcements.length > 0 ? (
        <section className="rsvpnews">
          <h2>News from your host</h2>
          <ul>
            {announcements.map((a) => (
              <li key={a.id}>
                <span className="ntitle">{a.title}</span>
                <p className="nbody">{a.body}</p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </main>
  );
}
