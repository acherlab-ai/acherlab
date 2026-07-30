#!/bin/bash
# Deploy lab.acherlab.xyz to Cloudflare Pages
# Yêu cầu: node, npm, wrangler

set -e

echo "=== Deploy lab.acherlab.xyz ==="

# 1. Build frontend
echo "→ Building frontend..."
cd frontend
npm install
npx vite build

# 2. Deploy to Cloudflare Pages
echo "→ Deploying to Cloudflare Pages..."
npx wrangler pages deploy dist/ --project-name acherlab --commit-dirty=true

echo "=== Done! ==="
echo "→ Config domain lab.acherlab.xyz in Cloudflare Dashboard"
echo ""
echo "→ Backend deploy: chạy riêng trên VPS"
echo "  cd backend && npm install && node src/index.js"
