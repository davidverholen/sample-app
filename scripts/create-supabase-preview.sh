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
# Extract DB_NAME - try multiple patterns as API format may vary
DB_NAME=$(echo "$PROJECT_DETAILS" | grep -o '"db_name":"[^"]*' | cut -d'"' -f4 || echo "")
if [ -z "$DB_NAME" ]; then
  # Try alternative pattern
  DB_NAME=$(echo "$PROJECT_DETAILS" | grep -o '"database_name":"[^"]*' | cut -d'"' -f4 || echo "")
fi
# Default to "postgres" if still empty
if [ -z "$DB_NAME" ]; then
  DB_NAME="postgres"
  echo "⚠️  Could not extract DB_NAME from API response, defaulting to 'postgres'"
fi
echo "✅ Using database name: $DB_NAME"

if [ -z "$DB_HOST" ]; then
  echo "❌ Error: Failed to extract database host from project details"
  echo "Please verify SUPABASE_PROJECT_REF is correct and SUPABASE_ACCESS_TOKEN has proper permissions"
  echo "Response: $PROJECT_DETAILS"
  exit 1
fi

echo "✅ Found database host: $DB_HOST"

# Construct main database connection string
# Supabase connection pooling format (required for external IPs): postgresql://postgres.[PROJECT-REF]:[PASSWORD]@db.[PROJECT-REF].supabase.co:6543/postgres
# Note: Port 6543 (connection pooling) is required for external IPs like GitHub Actions runners
# Port 5432 (direct connection) is blocked by Supabase firewall for external IPs
# URL encode the password to handle special characters
# Use Node.js for URL encoding if available, otherwise use Python, otherwise use the password as-is
if command -v node >/dev/null 2>&1; then
  ENCODED_PASSWORD=$(node -e "console.log(encodeURIComponent(process.argv[1]))" "$SUPABASE_DB_PASSWORD" 2>/dev/null || echo "$SUPABASE_DB_PASSWORD")
elif command -v python3 >/dev/null 2>&1; then
  ENCODED_PASSWORD=$(python3 -c "import urllib.parse; print(urllib.parse.quote('$SUPABASE_DB_PASSWORD', safe=''))" 2>/dev/null || echo "$SUPABASE_DB_PASSWORD")
elif command -v jq >/dev/null 2>&1; then
  ENCODED_PASSWORD=$(printf '%s' "$SUPABASE_DB_PASSWORD" | jq -sRr @uri 2>/dev/null || echo "$SUPABASE_DB_PASSWORD")
else
  # Fallback: use password as-is (might fail if it contains special characters)
  ENCODED_PASSWORD="$SUPABASE_DB_PASSWORD"
  echo "⚠️  Warning: No URL encoding tool available, using password as-is"
fi

# Use the host from API if available, otherwise construct from project ref
# Supabase hosts are typically: db.[PROJECT-REF].supabase.co
if [ -z "$DB_HOST" ] || [ "$DB_HOST" = "null" ]; then
  DB_HOST="db.${SUPABASE_PROJECT_REF}.supabase.co"
  echo "⚠️  Using constructed database host: $DB_HOST"
fi

MAIN_DATABASE_URL="postgresql://postgres.${SUPABASE_PROJECT_REF}:${ENCODED_PASSWORD}@${DB_HOST}:6543/${DB_NAME}?sslmode=require"

# Create PostgreSQL schema using Prisma (which handles connection properly)
echo "📦 Creating PostgreSQL schema: $SCHEMA_NAME"

# Run the schema creation script
# The script will use Prisma Client from the project's node_modules
export DATABASE_URL="$MAIN_DATABASE_URL"
export SCHEMA_NAME="$SCHEMA_NAME"

# Debug: Log connection string format (without password)
echo "🔍 Connection string format: postgresql://postgres.${SUPABASE_PROJECT_REF}:***@${DB_HOST}:6543/${DB_NAME}?sslmode=require"

# Try to create schema with retries (database might be initializing)
max_retries=3
retry=0
while [ $retry -lt $max_retries ]; do
  if node scripts/create-schema.js; then
    echo "✅ Schema created successfully"
    break
  else
    retry=$((retry + 1))
    if [ $retry -lt $max_retries ]; then
      echo "⚠️  Schema creation attempt $retry failed, retrying in 5 seconds..."
      sleep 5
    else
      echo "❌ Error: Failed to create schema after $max_retries attempts"
      echo ""
      echo "This might indicate:"
      echo "  - Database connection string is incorrect"
      echo "  - Database password needs URL encoding (special characters)"
      echo "  - Network connectivity issues from GitHub Actions"
      echo "  - Supabase firewall blocking external connections"
      echo "  - Database host is incorrect"
      echo ""
      echo "Troubleshooting steps:"
      echo "  1. Verify SUPABASE_DB_PASSWORD is correct (extract from Supabase dashboard)"
      echo "  2. Check if password contains special characters that need encoding"
      echo "  3. Verify database host: $DB_HOST"
      echo "  4. Check Supabase project settings for connection restrictions"
      exit 1
    fi
  fi
done

# Construct preview database connection string with search_path
# Format: postgresql://postgres.[PROJECT-REF]:[PASSWORD]@[HOST]:6543/[DB_NAME]?sslmode=require&search_path=preview_pr7
DATABASE_URL="${MAIN_DATABASE_URL}&search_path=${SCHEMA_NAME}"

# Always set outputs (even if empty, to prevent workflow failures)
{
  echo "database-url=$DATABASE_URL"
  echo "instance-name=$INSTANCE_NAME"
  echo "schema-name=$SCHEMA_NAME"
} >> "$GITHUB_OUTPUT"

echo "✅ Preview schema created successfully"
echo "Schema: $SCHEMA_NAME"
echo "DATABASE_URL format: postgresql://postgres.***:***@${DB_HOST}:6543/${DB_NAME}?sslmode=require&search_path=${SCHEMA_NAME}"
exit 0

