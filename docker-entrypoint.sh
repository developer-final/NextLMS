#!/bin/sh
set -e

# ==============================================================================
# NextLMS Docker Entrypoint
# Automatically runs Prisma database migrations before launching the application
# ==============================================================================

echo "=================================================="
echo "🚀 Starting NextLMS Application Container"
echo "=================================================="

# Check if DATABASE_URL is available
if [ -n "$DATABASE_URL" ]; then
  echo "📦 Database URL detected. Applying database migrations..."
  
  # Try running prisma migrate deploy using local CLI or npx
  if [ -f "./node_modules/.bin/prisma" ]; then
    ./node_modules/.bin/prisma migrate deploy
  else
    npx prisma migrate deploy
  fi

  MIGRATION_STATUS=$?
  if [ $MIGRATION_STATUS -eq 0 ]; then
    echo "✅ Database migrations applied successfully."
  else
    echo "❌ Error: Database migration failed with exit code $MIGRATION_STATUS"
    exit 1
  fi
else
  echo "⚠️ DATABASE_URL environment variable is not defined. Skipping migration."
fi

echo "🚀 Launching Next.js server on port ${PORT:-3000}..."
echo "=================================================="

# Hand over execution to the main container command (e.g., node server.js)
exec "$@"
