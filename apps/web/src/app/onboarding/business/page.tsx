import { redirect } from "next/navigation";
import { getCurrentUser } from "../../../server/auth";
import { completeBusinessAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function BusinessOnboardingPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  return (
    <main>
      <a className="back" href="/onboarding">
        ← Back
      </a>
      <p className="eyebrow">For planners</p>
      <h1>Set up your business</h1>
      <div className="card">
        <form action={completeBusinessAction}>
          <label>
            Business name
            <input
              aria-label="Business name"
              name="businessName"
              placeholder="Bliss Events"
              required
            />
          </label>
          <button type="submit">Create business</button>
        </form>
      </div>
    </main>
  );
}
