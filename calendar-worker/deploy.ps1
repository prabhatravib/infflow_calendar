#!/usr/bin/env pwsh

Write-Host "Building and Deploying Calendar Worker to Cloudflare..." -ForegroundColor Green

# Navigate to web directory and build
Set-Location web
Write-Host "Building web app..." -ForegroundColor Yellow
npm run build:prod

# Check if build was successful
if ($LASTEXITCODE -ne 0) {
    Write-Host "Build failed! Exiting..." -ForegroundColor Red
    exit 1
}

Write-Host "Build successful! Deploying to Cloudflare..." -ForegroundColor Green

# Deploy the worker
Set-Location ..
wrangler deploy

# Check if deployment was successful
if ($LASTEXITCODE -eq 0) {
    $deploymentTime = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    Write-Host "Deployment complete!" -ForegroundColor Green
    Write-Host "Deployment finished at: $deploymentTime" -ForegroundColor Green
    Write-Host "Your calendar should now be accessible ." -ForegroundColor Green
    
    # Play a beep sound to notify completion
    [System.Console]::Beep()
} else {
    Write-Host "Deployment failed!" -ForegroundColor Red
    exit 1
}
