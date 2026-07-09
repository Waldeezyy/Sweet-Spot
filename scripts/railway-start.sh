#!/bin/sh
set -e

if [ "$RUN_DB_PUSH" = "true" ]; then
  echo "Syncing database schema..."
  npx prisma db push --accept-data-loss --skip-generate
fi

if [ "$RUN_DB_SEED" = "true" ]; then
  echo "Running database seed..."
  npx prisma db seed
fi

echo "Starting app..."
exec npm start
