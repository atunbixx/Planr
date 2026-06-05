import { redirect } from "next/navigation";
import { getCurrentUser } from "../../../server/auth";
import { completeIndividualAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function IndividualOnboardingPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  const prefill = user.name ? `${user.name}'s Planning` : "My Planning";

  return (
    <main>
      <p>
        <a href="/onboarding">← Back</a>
      </p>
      <h1>Let&apos;s set up your planning</h1>
      <form action={completeIndividualAction}>
        <label>
          Name your space
          <input aria-label="Space name" name="spaceName" defaultValue={prefill} required />
        </label>
        <h2>What are you planning?</h2>
        <label>
          Event type
          <select aria-label="Event type" name="eventTypeKey" defaultValue="wedding">
            <option value="wedding">Wedding</option>
            <option value="birthday">Birthday</option>
            <option value="bridal_shower">Baby / bridal shower</option>
            <option value="funeral">Funeral / memorial</option>
            <option value="corporate">Party / other gathering</option>
          </select>
        </label>
        <label>
          Give it a name
          <input aria-label="Event name" name="eventName" required />
        </label>
        <button type="submit">Start planning</button>
      </form>
    </main>
  );
}
