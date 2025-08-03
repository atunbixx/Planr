export default function HtmlSignIn() {
  return (
    <div style={{ padding: '40px', fontFamily: 'Arial, sans-serif' }}>
      <h1>HTML Sign-In Test</h1>
      <p>If you can see this, the page is loading correctly.</p>
      
      <div style={{ marginTop: '20px' }}>
        <button 
          onClick={() => {
            console.log('Button clicked')
            alert('Button works!')
          }}
          style={{
            padding: '10px 20px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Test Button
        </button>
      </div>

      <div style={{ marginTop: '20px', padding: '20px', backgroundColor: '#f8f9fa', border: '1px solid #dee2e6' }}>
        <h3>Debug Info:</h3>
        <p>URL: {process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Present' : 'Missing'}</p>
        <p>Key: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Present' : 'Missing'}</p>
        <p>Window: {typeof window !== 'undefined' ? 'Available' : 'Not available'}</p>
      </div>

      <div style={{ marginTop: '20px' }}>
        <a href="/basic-signin" style={{ color: '#007bff', textDecoration: 'underline' }}>
          Try Basic Sign-In
        </a>
      </div>
    </div>
  )
}