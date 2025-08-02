export default function WorkingTest() {
  return (
    <div style={{ padding: '40px', textAlign: 'center' }}>
      <h1>✅ Next.js is Working!</h1>
      <p>This page loads without any authentication or complex components.</p>
      <div style={{ marginTop: '30px' }}>
        <a href="/test-supabase" style={{ marginRight: '20px', color: 'blue' }}>Test Supabase</a>
        <a href="/dev-bypass" style={{ marginRight: '20px', color: 'blue' }}>Dev Tools</a>
        <a href="/dashboard?dev=true" style={{ color: 'blue' }}>Try Dashboard with Dev Mode</a>
      </div>
      <div style={{ marginTop: '30px', padding: '20px', backgroundColor: '#f0f0f0', borderRadius: '8px' }}>
        <h3>The Issue:</h3>
        <p>The main dashboard is stuck on "Loading your dashboard..." because Supabase auth is timing out.</p>
        <p>Try the dev bypass by adding ?dev=true to the dashboard URL.</p>
      </div>
    </div>
  )
}