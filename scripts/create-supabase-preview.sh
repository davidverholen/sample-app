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
PROJECT_DETAILS=$(curl -s -w "\n%{http_code}" -X GET "$API_URL/$SUPABASE_PROJECT_REF" \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
  -H "Content-Type: application/json" 2>&1)

# Extract HTTP status code (last line)
HTTP_CODE=$(echo "$PROJECT_DETAILS" | tail -n 1)
PROJECT_DETAILS=$(echo "$PROJECT_DETAILS" | sed '$d')

# Validate API response and project status
if [ "$HTTP_CODE" != "200" ]; then
  echo "❌ Error: Failed to fetch project details"
  echo "HTTP Status Code: $HTTP_CODE"
  
  # Parse error message if available
  if command -v jq >/dev/null 2>&1; then
    ERROR_MSG=$(echo "$PROJECT_DETAILS" | jq -r '.message // .error // "Unknown error"' 2>/dev/null || echo "")
    if [ -n "$ERROR_MSG" ] && [ "$ERROR_MSG" != "null" ]; then
      echo "Error message: $ERROR_MSG"
    fi
  fi
  
  # Provide specific guidance based on HTTP status
  case "$HTTP_CODE" in
    401)
      echo ""
      echo "💡 This indicates an authentication failure:"
      echo "   - SUPABASE_ACCESS_TOKEN is incorrect or expired"
      echo "   - Token may not have required permissions (projects:read)"
      echo ""
      echo "🔧 Troubleshooting:"
      echo "   1. Verify SUPABASE_ACCESS_TOKEN in GitHub secrets"
      echo "   2. Check token in Supabase Dashboard → Account Settings → Access Tokens"
      echo "   3. Ensure token has 'projects:read' permission"
      echo "   4. Generate a new token if needed"
      ;;
    404)
      echo ""
      echo "💡 This indicates the project was not found:"
      echo "   - SUPABASE_PROJECT_REF is incorrect"
      echo "   - Project may have been deleted or doesn't exist"
      echo ""
      echo "🔧 Troubleshooting:"
      echo "   1. Verify SUPABASE_PROJECT_REF in GitHub secrets"
      echo "   2. Check project reference ID in Supabase Dashboard → Project Settings → General"
      echo "   3. Ensure the project reference matches exactly (case-sensitive)"
      ;;
    403)
      echo ""
      echo "💡 This indicates insufficient permissions:"
      echo "   - Access token doesn't have required permissions"
      echo "   - Project may belong to a different organization"
      echo ""
      echo "🔧 Troubleshooting:"
      echo "   1. Verify access token has 'projects:read' permission"
      echo "   2. Check if project is in a different organization"
      echo "   3. Generate a new token with proper permissions"
      ;;
    *)
      echo ""
      echo "💡 This indicates an API error:"
      echo "   - Supabase API may be experiencing issues"
      echo "   - Network connectivity problem"
      echo ""
      echo "🔧 Troubleshooting:"
      echo "   1. Check Supabase status page"
      echo "   2. Verify network connectivity"
      echo "   3. Retry the workflow"
      ;;
  esac
  
  echo ""
  echo "Full API response (sanitized):"
  echo "$PROJECT_DETAILS" | sed 's/\([Pp]assword\|[Tt]oken\|[Aa]uth\)[^"]*"[^"]*": "[^"]*"/\1***": "***"/g' | head -20
  exit 1
fi

# Validate that we got valid JSON response
if ! echo "$PROJECT_DETAILS" | jq empty 2>/dev/null; then
  echo "❌ Error: Invalid JSON response from Supabase API"
  echo "Response: $PROJECT_DETAILS" | head -10
  echo ""
  echo "💡 This might indicate:"
  echo "   - API endpoint changed"
  echo "   - Network issue causing incomplete response"
  echo "   - Supabase API issue"
  exit 1
fi

