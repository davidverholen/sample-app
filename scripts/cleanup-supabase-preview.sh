#!/bin/bash
set -e

# Script to cleanup a PostgreSQL schema for a PR preview
# Usage: ./cleanup-supabase-preview.sh <branch-name> <pr-number> <access-token> <project-ref>

BRANCH_NAME="$1"
PR_NUMBER="$2"
SUPABASE_ACCESS_TOKEN="$3"
SUPABASE_PROJECT_REF="$4"

# Validate required arguments
if [ -z "$BRANCH_NAME" ] || [ -z "$PR_NUMBER" ]; then
  echo "❌ Error: Missing required arguments"
  echo "Usage: $0 <branch-name> <pr-number> <access-token> <project-ref>"
  exit 1
fi

# Validate required Supabase secrets
if [ -z "$SUPABASE_ACCESS_TOKEN" ]; then
  echo "❌ Error: SUPABASE_ACCESS_TOKEN is required but not set"
  exit 1
fi

if [ -z "$SUPABASE_PROJECT_REF" ]; then
  echo "❌ Error: SUPABASE_PROJECT_REF is required but not set"
  exit 1
fi

# Validate that main database password is available
if [ -z "$SUPABASE_DB_PASSWORD" ]; then
  echo "❌ Error: SUPABASE_DB_PASSWORD is required but not set"
  echo "Please set SUPABASE_DB_PASSWORD in GitHub secrets with your main Supabase project's database password"
  exit 1
fi

# Generate schema name: preview_pr{NUMBER} (must match create script)
SCHEMA_NAME="preview_pr${PR_NUMBER}"
# Sanitize to ensure valid PostgreSQL identifier (alphanumeric and underscores only)
SCHEMA_NAME=$(echo "$SCHEMA_NAME" | sed 's/[^a-zA-Z0-9_]/_/g' | tr '[:upper:]' '[:lower:]' | cut -c1-63)

# Sanitize branch name for use in instance name (for display/logging)
SANITIZED_BRANCH=$(echo "$BRANCH_NAME" | sed 's/[^a-zA-Z0-9-]/-/g' | tr '[:upper:]' '[:lower:]' | cut -c1-30)
INSTANCE_NAME="preview-${SANITIZED_BRANCH}-pr${PR_NUMBER}"

echo "🧹 Cleaning up PostgreSQL schema: $SCHEMA_NAME"
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

# Extract project reference ID from API response (required for hostname construction)
# Supabase API returns 'ref' field containing the project reference ID (short alphanumeric string)
# This is different from project ID (UUID) and is required for database hostname construction
if command -v jq >/dev/null 2>&1; then
  PROJECT_REF_ID=$(echo "$PROJECT_DETAILS" | jq -r '.ref // .reference_id // .project_ref // ""' 2>/dev/null || echo "")
  
  # Fallback to SUPABASE_PROJECT_REF if not found in API response
  if [ -z "$PROJECT_REF_ID" ] || [ "$PROJECT_REF_ID" = "null" ] || [ "$PROJECT_REF_ID" = "" ]; then
    echo "⚠️  Warning: Project reference ID not found in API response, using SUPABASE_PROJECT_REF"
    PROJECT_REF_ID="$SUPABASE_PROJECT_REF"
  else
    echo "✅ Extracted project reference ID from API response: $PROJECT_REF_ID"
  fi
  
  # Extract DB_NAME from API response (optional, defaults to postgres)
  DB_NAME=$(echo "$PROJECT_DETAILS" | jq -r '.database.db_name // .db_name // .database_name // "postgres"' 2>/dev/null || echo "postgres")
else
  # Fallback if jq is not available (shouldn't happen in GitHub Actions)
  echo "⚠️  Warning: jq not available, using SUPABASE_PROJECT_REF for hostname"
  PROJECT_REF_ID="$SUPABASE_PROJECT_REF"
  DB_NAME=$(echo "$PROJECT_DETAILS" | grep -o '"db_name":"[^"]*' | cut -d'"' -f4 || echo "postgres")
fi

