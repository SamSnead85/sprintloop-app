#!/bin/bash
set -e

echo "=== SprintLoop Netlify Build Script ==="
echo ">>> Current directory: $(pwd)"

echo ">>> Step 1: Installing all dependencies..."
npm install --legacy-peer-deps

echo ">>> Step 2: Listing root node_modules/.bin..."
ls -la node_modules/.bin/ | head -20 || echo "No .bin directory at root"

echo ">>> Step 3: Building web app..."
cd apps/web

echo ">>> Current directory after cd: $(pwd)"

# Add root node_modules/.bin to PATH
export PATH="$(pwd)/../../node_modules/.bin:$PATH"
echo ">>> PATH updated to include: $(pwd)/../../node_modules/.bin"

# Check if tsc exists
which tsc || echo "tsc not found in PATH"
which vite || echo "vite not found in PATH"

echo ">>> Running TypeScript compiler..."
tsc -b

echo ">>> Running Vite build..."
vite build

echo ">>> Build complete!"
ls -la dist/
