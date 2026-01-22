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
# Forziamo l'ambiente a development per assicurarci che tsc e vite vengano installati
export NODE_ENV=development

# Installazione pulita e forzata
npm install --include=dev --prefer-offline --no-audit

if [ $? -ne 0 ]; then
    echo "❌ Error: npm install failed"
    exit 1
fi
echo "✅ Dependencies installed"

echo "🏗️  Step 3/4: Building production bundle..."
# Usiamo il percorso diretto al binario locale per evitare ambiguità con npx
./node_modules/.bin/tsc -b && ./node_modules/.bin/vite build

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