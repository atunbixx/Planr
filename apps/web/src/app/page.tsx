import { getCurrentUser } from "../server/auth";
import { container } from "../server/container";

export default async function Home() {
  const user = await getCurrentUser();
  if (!user) {
    return (
      <main>
        <h1>Planr</h1>
        <p>Not signed in. (Auth UI lands in Plan 4.)</p>
      </main>
    );
  }
  const orgs = await container.repos.orgs.listForUser(user.id);
  return (
    <main>
      <h1>Planr</h1>
      <p>Signed in as {user.email}</p>
      <h2>Your organizations ({orgs.length})</h2>
      <ul>
        {orgs.map((o) => (
          <li key={o.id}>{o.name}</li>
        ))}
      </ul>
    </main>
  );
}
