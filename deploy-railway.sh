#!/bin/bash

echo "🚂 Railway Deployment Setup for Wedding Planner v2"
echo "=================================================="

# Install Railway CLI if not installed
if ! command -v railway &> /dev/null; then
    echo "📦 Installing Railway CLI..."
    npm install -g @railway/cli
fi

# Login to Railway
echo "🔐 Logging in to Railway..."
railway login

# Initialize Railway project
echo "🚀 Setting up Railway project..."
railway init

# Deploy
echo "🌐 Deploying to Railway..."
railway up

echo ""
echo "✅ Deployment Complete!"
echo "Your app is now running on Railway"
echo ""
echo "🔧 Next Steps:"
echo "1. Set environment variables: railway variables"
echo "2. Connect custom domain: railway domains"
echo "3. Monitor deployment: railway status"