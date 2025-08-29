#!/bin/bash

echo "Building calendar worker web app..."

# Clean previous build
rm -rf dist

# Install dependencies
npm install

# Build the app
npm run build

# Verify build output
if [ -d "dist" ]; then
    echo "Build successful! Checking build output..."
    
    # Check if critical files exist
    if [ -f "dist/index.html" ]; then
        echo "✓ index.html exists"
    else
        echo "✗ index.html missing"
        exit 1
    fi
    
    if [ -f "dist/assets/index-*.css" ]; then
        echo "✓ CSS assets exist"
    else
        echo "✗ CSS assets missing"
        exit 1
    fi
    
    if [ -f "dist/assets/index-*.js" ]; then
        echo "✓ JavaScript assets exist"
    else
        echo "✗ JavaScript assets missing"
        exit 1
    fi
    
    echo "Build verification complete!"
else
    echo "Build failed - dist directory not created"
    exit 1
fi
