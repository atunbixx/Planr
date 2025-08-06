// Simple debug page to test if the app is working
export default function DebugPage() {
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial' }}>
      <h1>🐛 Debug Page</h1>
      <p>If you can see this page, Next.js is working correctly.</p>
      <ul>
        <li>✅ Server is running</li>
        <li>✅ Next.js routing is working</li>
        <li>✅ React components are rendering</li>
      </ul>
      <p>
        <a href="/" style={{ color: 'blue', textDecoration: 'underline' }}>
          Go back to homepage
        </a>
      </p>
      <hr />
      <p><strong>Current time:</strong> {new Date().toISOString()}</p>
      <p><strong>Environment:</strong> {process.env.NODE_ENV}</p>
    </div>
  );
}