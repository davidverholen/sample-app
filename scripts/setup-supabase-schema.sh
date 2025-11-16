#!/bin/bash
set -e

# Script to set up the main Supabase database schema
# This should be run once to initialize the database

echo "🗄️  Setting up Supabase database schema..."

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  echo "❌ Error: DATABASE_URL environment variable is not set"
  echo "Please set DATABASE_URL to your Supabase connection string"
  exit 1
fi

echo "📦 Generating Prisma Client..."
npx prisma generate

echo "📊 Pushing Prisma schema to database..."
npx prisma db push --accept-data-loss

echo "🌱 Seeding database..."
npm run db:seed || echo "⚠️  Seeding failed or not configured, continuing..."

echo "✅ Database schema setup complete!"
echo ""
echo "You can verify the setup by:"
echo "  1. Checking Supabase dashboard - should show tables"
echo "  2. Running: npx prisma studio"
echo "  3. Running: supabase db diff"

