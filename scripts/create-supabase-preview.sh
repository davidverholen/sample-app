#!/bin/bash
set -e

# Script to create a PostgreSQL schema for a PR preview within the main Supabase project
# Usage: ./create-supabase-preview.sh <branch-name> <pr-number> <access-token> <project-ref>

BRANCH_NAME="$1"
PR_NUMBER="$2"
SUPABASE_ACCESS_TOKEN="$3"
SUPABASE_PROJECT_REF="$4"

# Ensure GITHUB_OUTPUT is set (for GitHub Actions)
if [ -z "$GITHUB_OUTPUT" ]; then
  GITHUB_OUTPUT="/dev/stdout"
fi

# Validate required arguments
if [ -z "$BRANCH_NAME" ] || [ -z "$PR_NUMBER" ]; then
  echo "❌ Error: Missing required arguments"
  echo "Usage: $0 <branch-name> <pr-number> <access-token> <project-ref>"
  exit 1
fi

# Validate required Supabase secrets - fail fast if missing
if [ -z "$SUPABASE_ACCESS_TOKEN" ]; then
  echo "❌ Error: SUPABASE_ACCESS_TOKEN is required but not set"
  echo "Please set SUPABASE_ACCESS_TOKEN in GitHub secrets"
  exit 1
fi

if [ -z "$SUPABASE_PROJECT_REF" ]; then
  echo "❌ Error: SUPABASE_PROJECT_REF is required but not set"
  echo "Please set SUPABASE_PROJECT_REF in GitHub secrets"
  exit 1
fi

# Validate that main database password is available
if [ -z "$SUPABASE_DB_PASSWORD" ]; then
  echo "❌ Error: SUPABASE_DB_PASSWORD is required but not set"
  echo "Please set SUPABASE_DB_PASSWORD in GitHub secrets with your main Supabase project's database password"
  echo "You can find this in: Supabase Dashboard → Project Settings → Database → Connection string"
  exit 1
fi

# Generate schema name: preview_pr{NUMBER}
# PostgreSQL schema names are case-insensitive and max 63 characters
SCHEMA_NAME="preview_pr${PR_NUMBER}"
# Sanitize to ensure valid PostgreSQL identifier (alphanumeric and underscores only)
SCHEMA_NAME=$(echo "$SCHEMA_NAME" | sed 's/[^a-zA-Z0-9_]/_/g' | tr '[:upper:]' '[:lower:]' | cut -c1-63)

# Sanitize branch name for use in instance name (for display/logging)
SANITIZED_BRANCH=$(echo "$BRANCH_NAME" | sed 's/[^a-zA-Z0-9-]/-/g' | tr '[:upper:]' '[:lower:]' | cut -c1-30)
INSTANCE_NAME="preview-${SANITIZED_BRANCH}-pr${PR_NUMBER}"

echo "🚀 Creating PostgreSQL schema for preview: $SCHEMA_NAME"
echo "📋 Instance name: $INSTANCE_NAME"

# Use Supabase Management API to get main project database connection details
API_URL="https://api.supabase.com/v1/projects"

# Get main project details to extract database connection info
echo "📋 Fetching main project details: $SUPABASE_PROJECT_REF"
PROJECT_DETAILS=$(curl -s -X GET "$API_URL/$SUPABASE_PROJECT_REF" \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
  -H "Content-Type: application/json" 2>&1)

# Check if API call was successful
if echo "$PROJECT_DETAILS" | grep -q '"error"'; then
  echo "❌ Error: Failed to fetch project details"
  echo "Response: $PROJECT_DETAILS"
  exit 1
fi

# Extract DB_HOST from nested database.host structure
# The API returns: "database":{"host":"db.xxx.supabase.co",...}
DB_OBJECT=$(echo "$PROJECT_DETAILS" | grep -o '"database":{[^}]*}' || echo "")
DB_HOST=$(echo "$DB_OBJECT" | grep -o '"host":"[^"]*' | cut -d'"' -f4 || echo "")
DB_NAME=$(echo "$PROJECT_DETAILS" | grep -o '"db_name":"[^"]*' | cut -d'"' -f4 || echo "postgres")

if [ -z "$DB_HOST" ]; then
  echo "❌ Error: Failed to extract database host from project details"
  echo "Please verify SUPABASE_PROJECT_REF is correct and SUPABASE_ACCESS_TOKEN has proper permissions"
  echo "Response: $PROJECT_DETAILS"
  exit 1
fi

echo "✅ Found database host: $DB_HOST"

# Construct main database connection string
# Format: postgresql://postgres.[PROJECT-REF]:[PASSWORD]@[HOST]:5432/[DB_NAME]?sslmode=require
MAIN_DATABASE_URL="postgresql://postgres.${SUPABASE_PROJECT_REF}:${SUPABASE_DB_PASSWORD}@${DB_HOST}:5432/${DB_NAME}?sslmode=require"

# Create PostgreSQL schema using Prisma (which handles connection properly)
echo "📦 Creating PostgreSQL schema: $SCHEMA_NAME"

# Use node with Prisma to create the schema
# We'll use a temporary script to execute the schema creation
TEMP_SCRIPT=$(mktemp)
cat > "$TEMP_SCRIPT" << 'EOF'
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: ['error'],
});

async function createSchema() {
  const schemaName = process.env.SCHEMA_NAME;
  if (!schemaName) {
    console.error('❌ Error: SCHEMA_NAME environment variable is not set');
    process.exit(1);
  }

  try {
    // Create schema using raw SQL
    // PostgreSQL identifiers need to be quoted if they contain special characters
    // But our schema name is sanitized, so we can use it directly
    await prisma.$executeRawUnsafe(`CREATE SCHEMA IF NOT EXISTS "${schemaName}"`);
    console.log(`✅ Schema created successfully: ${schemaName}`);
    await prisma.$disconnect();
    process.exit(0);
  } catch (error) {
    console.error(`❌ Error creating schema: ${error.message}`);
    if (error.code) {
      console.error(`   Error code: ${error.code}`);
    }
    await prisma.$disconnect().catch(() => {});
    process.exit(1);
  }
}

createSchema();
EOF

# Run the schema creation script
export DATABASE_URL="$MAIN_DATABASE_URL"
export SCHEMA_NAME="$SCHEMA_NAME"
if ! node "$TEMP_SCRIPT"; then
  echo "❌ Error: Failed to create schema"
  rm -f "$TEMP_SCRIPT"
  exit 1
fi

rm -f "$TEMP_SCRIPT"

# Construct preview database connection string with search_path
# Format: postgresql://postgres.[PROJECT-REF]:[PASSWORD]@[HOST]:5432/[DB_NAME]?sslmode=require&search_path=preview_pr7
DATABASE_URL="${MAIN_DATABASE_URL}&search_path=${SCHEMA_NAME}"

# Always set outputs (even if empty, to prevent workflow failures)
{
  echo "database-url=$DATABASE_URL"
  echo "instance-name=$INSTANCE_NAME"
  echo "schema-name=$SCHEMA_NAME"
} >> "$GITHUB_OUTPUT"

echo "✅ Preview schema created successfully"
echo "Schema: $SCHEMA_NAME"
echo "DATABASE_URL format: postgresql://postgres.***:***@${DB_HOST}:5432/${DB_NAME}?sslmode=require&search_path=${SCHEMA_NAME}"
exit 0

