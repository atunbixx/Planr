export default function TestPage() {
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Test Page</h1>
      <p>If you can see this, the basic page rendering works.</p>
      <button onClick={() => alert('Button works!')}>
        Test Button
      </button>
    </div>
  )
}