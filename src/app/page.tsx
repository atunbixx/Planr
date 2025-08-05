export default function HomePage() {
  return (
    <main style={{ padding: 24, display: 'grid', gap: 16 }}>
      <h1>Wedding Planner</h1>
      <p>Your wedding planning application is working!</p>

      <nav style={{ display: 'flex', gap: 12 }}>
        <a
          href="/dashboard"
          style={{
            padding: '8px 12px',
            border: '1px solid #ccc',
            borderRadius: 6,
            textDecoration: 'none',
          }}
        >
          Go to Dashboard
        </a>
      </nav>

      <section style={{ marginTop: 24, fontSize: 14, color: '#555' }}>
        <p>Status:</p>
        <ul>
          <li>✅ Core application working</li>
          <li>✅ No more 500 errors</li>
          <li>⚠️ Authentication temporarily disabled for compatibility</li>
        </ul>
      </section>
    </main>
  );
}
