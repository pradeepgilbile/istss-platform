#!/bin/bash
# ISTSS Premium Dashboard — One-Click Deploy to Azure SWA
# Run from Azure Cloud Shell: bash deploy.sh

set -e

echo "═══════════════════════════════════════════════"
echo "  ISTSS Dashboard — Deploy to Azure SWA"  
echo "  Datamorphosis Technologies Pvt. Ltd."
echo "═══════════════════════════════════════════════"

cd "$(dirname "$0")/frontend/istss-dashboard"

echo "→ Installing dependencies..."
npm install --silent

echo "→ Building production bundle..."
npm run build

echo "→ Installing SWA CLI..."
npm install -g @azure/static-web-apps-cli --silent 2>/dev/null

echo "→ Deploying to Azure Static Web Apps..."
npx swa deploy ./dist \
  --deployment-token "922f7dc6a15b08bd3c2e64c79d431fa926949656b6c516c9434e54fbe354ccb007-ba71ebfd-b17d-4519-b8aa-df4b5b1964650001522096774200" \
  --env production

echo ""
echo "✅ Deployment complete!"
echo "🌐 https://ambitious-river-096774200.7.azurestaticapps.net"