# Extract and validate project information
if command -v jq >/dev/null 2>&1; then
  # Extract project details for validation
  PROJECT_NAME=$(echo "$PROJECT_DETAILS" | jq -r '.name // "Unknown"' 2>/dev/null || echo "Unknown")
  PROJECT_STATUS=$(echo "$PROJECT_DETAILS" | jq -r '.status // .state // "unknown"' 2>/dev/null || echo "unknown")
  PROJECT_ID=$(echo "$PROJECT_DETAILS" | jq -r '.id // .project_id // "unknown"' 2>/dev/null || echo "unknown")
  
  # Extract project reference ID from API response (required for hostname construction)
  # Supabase API returns 'ref' field containing the project reference ID (short alphanumeric string)
  # This is different from project ID (UUID) and is required for database hostname construction
  PROJECT_REF_ID=$(echo "$PROJECT_DETAILS" | jq -r '.ref // .reference_id // .project_ref // ""' 2>/dev/null || echo "")
  
  # Fallback to SUPABASE_PROJECT_REF if not found in API response
  if [ -z "$PROJECT_REF_ID" ] || [ "$PROJECT_REF_ID" = "null" ] || [ "$PROJECT_REF_ID" = "" ]; then
    echo "⚠️  Warning: Project reference ID not found in API response, using SUPABASE_PROJECT_REF"
    PROJECT_REF_ID="$SUPABASE_PROJECT_REF"
  else
    echo "✅ Extracted project reference ID from API response"
  fi
  
  # Log project information (without exposing secrets)
  echo "✅ Project details retrieved:"
  echo "   Name: $PROJECT_NAME"
  echo "   Status: $PROJECT_STATUS"
  echo "   ID: $PROJECT_ID"
  echo "   Reference ID: $PROJECT_REF_ID"
  
  # Validate project status
  if [ "$PROJECT_STATUS" = "INACTIVE" ] || [ "$PROJECT_STATUS" = "PAUSED" ] || [ "$PROJECT_STATUS" = "paused" ]; then
    echo ""
    echo "❌ Error: Supabase project is paused or inactive"
    echo "   Project status: $PROJECT_STATUS"
    echo ""
    echo "💡 This project cannot accept connections while paused"
    echo ""
    echo "🔧 Troubleshooting:"
    echo "   1. Go to Supabase Dashboard → Project Settings"
    echo "   2. Resume or reactivate the project"
    echo "   3. Wait for project to fully initialize (may take 1-2 minutes)"
    echo "   4. Retry the workflow"
    exit 1
  fi
  
  # Check if project has database enabled
  DB_ENABLED=$(echo "$PROJECT_DETAILS" | jq -r '.database // .db_enabled // "true"' 2>/dev/null || echo "true")
  if [ "$DB_ENABLED" = "false" ] || [ "$DB_ENABLED" = "null" ]; then
    echo "⚠️  Warning: Database may not be enabled for this project"
  fi
  
  # Validate project ID matches project ref (if available)
  if [ "$PROJECT_ID" != "unknown" ] && [ "$PROJECT_ID" != "$SUPABASE_PROJECT_REF" ]; then
    echo "⚠️  Warning: Project ID from API ($PROJECT_ID) doesn't match SUPABASE_PROJECT_REF ($SUPABASE_PROJECT_REF)"
    echo "   This might be normal if using project reference vs project ID"
  fi
else
  # Fallback if jq is not available (shouldn't happen in GitHub Actions)
  echo "⚠️  Warning: jq not available, skipping detailed project validation"
  if echo "$PROJECT_DETAILS" | grep -q '"error"'; then
    echo "❌ Error: API response contains error"
    echo "Response: $PROJECT_DETAILS" | head -10
    exit 1
  fi
  # Use SUPABASE_PROJECT_REF as fallback
  PROJECT_REF_ID="$SUPABASE_PROJECT_REF"
fi

# Construct DB_HOST from project reference ID (extracted from API or fallback to SUPABASE_PROJECT_REF)
# Supabase Transaction Mode hosts are ALWAYS: db.[PROJECT-REF].supabase.co
# The project reference ID is a short alphanumeric string (not the UUID project ID)
# This must be extracted from the API response to ensure correct hostname format
DB_HOST="db.${PROJECT_REF_ID}.supabase.co"
echo "✅ Using database host: $DB_HOST (constructed from project reference ID)"