# Construct DB_HOST from project reference ID (extracted from API or fallback to SUPABASE_PROJECT_REF)
# Supabase Transaction Mode hosts are ALWAYS: db.[PROJECT-REF].supabase.co
# The project reference ID is a short alphanumeric string (not the UUID project ID)
# This must be extracted from the API response to ensure correct hostname format
DB_HOST="db.${PROJECT_REF_ID}.supabase.co"
echo "✅ Using database host: $DB_HOST (constructed from project reference ID)"

# Construct main database connection string
# Use Transaction Mode pooling (port 6543) for external IPs like GitHub Actions runners
# Protocol: postgres:// (not postgresql://) for Transaction Mode
# Username: postgres (NO project ref prefix) for Transaction Mode
# REQUIRED: ?pgbouncer=true parameter tells Prisma to disable prepared statements (Transaction Mode doesn't support them)
# Recommended: ?connection_limit=1 for serverless/CI environments
# Optional: ?connect_timeout=30 for serverless cold starts
# Port 5432 (direct connection) is blocked by Supabase firewall for external IPs
# URL encode the password to handle special characters
if command -v node >/dev/null 2>&1; then
  ENCODED_PASSWORD=$(node -e "console.log(encodeURIComponent(process.argv[1]))" "$SUPABASE_DB_PASSWORD" 2>/dev/null || echo "$SUPABASE_DB_PASSWORD")
elif command -v python3 >/dev/null 2>&1; then
  ENCODED_PASSWORD=$(python3 -c "import urllib.parse; print(urllib.parse.quote('$SUPABASE_DB_PASSWORD', safe=''))" 2>/dev/null || echo "$SUPABASE_DB_PASSWORD")
elif command -v jq >/dev/null 2>&1; then
  ENCODED_PASSWORD=$(printf '%s' "$SUPABASE_DB_PASSWORD" | jq -sRr @uri 2>/dev/null || echo "$SUPABASE_DB_PASSWORD")
else
  ENCODED_PASSWORD="$SUPABASE_DB_PASSWORD"
  echo "⚠️  Warning: No URL encoding tool available, using password as-is"
fi
MAIN_DATABASE_URL="postgres://postgres:${ENCODED_PASSWORD}@${DB_HOST}:6543/${DB_NAME}?sslmode=require&pgbouncer=true&connection_limit=1&connect_timeout=30"

# Drop PostgreSQL schema using Prisma
echo "🗑️  Dropping PostgreSQL schema: $SCHEMA_NAME"

# Use node with Prisma to drop the schema
TEMP_SCRIPT=$(mktemp)
cat > "$TEMP_SCRIPT" << 'EOF'
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: ['error'],
});

async function dropSchema() {
  const schemaName = process.env.SCHEMA_NAME;
  if (!schemaName) {
    console.error('❌ Error: SCHEMA_NAME environment variable is not set');
    process.exit(1);
  }

  try {
    // Check if schema exists first
    // Use template literal for schema name (already sanitized)
    const schemas = await prisma.$queryRawUnsafe(`
      SELECT schema_name 
      FROM information_schema.schemata 
      WHERE schema_name = '${schemaName}'
    `);

    if (Array.isArray(schemas) && schemas.length === 0) {
      console.log(`⚠️  Schema not found: ${schemaName}`);
      console.log('Schema may have already been deleted or never created');
      await prisma.$disconnect();
      process.exit(0);
    }

    // Drop schema with CASCADE to remove all objects in the schema
    await prisma.$executeRawUnsafe(`DROP SCHEMA IF EXISTS "${schemaName}" CASCADE`);
    console.log(`✅ Schema dropped successfully: ${schemaName}`);
    await prisma.$disconnect();
    process.exit(0);
  } catch (error) {
    console.error(`❌ Error dropping schema: ${error.message}`);
    if (error.code) {
      console.error(`   Error code: ${error.code}`);
    }
    await prisma.$disconnect().catch(() => {});
    process.exit(1);
  }
}

dropSchema();
EOF

# Run the schema drop script
export DATABASE_URL="$MAIN_DATABASE_URL"
export SCHEMA_NAME="$SCHEMA_NAME"
if ! node "$TEMP_SCRIPT"; then
  echo "❌ Error: Failed to drop schema"
  rm -f "$TEMP_SCRIPT"
  exit 1
fi

rm -f "$TEMP_SCRIPT"

echo "✅ Preview schema cleanup completed"
exit 0

