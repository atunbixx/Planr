const http = require('http');

// Create a simple test server
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(`
    <html>
      <head><title>Test Server</title></head>
      <body>
        <h1>Server is working!</h1>
        <p>Time: ${new Date().toISOString()}</p>
        <p>URL: ${req.url}</p>
      </body>
    </html>
  `);
});

server.listen(3001, '0.0.0.0', () => {
  console.log('Test server running at:');
  console.log('- http://localhost:3001');
  console.log('- http://127.0.0.1:3001');
  console.log('- http://0.0.0.0:3001');
});

server.on('error', (err) => {
  console.error('Server error:', err);
});