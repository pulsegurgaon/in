#!/bin/bash
set -e

echo "==> Installing dependencies..."
npm install -g pnpm
pnpm install --frozen-lockfile

echo "==> Building frontend..."
export BASE_PATH="/"
export NODE_ENV="production"
# PORT is just needed for vite build config validation — not actually used during build
export PORT="3000"
pnpm --filter @workspace/pulse-gurgaon run build

echo "==> Building API server..."
pnpm --filter @workspace/api-server run build

echo "==> Copying frontend into API server dist..."
mkdir -p artifacts/api-server/dist/public
cp -r artifacts/pulse-gurgaon/dist/public/. artifacts/api-server/dist/public/

echo "==> Build complete!"
