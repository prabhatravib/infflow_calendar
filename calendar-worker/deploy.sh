#!/bin/bash

echo "Deploying Calendar Worker to Cloudflare..."

# Navigate to web directory and build
cd web
echo "Building web app..."
npm run build:prod

# Check if build was successful
if [ $? -ne 0 ]; then
    echo "Build failed! Exiting..."
    exit 1
fi

echo "Build successful! Deploying to Cloudflare..."

# Deploy the worker
cd ..
wrangler deploy

echo "Deployment complete!"
echo "Your calendar should now be accessible without the static empty page issue."
