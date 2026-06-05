import { redirect } from "next/navigation";
import { getCurrentUser } from "../../../server/auth";
import { completeBusinessAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function BusinessOnboardingPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  return (
    <main>
      <p>
        <a href="/onboarding">← Back</a>
      </p>
      <h1>Set up your business</h1>
      <form action={completeBusinessAction}>
        <label>
          Business name
          <input aria-label="Business name" name="businessName" required />
        </label>
        <button type="submit">Create business</button>
      </form>
    </main>
  );
}
