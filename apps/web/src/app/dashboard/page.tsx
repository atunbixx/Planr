import { redirect } from "next/navigation";
import { getCurrentUser } from "../../server/auth";
import { getServerCaller } from "../../server/caller";
import { createOrgAction } from "./actions";
import { SignOutButton } from "../../components/sign-out-button";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  const orgs = await (await getServerCaller()).organizations.list();

  return (
    <main>
      <header>
        <h1>Dashboard</h1>
        <span>{user.email ?? "(no email)"}</span>
        <SignOutButton />
      </header>

      <section>
        <h2>Create an organization</h2>
        <form action={createOrgAction}>
          <input aria-label="Organization name" name="name" required />
          <button type="submit">Create organization</button>
        </form>
      </section>

      <section>
        <h2>Your organizations ({orgs.length})</h2>
        <ul>
          {orgs.map((o) => (
            <li key={o.id}>
              <a href={`/dashboard/org/${o.id}`}>{o.name}</a>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
