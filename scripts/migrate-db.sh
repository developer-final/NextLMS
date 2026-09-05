#!/usr/bin/env bash
# ==============================================================================
# NextLMS Standalone Database Migration Runner
# Usage:
#   ./scripts/migrate-db.sh          # Auto-detects environment
#   ./scripts/migrate-db.sh --prod   # Uses .env.production.local
#   ./scripts/migrate-db.sh --dev    # Uses .env.development.local
# ==============================================================================

set -e

MODE="${1:-auto}"

echo "=========================================================="
echo "🗄️ NextLMS Standalone Database Migration Runner"
echo "=========================================================="

ENV_FILE=""

if [ "$MODE" = "--prod" ]; then
  ENV_FILE=".env.production.local"
elif [ "$MODE" = "--dev" ]; then
  ENV_FILE=".env.development.local"
else
  # Auto-detection
  if [ -f ".env.production.local" ]; then
    ENV_FILE=".env.production.local"
  elif [ -f ".env" ]; then
    ENV_FILE=".env"
  elif [ -f ".env.development.local" ]; then
    ENV_FILE=".env.development.local"
  fi
fi

if [ -n "$ENV_FILE" ] && [ -f "$ENV_FILE" ]; then
  echo "🔑 Using environment: $ENV_FILE"
  npx dotenv -e "$ENV_FILE" -- prisma migrate deploy
elif [ -n "$DATABASE_URL" ]; then
  echo "🔑 Using active system DATABASE_URL"
  npx prisma migrate deploy
else
  echo "❌ Error: Could not determine DATABASE_URL or find environment configuration file."
  exit 1
fi

echo "✅ Migration completed successfully."
echo "=========================================================="
