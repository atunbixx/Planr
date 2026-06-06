import { notFound } from "next/navigation";
import { getServerCaller } from "../../../server/caller";

export const dynamic = "force-dynamic";

function prettyDate(d: Date): string {
  return new Date(d).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
function countdown(date: Date | null): string | null {
  if (!date) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const days = Math.round((d.getTime() - today.getTime()) / 86_400_000);
  if (days === 0) return "Today";
  if (days > 0) return `${days} ${days === 1 ? "day" : "days"} to go`;
  return null;
}

export default async function PublicSitePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const site = await (await getServerCaller()).website.getPublic({ slug });
  if (!site) notFound();
  const { website, event } = site;
  const date = event.date ? new Date(event.date) : null;
  const cd = countdown(date);

  const sections: { title: string; body: string }[] = [];
  if (website.story) sections.push({ title: "Our story", body: website.story });
  if (website.scheduleText) sections.push({ title: "Schedule", body: website.scheduleText });
  if (website.travelText) sections.push({ title: "Travel & stay", body: website.travelText });

  return (
    <main className="site" data-theme={website.theme}>
      <header className="site-hero">
        <p className="site-eyebrow">{website.headline ?? "You're invited"}</p>
        <h1 className="site-title">{event.name}</h1>
        {date ? <p className="site-date">{prettyDate(date)}</p> : null}
        {cd ? <p className="site-countdown">{cd}</p> : null}
        {website.welcomeMessage ? <p className="site-welcome">{website.welcomeMessage}</p> : null}
      </header>

      {sections.map((s) => (
        <section key={s.title} className="site-section">
          <h2>{s.title}</h2>
          <p>{s.body}</p>
        </section>
      ))}

      <footer className="site-foot">Made with Planr</footer>
    </main>
  );
}
