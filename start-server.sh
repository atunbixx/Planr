#!/bin/bash

echo "🚀 Starting Wedding Planner Server..."
echo "📍 Current directory: $(pwd)"

# Kill any existing processes on common ports
echo "🔧 Cleaning up existing processes..."
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
lsof -ti:4000 | xargs kill -9 2>/dev/null || true
lsof -ti:5555 | xargs kill -9 2>/dev/null || true

# Start the server with multiple binding options
echo "🌐 Starting server on multiple interfaces..."

# Try different approaches
export HOSTNAME=0.0.0.0
export PORT=5555

echo "📡 Starting Next.js server..."
npm run dev -- --port 5555 --hostname 0.0.0.0 &
SERVER_PID=$!

sleep 3

echo "📊 Server Status:"
echo "   Process ID: $SERVER_PID"
echo "   Port 5555 status: $(lsof -i :5555 2>/dev/null || echo 'Not found')"

echo ""
echo "🌐 Try these URLs in your browser:"
echo "   http://localhost:5555"
echo "   http://127.0.0.1:5555"
echo "   http://0.0.0.0:5555"
echo "   http://192.168.100.231:5555"

echo ""
echo "🔍 Testing connectivity..."
sleep 2

# Test different addresses
for addr in localhost 127.0.0.1 192.168.100.231; do
    echo -n "   Testing $addr:5555... "
    if curl -s --connect-timeout 2 http://$addr:5555 > /dev/null 2>&1; then
        echo "✅ SUCCESS"
    else
        echo "❌ FAILED"
    fi
done

echo ""
echo "🎯 If none work in browser, the issue is likely:"
echo "   • Browser security settings"
echo "   • System firewall"
echo "   • Antivirus software"
echo "   • Proxy settings"

echo ""
echo "⏸️  Press Ctrl+C to stop the server"
wait $SERVER_PID