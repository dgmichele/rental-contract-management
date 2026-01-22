#!/bin/bash -l

# Add potential cPanel Node.js paths (adjust version if needed)
export PATH=/opt/cpanel/ea-nodejs22/bin:/opt/cpanel/ea-nodejs20/bin:/opt/cpanel/ea-nodejs18/bin:/opt/cpanel/ea-nodejs16/bin:$PATH

# Force load user environment variables to ensure npm is found
export PATH=$PATH:/usr/local/bin
[ -f ~/.bashrc ] && source ~/.bashrc
[ -f ~/.bash_profile ] && source ~/.bash_profile

echo "======================================"
echo "🚀 Deploy Frontend - Bich Immobiliare"
echo "======================================"
echo ""

echo "🔄 Step 1/4: Pulling latest changes from Git..."
git pull origin main
if [ $? -ne 0 ]; then
  echo "❌ Error: Git pull failed"
  exit 1
fi
echo "✅ Git pull completed"
echo ""

echo "📦 Step 2/4: Installing dependencies..."
npm install
if [ $? -ne 0 ]; then
  echo "❌ Error: npm install failed"
  exit 1
fi
echo "✅ Dependencies installed"
echo ""

echo "🏗️  Step 3/4: Building production bundle..."
npm run build
if [ $? -ne 0 ]; then
  echo "❌ Error: Build failed"
  exit 1
fi
echo "✅ Build completed"
echo ""

echo "📋 Step 4/4: Copying .htaccess to dist..."
if [ -f .htaccess ]; then
  cp .htaccess dist/.htaccess
  echo "✅ .htaccess copied"
else
  echo "⚠️  Warning: .htaccess not found, skipping"
fi
echo ""

echo "======================================"
echo "✅ Deploy completed successfully!"
echo "======================================"
echo ""
echo "🌐 Visit: https://contratti.bichimmobiliare.it"
echo ""