#!/bin/bash -l

# Activate cPanel Node.js virtual environment
source /home/ljxvcewj/nodevenv/rental_contract_management/backend/24/bin/activate

echo "======================================"
echo "🚀 Deploy Frontend - Bich Immobiliare"
echo "======================================"
echo ""
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
# Rimuoviamo la cartella node_modules per essere sicuri di rigenerare i binari corretti
rm -rf node_modules package-lock.json

# Installazione standard (ora che typescript e vite sono in 'dependencies')
npm install

if [ $? -ne 0 ]; then
    echo "❌ Error: npm install failed"
    exit 1
fi
echo "✅ Dependencies installed"

echo "🏗️  Step 3/4: Building production bundle..."
# Usiamo 'npm run build' che cercherà automaticamente i binari locali
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Error: Build failed"
    exit 1
fi
echo "✅ Build completed"

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