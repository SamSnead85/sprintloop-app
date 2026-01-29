#!/bin/bash
set -e

echo "=== SprintLoop Netlify Build Script ==="
echo ">>> Current directory: $(pwd)"
echo ">>> Node version: $(node -v)"
echo ">>> NPM version: $(npm -v)"

echo ">>> Step 1: Installing all dependencies..."
npm install --legacy-peer-deps --include=dev

echo ">>> Step 2: Installing build tools explicitly..."
npm install typescript@5.7.3 vite@6.0.7 --save-dev

echo ">>> Step 3: Listing node_modules/.bin..."
ls -la node_modules/.bin/ | grep -E "tsc|vite" || echo "tsc/vite not found at root"

echo ">>> Step 4: Building web app from apps/web directory..."
cd apps/web

echo ">>> Current directory: $(pwd)"

# Try multiple approaches to find tsc and vite
if [ -f "../../node_modules/.bin/tsc" ]; then
    echo ">>> Using tsc from root node_modules"
    ../../node_modules/.bin/tsc -b
elif command -v tsc &> /dev/null; then
    echo ">>> Using tsc from PATH"
    tsc -b
else
    echo ">>> ERROR: tsc not found!"
    exit 1
fi

if [ -f "../../node_modules/.bin/vite" ]; then
    echo ">>> Using vite from root node_modules"
    ../../node_modules/.bin/vite build
elif command -v vite &> /dev/null; then
    echo ">>> Using vite from PATH"
    vite build
else
    echo ">>> ERROR: vite not found!"
    exit 1
fi

echo ">>> Build complete!"
ls -la dist/