# Extract DB_NAME from API response (optional, defaults to postgres)
# This is just for informational purposes, we always use "postgres" as the database name
if command -v jq >/dev/null 2>&1; then
  DB_NAME=$(echo "$PROJECT_DETAILS" | jq -r '.database.db_name // .db_name // .database_name // "postgres"' 2>/dev/null || echo "postgres")
else
  # Fallback to grep if jq is not available (shouldn't happen in GitHub Actions)
  DB_NAME=$(echo "$PROJECT_DETAILS" | grep -o '"db_name":"[^"]*' | cut -d'"' -f4 || echo "")
  if [ -z "$DB_NAME" ]; then
    DB_NAME=$(echo "$PROJECT_DETAILS" | grep -o '"database_name":"[^"]*' | cut -d'"' -f4 || echo "")
  fi
fi

# Default to "postgres" if DB_NAME is still empty
if [ -z "$DB_NAME" ] || [ "$DB_NAME" = "null" ]; then
  DB_NAME="postgres"
fi
echo "✅ Using database name: $DB_NAME"

# Construct main database connection string
# Supabase Transaction Mode Pooling format (required for external IPs): postgres://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:6543/postgres?sslmode=require&pgbouncer=true
# Note: Port 6543 (Transaction Mode pooling) is required for external IPs like GitHub Actions runners
# Protocol: postgres:// (not postgresql://) for Transaction Mode
# Username: postgres (NO project ref prefix) for Transaction Mode
# REQUIRED: ?pgbouncer=true parameter tells Prisma to disable prepared statements (Transaction Mode doesn't support them)
# Recommended: ?connection_limit=1 for serverless/CI environments
# Optional: ?connect_timeout=30 for serverless cold starts
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

# Construct main database connection string
# Supabase Transaction Mode Pooling format (required for external IPs): postgres://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:6543/postgres?sslmode=require&pgbouncer=true
MAIN_DATABASE_URL="postgres://postgres:${ENCODED_PASSWORD}@${DB_HOST}:6543/${DB_NAME}?sslmode=require&pgbouncer=true&connection_limit=1&connect_timeout=30"

# Create PostgreSQL schema using Prisma (which handles connection properly)
echo "📦 Creating PostgreSQL schema: $SCHEMA_NAME"

# Run the schema creation script
# The script will use Prisma Client from the project's node_modules
export DATABASE_URL="$MAIN_DATABASE_URL"
export SCHEMA_NAME="$SCHEMA_NAME"

# Debug: Log connection string format (without password)
echo "🔍 Connection string format: postgres://postgres:***@${DB_HOST}:6543/${DB_NAME}?sslmode=require&pgbouncer=true&connection_limit=1&connect_timeout=30"

# Diagnostic: Validate connection components
echo ""
echo "📊 Connection Diagnostics:"
echo "   ✓ Project validated via API"
echo "   ✓ Host constructed: $DB_HOST"
echo "   ✓ Database name: $DB_NAME"
echo "   ✓ Schema name: $SCHEMA_NAME"
echo "   ✓ Password encoding: $(if [ "$ENCODED_PASSWORD" != "$SUPABASE_DB_PASSWORD" ]; then echo "Applied"; else echo "Not needed"; fi)"
echo "   ✓ Connection mode: Transaction Mode (port 6543)"
echo "   ✓ Protocol: postgres:// (Transaction Mode)"
echo "   ✓ SSL: Required (sslmode=require)"
echo "   ✓ PgBouncer: Enabled (pgbouncer=true)"
echo ""

