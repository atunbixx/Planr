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
      <p className="eyebrow">Let&apos;s begin</p>
      <h1>What brings you to Planr?</h1>
      <p>Every gathering, from a first birthday to a final farewell — beautifully planned.</p>
      <ul className="choices">
        <li>
          <a href="/onboarding/individual">
            <span className="stamp" aria-hidden="true">
              ✦
            </span>
            <span className="ctitle">I&apos;m planning my own event</span>
            <span className="cdesc">A wedding, a shower, a party, a memorial — yours to plan.</span>
          </a>
        </li>
        <li>
          <a href="/onboarding/business">
            <span className="stamp" aria-hidden="true">
              ❖
            </span>
            <span className="ctitle">I&apos;m an event planner / business</span>
            <span className="cdesc">Manage many events and a team, all in one place.</span>
          </a>
        </li>
      </ul>
    </main>
  );
}
