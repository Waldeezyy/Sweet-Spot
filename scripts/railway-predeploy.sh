#!/bin/sh
set -e

if [ -z "$DATABASE_URL" ]; then
  echo "ERROR: DATABASE_URL is not set on this Railway service."
  exit 1
fi

echo "Applying database migrations..."
npx prisma migrate deploy

echo "Syncing database schema..."
npx prisma db push --accept-data-loss

if [ "$RUN_DB_SEED" = "true" ]; then
  echo "Running database seed..."
  npx prisma db seed
else
  echo "Skipping seed (set RUN_DB_SEED=true to run patches on deploy)."
fi
