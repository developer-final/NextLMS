#!/usr/bin/env bash
# ==============================================================================
# NextLMS VPS (Bare-Metal / PM2) Automated Update & Deployment Script
# Guarantees database migrations are executed before building and starting new code
# ==============================================================================

set -e

echo "=========================================================="
echo "⚡ NextLMS VPS Deployment & Update Pipeline"
echo "=========================================================="

# 1. Pull latest code from Git if available
if [ -d ".git" ]; then
  echo "📥 Step 1: Pulling latest changes from Git repository..."
  git pull origin main || {
    echo "⚠️ Warning: git pull failed or branch is not main. Continuing with current codebase..."
  }
else
  echo "ℹ️ Step 1: Not a Git repository, using existing local files."
fi

# 2. Check environment configuration
ENV_FILE=""
if [ -f ".env.production.local" ]; then
  ENV_FILE=".env.production.local"
elif [ -f ".env" ]; then
  ENV_FILE=".env"
else
  echo "❌ Error: Neither .env.production.local nor .env found."
  echo "Please create your environment configuration before deploying."
  exit 1
fi
echo "🔑 Using environment configuration: $ENV_FILE"

# 3. Install / update dependencies
echo "📦 Step 2: Installing project dependencies..."
npm install --prefer-offline --no-audit

# 4. Mandatory Database Migration BEFORE code build/restart
echo "🗄️ Step 3: Executing Database Migration (Prisma Migrate Deploy)..."
if [ "$ENV_FILE" = ".env.production.local" ]; then
  npm run db:migrate:deploy:prod || {
    echo "❌ CRITICAL ERROR: Database migration failed!"
    echo "Aborting deployment to prevent mismatch between schema and active database."
    exit 1
  }
else
  npx dotenv -e "$ENV_FILE" -- prisma migrate deploy || {
    echo "❌ CRITICAL ERROR: Database migration failed!"
    echo "Aborting deployment to prevent mismatch between schema and active database."
    exit 1
  }
fi
echo "✅ Database migrations applied successfully."

# 5. Generate Prisma Client
echo "⚙️ Step 4: Generating Prisma Client..."
npx prisma generate

# 6. Build Next.js production bundle
echo "🏗️ Step 5: Building Next.js production bundle..."
npm run build

# 7. Restart Application Service (PM2 / Systemd)
echo "🔄 Step 6: Reloading application service..."
if command -v pm2 >/dev/null 2>&1; then
  if pm2 describe nextlms >/dev/null 2>&1; then
    pm2 reload nextlms --update-env
  elif pm2 describe nextlms_web >/dev/null 2>&1; then
    pm2 reload nextlms_web --update-env
  else
    echo "PM2 process not found, starting a new process named 'nextlms'..."
    pm2 start npm --name "nextlms" -- start
  fi
  echo "PM2 status:"
  pm2 status
else
  echo "ℹ️ PM2 is not installed globally. If using systemd or another process manager,"
  echo "please restart your service now (e.g., sudo systemctl restart nextlms)."
fi

echo "=========================================================="
echo "🎉 NextLMS VPS Deployment Completed Successfully!"
echo "=========================================================="
