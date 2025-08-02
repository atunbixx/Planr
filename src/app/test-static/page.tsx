export default function TestStatic() {
  return (
    <div style={{ padding: '20px' }}>
      <h1>Static Test Page</h1>
      <p>If you can see this, Next.js is working.</p>
      <p>Current time: {new Date().toISOString()}</p>
    </div>
  )
}