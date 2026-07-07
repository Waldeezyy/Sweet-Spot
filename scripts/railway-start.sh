#!/bin/sh
set -e

if [ -z "$DATABASE_URL" ]; then
  echo "ERROR: DATABASE_URL is not set on this Railway service."
  echo ""
  echo "Fix:"
  echo "  1. In your Railway project, click '+ New' → Database → PostgreSQL"
  echo "  2. Open your web service → Variables tab"
  echo "  3. Click 'Add Reference' → select Postgres → choose DATABASE_URL"
  echo "  4. Redeploy"
  exit 1
fi

echo "Syncing database schema..."
npx prisma db push

echo "Starting app..."
exec npm start
