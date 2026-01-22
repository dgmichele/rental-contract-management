#!/bin/bash

# 1. Attivazione ambiente Node.js (usiamo quello del backend che funziona)
source /home/ljxvcewj/nodevenv/rental_contract_management/backend/24/bin/activate

# 2. Ci spostiamo nella cartella del frontend
cd /home/ljxvcewj/rental_contract_management/frontend

echo "======================================"
echo "🚀 Deploy Frontend - Bich Immobiliare"
echo "======================================"

echo "🔄 Step 1/4: Pulling latest changes from Git..."
git pull origin main
echo "✅ Git pull completed"

echo "📦 Step 2/4: Installing dependencies..."
# Forziamo l'installazione di tutto (anche devDependencies)
npm install --include=dev
echo "✅ Dependencies installed"

echo "🏗️  Step 3/4: Building production bundle..."
# Ora che Node è attivo, 'npm run build' troverà 'tsc' e 'vite' senza problemi
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Error: Build failed"
    exit 1
fi
echo "✅ Build completed"

echo "🧹 Step 4/4: Cleaning up cache (optional)..."
# In Vite non è strettamente necessario, ma utile se avessi file legacy
echo "🎉 DEPLOY COMPLETATO CON SUCCESSO!"