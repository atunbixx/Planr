import { redirect } from "next/navigation";
import { getCurrentUser } from "../../server/auth";
import { getServerCaller } from "../../server/caller";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  const workspaces = await (await getServerCaller()).workspaces.list();
  if (workspaces.length > 0) redirect("/dashboard");

  return (
    <main>
      <h1>What brings you to Planr?</h1>
      <ul>
        <li>
          <a href="/onboarding/individual">I&apos;m planning my own event</a>
        </li>
        <li>
          <a href="/onboarding/business">I&apos;m an event planner / business</a>
        </li>
      </ul>
    </main>
  );
}
