#!/bin/bash

echo "🚀 Vercel Deployment Setup for Wedding Planner v2"
echo "=================================================="

# Install Vercel CLI if not installed
if ! command -v vercel &> /dev/null; then
    echo "📦 Installing Vercel CLI..."
    npm i -g vercel
fi

# Deploy to Vercel
echo "🌐 Deploying to Vercel..."
echo "This will:"
echo "1. Build your application"
echo "2. Deploy to Vercel's CDN"
echo "3. Set up automatic deployments from git"
echo "4. Provide a production URL"
echo ""

# Run deployment
vercel --prod

echo ""
echo "✅ Deployment Complete!"
echo "Your app is now live at the URL shown above"
echo ""
echo "🔧 Next Steps:"
echo "1. Set up environment variables in Vercel dashboard"
echo "2. Configure custom domain (optional)"
echo "3. Set up monitoring alerts"