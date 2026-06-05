import { redirect } from "next/navigation";
import { getCurrentUser } from "../../../../../../server/auth";
import { getServerCaller } from "../../../../../../server/caller";

export const dynamic = "force-dynamic";

// Modules with a real page today. Everything else shows "Coming soon" (free launch: no paywall).
const BUILT = new Set(["guests", "tasks", "budget", "seating", "rsvp"]);

function pretty(module: string): string {
  return module.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default async function EventPage({
  params,
}: {
  params: Promise<{ orgId: string; eventId: string }>;
}) {
  const { orgId, eventId } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  const modules = await (await getServerCaller()).events.modules({
    organizationId: orgId,
    eventId,
  });

  return (
    <main>
      <a className="back" href={`/dashboard/org/${orgId}`}>
        ← Events
      </a>
      <p className="eyebrow">Your toolkit</p>
      <h1>Plan this event</h1>
      <p>Everything you need, in one place.</p>
      <ul className="modules">
        {modules.map((m) => {
          const built = BUILT.has(m.module);
          const href = `/dashboard/org/${orgId}/event/${eventId}/${m.module}`;
          return (
            <li key={m.module} data-module={m.module} data-locked={m.locked} data-built={built}>
              {built ? (
                <a className="mname mlink" href={href}>
                  {pretty(m.module)}
                </a>
              ) : (
                <span className="mname">{pretty(m.module)}</span>
              )}
              <span className="mstatus">{built ? "Open →" : "Coming soon"}</span>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
