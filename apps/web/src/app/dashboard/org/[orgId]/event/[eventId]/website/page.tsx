import { redirect } from "next/navigation";
import { getCurrentUser } from "../../../../../../../server/auth";
import { getServerCaller } from "../../../../../../../server/caller";
import { saveWebsiteAction } from "./actions";

export const dynamic = "force-dynamic";

const THEMES = [
  { value: "classic", label: "Classic (ivory & terracotta)" },
  { value: "romantic", label: "Romantic (blush & gold)" },
  { value: "modern", label: "Modern (ink & sage)" },
] as const;

export default async function WebsiteEditorPage({
  params,
}: {
  params: Promise<{ orgId: string; eventId: string }>;
}) {
  const { orgId, eventId } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  const site = await (await getServerCaller()).website.editor({ eventId });
  const base = process.env.NEXT_PUBLIC_BASE_URL ?? "";
  const publicUrl = `${base}/e/${site.slug}`;

  return (
    <main>
      <a className="back" href={`/dashboard/org/${orgId}/event/${eventId}`}>
        ← Event
      </a>
      <p className="eyebrow">Event website</p>
      <h1>Your public site</h1>

      <p className="gsummary" data-published={site.published}>
        {site.published ? (
          <>
            <strong>Live</strong> at{" "}
            <a href={`/e/${site.slug}`} target="_blank" rel="noreferrer">
              {publicUrl}
            </a>
          </>
        ) : (
          <>
            <strong>Draft</strong> — not visible to guests until you publish.
          </>
        )}
      </p>

      <section className="makepanel">
        <h2>Edit &amp; publish</h2>
        <form action={saveWebsiteAction} className="websiteform">
          <input type="hidden" name="eventId" value={eventId} />
          <input type="hidden" name="orgId" value={orgId} />

          <label className="wfield">
            <span>Headline</span>
            <input
              aria-label="Headline"
              name="headline"
              defaultValue={site.headline ?? ""}
              placeholder="We're getting married!"
            />
          </label>
          <label className="wfield">
            <span>Welcome message</span>
            <textarea
              aria-label="Welcome message"
              name="welcomeMessage"
              rows={2}
              defaultValue={site.welcomeMessage ?? ""}
              placeholder="We can't wait to celebrate with you."
            />
          </label>
          <label className="wfield">
            <span>Our story</span>
            <textarea aria-label="Our story" name="story" rows={4} defaultValue={site.story ?? ""} />
          </label>
          <label className="wfield">
            <span>Schedule</span>
            <textarea
              aria-label="Schedule"
              name="scheduleText"
              rows={4}
              defaultValue={site.scheduleText ?? ""}
              placeholder={"2pm — Ceremony\n3pm — Drinks reception\n7pm — Dinner & dancing"}
            />
          </label>
          <label className="wfield">
            <span>Travel &amp; accommodation</span>
            <textarea
              aria-label="Travel"
              name="travelText"
              rows={3}
              defaultValue={site.travelText ?? ""}
            />
          </label>
          <label className="wfield">
            <span>Theme</span>
            <select aria-label="Theme" name="theme" defaultValue={site.theme}>
              {THEMES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </label>
          <label className="wpublish">
            <input type="checkbox" name="published" defaultChecked={site.published} />
            <span>Publish — make this site visible to anyone with the link</span>
          </label>

          <button type="submit">Save website</button>
        </form>
      </section>
    </main>
  );
}
