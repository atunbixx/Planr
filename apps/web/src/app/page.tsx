import { getCurrentUser } from "../server/auth";

export const dynamic = "force-dynamic";

export default async function Home() {
  const user = await getCurrentUser();

  return (
    <main className="hero">
      <p className="eyebrow">One place for every gathering</p>
      <h1>
        Plan life&apos;s <em>gatherings</em>,
        <br />
        beautifully.
      </h1>
      <p className="lead">
        Weddings, baby showers, birthdays, house parties, memorials — Planr keeps the guests, the
        budget, the seating and the vendors all in one calm, lovely place.
      </p>
      <div className="cta">
        {user ? (
          <a className="btn" href="/dashboard">
            Go to your planning
          </a>
        ) : (
          <>
            <a className="btn" href="/sign-up">
              Start planning
            </a>
            <a className="btn secondary" href="/sign-in">
              Sign in
            </a>
          </>
        )}
      </div>
    </main>
  );
}