# Try to create schema with retries (database might be initializing)
max_retries=3
retry=0
while [ $retry -lt $max_retries ]; do
  echo "🔄 Attempt $((retry + 1))/$max_retries: Creating schema..."
  if node scripts/create-schema.js; then
    echo "✅ Schema created successfully"
    break
  else
    retry=$((retry + 1))
    if [ $retry -lt $max_retries ]; then
      echo ""
      echo "⚠️  Schema creation attempt $retry failed"
      echo "   This might be a transient network issue"
      echo "   Retrying in 5 seconds..."
      echo ""
      sleep 5
    else
      echo ""
      echo "❌ Error: Failed to create schema after $max_retries attempts"
      echo ""
      echo "📋 Connection Details (for troubleshooting):"
      echo "   Host: $DB_HOST"
      echo "   Port: 6543 (Transaction Mode)"
      echo "   Database: $DB_NAME"
      echo "   Schema: $SCHEMA_NAME"
      echo "   Project: $SUPABASE_PROJECT_REF"
      echo ""
      echo "💡 This error typically indicates one of the following:"
      echo ""
      echo "1. **Incorrect Database Password** (most common):"
      echo "   - SUPABASE_DB_PASSWORD may be incorrect"
      echo "   - Password may contain special characters that need URL encoding"
      echo "   - Password may have been changed in Supabase dashboard"
      echo ""
      echo "2. **Network/Firewall Issues**:"
      echo "   - GitHub Actions runners may be blocked by Supabase firewall"
      echo "   - Transaction Mode (port 6543) should work from any IP"
      echo "   - Check if project has IP allowlisting enabled"
      echo ""
      echo "3. **Project Configuration Issues**:"
      echo "   - Project may be paused or inactive (should be caught earlier)"
      echo "   - Database may not be fully initialized"
      echo "   - Project may have connection restrictions enabled"
      echo ""
      echo "4. **Host Format Issues**:"
      echo "   - Host format: $DB_HOST"
      echo "   - Should be: db.[PROJECT-REF].supabase.co"
      echo "   - Verify SUPABASE_PROJECT_REF is correct"
      echo ""
      echo "🔧 Troubleshooting Steps:"
      echo ""
      echo "Step 1: Verify SUPABASE_DB_PASSWORD"
      echo "  1. Go to Supabase Dashboard → Project Settings → Database"
      echo "  2. Copy the connection string"
      echo "  3. Extract the password from: postgresql://postgres:[PASSWORD]@..."
      echo "  4. Update SUPABASE_DB_PASSWORD in GitHub secrets"
      echo "  5. Ensure password is URL-encoded if it contains special characters"
      echo ""
      echo "Step 2: Verify SUPABASE_PROJECT_REF"
      echo "  1. Go to Supabase Dashboard → Project Settings → General"
      echo "  2. Check the 'Reference ID' field"
      echo "  3. Verify it matches SUPABASE_PROJECT_REF in GitHub secrets"
      echo "  4. Update if different"
      echo ""
      echo "Step 3: Check Project Status"
      echo "  1. Go to Supabase Dashboard → Project Settings"
      echo "  2. Verify project is 'Active' (not paused)"
      echo "  3. Check if database is enabled"
      echo ""
      echo "Step 4: Test Connection Locally (if possible)"
      echo "  1. Use the connection string from Supabase dashboard"
      echo "  2. Test with: psql \"postgres://postgres:[PASSWORD]@$DB_HOST:6543/$DB_NAME?sslmode=require\""
      echo "  3. If local connection works, issue is likely with GitHub Actions network"
      echo ""
      echo "Step 5: Check Supabase Project Settings"
      echo "  1. Go to Supabase Dashboard → Project Settings → Database"
      echo "  2. Check 'Connection Pooling' settings"
      echo "  3. Verify Transaction Mode is enabled (port 6543)"
      echo "  4. Check if IP allowlisting is enabled (should be disabled for GitHub Actions)"
      exit 1
    fi
  fi
done

# Construct preview database connection string with search_path
# Format: postgres://postgres:[PASSWORD]@[HOST]:6543/[DB_NAME]?sslmode=require&pgbouncer=true&connection_limit=1&connect_timeout=30&search_path=preview_pr7
DATABASE_URL="${MAIN_DATABASE_URL}&search_path=${SCHEMA_NAME}"

# Always set outputs (even if empty, to prevent workflow failures)
{
  echo "database-url=$DATABASE_URL"
  echo "instance-name=$INSTANCE_NAME"
  echo "schema-name=$SCHEMA_NAME"
} >> "$GITHUB_OUTPUT"

echo "✅ Preview schema created successfully"
echo "Schema: $SCHEMA_NAME"
echo "DATABASE_URL format: postgres://postgres:***@${DB_HOST}:6543/${DB_NAME}?sslmode=require&pgbouncer=true&connection_limit=1&connect_timeout=30&search_path=${SCHEMA_NAME}"
exit 0

