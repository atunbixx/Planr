import { redirect } from "next/navigation";
import { getCurrentUser } from "../../../../../../server/auth";
import { getServerCaller } from "../../../../../../server/caller";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  free: "Included",
  entitled: "Included",
  all_access: "Included",
  needs_event_type_plan: "Unlock with a plan",
  needs_pro: "Pro",
  not_relevant: "—",
};

function pretty(module: string): string {
  return module
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
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
      <p>Everything you need, in one place. Locked tools unlock when you choose a plan.</p>
      <ul className="modules">
        {modules.map((m) => (
          <li key={m.module} data-module={m.module} data-locked={m.locked}>
            <span className="mname">{pretty(m.module)}</span>
            <span className="mstatus">
              {m.locked ? STATUS_LABEL[m.reason] ?? "Locked" : "Available"}
            </span>
          </li>
        ))}
      </ul>
    </main>
  );
}
