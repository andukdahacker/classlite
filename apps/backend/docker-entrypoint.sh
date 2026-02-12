#!/bin/sh
set -e

# Run database migrations if migration files exist
# Migrations are created in Story 3.5.2 (database-migration-strategy)
if [ -d "/app/packages/db/prisma/migrations" ]; then
  echo "Applying database migrations..."
  cd /app/packages/db
  npx prisma migrate deploy
  cd /app/apps/backend
fi

exec node dist/index.js
