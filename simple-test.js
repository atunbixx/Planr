const http = require('http');
const fs = require('fs');

const server = http.createServer((req, res) => {
  console.log(`📥 Request: ${req.method} ${req.url} from ${req.connection.remoteAddress}`);
  
  res.writeHead(200, { 
    'Content-Type': 'text/html',
    'Access-Control-Allow-Origin': '*'
  });
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <title>Simple Test Server</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 2rem; background: #f0f8ff; }
            .status { padding: 1rem; background: #d4edda; border-radius: 5px; margin: 1rem 0; }
        </style>
    </head>
    <body>
        <div class="status">
            <h1>🎉 Connection Successful!</h1>
            <p><strong>Time:</strong> ${new Date().toISOString()}</p>
            <p><strong>URL:</strong> ${req.url}</p>
            <p><strong>Method:</strong> ${req.method}</p>
            <p><strong>User Agent:</strong> ${req.headers['user-agent'] || 'Unknown'}</p>
            <p><strong>Remote Address:</strong> ${req.connection.remoteAddress}</p>
        </div>
        
        <div class="status">
            <h2>✅ System is working correctly</h2>
            <p>If you can see this page, your browser and network are functioning properly.</p>
            <p>The issue with the Next.js app may be:</p>
            <ul>
                <li>Port conflict</li>
                <li>Process binding issue</li>
                <li>Next.js configuration problem</li>
                <li>Browser cache/DNS issue</li>
            </ul>
        </div>
        
        <div class="status">
            <h2>🔗 Next Steps</h2>
            <p>Try these solutions:</p>
            <ol>
                <li>Clear all browser cache and cookies</li>
                <li>Try a different browser</li>
                <li>Try incognito/private mode</li>
                <li>Restart your computer</li>
                <li>Check if antivirus/firewall is blocking connections</li>
            </ol>
        </div>
    </body>
    </html>
  `;
  
  res.end(html);
});

const PORT = 9000;
const HOST = '127.0.0.1';

server.listen(PORT, HOST, () => {
  console.log(`🚀 Simple test server running at:`);
  console.log(`   http://${HOST}:${PORT}`);
  console.log(`   http://localhost:${PORT}`);
  console.log(`\n🔍 Testing network connectivity...`);
});

server.on('error', (err) => {
  console.error('❌ Server error:', err);
  process.exit(1);
});

// Test the connection ourselves
setTimeout(() => {
  const testReq = http.get(`http://${HOST}:${PORT}`, (res) => {
    console.log(`✅ Self-test successful: ${res.statusCode}`);
  });
  
  testReq.on('error', (err) => {
    console.error(`❌ Self-test failed: ${err.message}`);
  });
}, 1000);

console.log('Starting simple test server...');