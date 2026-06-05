import { redirect } from "next/navigation";
import { getCurrentUser } from "../../../../../../server/auth";
import { getServerCaller } from "../../../../../../server/caller";

export const dynamic = "force-dynamic";

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
      <p>
        <a href={`/dashboard/org/${orgId}`}>← Events</a>
      </p>
      <h1>Modules</h1>
      <ul>
        {modules.map((m) => (
          <li key={m.module} data-module={m.module} data-locked={m.locked}>
            {m.module} — {m.locked ? `locked (${m.reason})` : "available"}
          </li>
        ))}
      </ul>
    </main>
  );
}
