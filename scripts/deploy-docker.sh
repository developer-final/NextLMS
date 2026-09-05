#!/usr/bin/env bash
# ==============================================================================
# NextLMS Docker Automated Update & Deployment Script
# Ensures database migrations run before launching new code versions
# ==============================================================================

set -e

echo "=========================================================="
echo "🐳 NextLMS Docker Deployment & Update Pipeline"
echo "=========================================================="

# 1. Pull latest code if this is a git repository
if [ -d ".git" ]; then
  echo "📥 Step 1: Pulling latest changes from Git repository..."
  git pull origin main || {
    echo "⚠️ Warning: git pull failed or branch is not main. Continuing with current codebase..."
  }
else
  echo "ℹ️ Step 1: Not a Git repository, using existing local files."
fi

# 2. Check environment configuration
if [ ! -f ".env.production.local" ] && [ ! -f ".env" ]; then
  echo "❌ Error: Neither .env.production.local nor .env found."
  echo "Please copy .env.example to .env.production.local and configure your secrets first."
  exit 1
fi

# 3. Build updated Docker images
echo "🔨 Step 2: Building updated Docker images..."
docker compose build --pull

# 4. Apply Database Migrations before deploying new application code
echo "📦 Step 3: Running database migrations (Prisma Migrate Deploy)..."
docker compose run --rm app ./node_modules/.bin/prisma migrate deploy || {
  echo "❌ Error: Database migration failed! Aborting deployment to protect running application."
  exit 1
}

# 5. Start / Restart containers with zero-downtime recreation
echo "🚀 Step 4: Launching updated services..."
docker compose up -d

# 6. Cleanup dangling / unused images to save disk space
echo "🧹 Step 5: Cleaning up unused Docker artifacts..."
docker image prune -f || true

echo "=========================================================="
echo "✅ NextLMS Docker Deployment Completed Successfully!"
echo "Status of running containers:"
docker compose ps
echo "=========================================================="
