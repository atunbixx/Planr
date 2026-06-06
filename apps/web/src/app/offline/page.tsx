export const metadata = { title: "Offline — Planr" };

export default function OfflinePage() {
  return (
    <main className="auth">
      <div className="card">
        <p className="eyebrow">No connection</p>
        <h1>You&apos;re offline</h1>
        <p>Planr needs a connection for this page. Reconnect and try again — your plans are safe.</p>
      </div>
    </main>
  );
}
