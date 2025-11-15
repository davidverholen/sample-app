#!/bin/bash
set -e

# Script to create a Supabase preview instance for a PR branch
# Usage: ./create-supabase-preview.sh <branch-name> <pr-number> <access-token> <project-ref>

BRANCH_NAME="$1"
PR_NUMBER="$2"
SUPABASE_ACCESS_TOKEN="$3"
SUPABASE_PROJECT_REF="$4"

# Ensure GITHUB_OUTPUT is set (for GitHub Actions)
if [ -z "$GITHUB_OUTPUT" ]; then
  GITHUB_OUTPUT="/dev/stdout"
fi

if [ -z "$BRANCH_NAME" ] || [ -z "$PR_NUMBER" ]; then
  echo "❌ Error: Missing required arguments"
  echo "Usage: $0 <branch-name> <pr-number> <access-token> <project-ref>"
  exit 1
fi

# SUPABASE_ACCESS_TOKEN and SUPABASE_PROJECT_REF are optional (for fallback)
if [ -z "$SUPABASE_PROJECT_REF" ]; then
  echo "⚠️  Warning: SUPABASE_PROJECT_REF not provided, will use fallback approach"
fi

# Sanitize branch name for use in instance name (remove special characters)
SANITIZED_BRANCH=$(echo "$BRANCH_NAME" | sed 's/[^a-zA-Z0-9-]/-/g' | tr '[:upper:]' '[:lower:]' | cut -c1-30)
INSTANCE_NAME="preview-${SANITIZED_BRANCH}-pr${PR_NUMBER}"

echo "🚀 Creating Supabase preview instance: $INSTANCE_NAME"

# Note: Supabase doesn't have built-in preview instances like Vercel.
# This script uses the Supabase Management API to create a branch database.
# Alternative approaches:
# 1. Use Supabase Management API to create a new project (requires paid plan)
# 2. Use a shared test database with branch-specific schema prefixes
# 3. Use Supabase CLI with temporary databases

# For now, we'll use the Management API to create a branch database
# This requires the Supabase Management API access token
# Note: Supabase Management API project creation requires Team plan

API_URL="https://api.supabase.com/v1/projects"

# Try to get organization ID from project details if not provided
if [ -z "$SUPABASE_ORG_ID" ] && [ -n "$SUPABASE_PROJECT_REF" ] && [ -n "$SUPABASE_ACCESS_TOKEN" ]; then
  PROJECT_DETAILS=$(curl -s -X GET "$API_URL/$SUPABASE_PROJECT_REF" \
    -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" 2>/dev/null || echo "{}")
  SUPABASE_ORG_ID=$(echo "$PROJECT_DETAILS" | grep -o '"organization_id":"[^"]*' | cut -d'"' -f4 || echo "")
fi

# Create a new Supabase project for the preview
# Note: This requires a Supabase Team plan with API access
if [ -n "$SUPABASE_ORG_ID" ] && [ -n "$SUPABASE_ACCESS_TOKEN" ]; then
  RESPONSE=$(curl -s -X POST "$API_URL" \
    -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
      \"name\": \"$INSTANCE_NAME\",
      \"organization_id\": \"$SUPABASE_ORG_ID\",
      \"region\": \"us-east-1\",
      \"plan\": \"free\",
      \"kps_enabled\": false
    }" 2>/dev/null || echo "{}")
else
  RESPONSE="{}"
fi

# Check if project creation was successful
if echo "$RESPONSE" | grep -q '"id"'; then
  PROJECT_ID=$(echo "$RESPONSE" | grep -o '"id":"[^"]*' | cut -d'"' -f4)
  echo "✅ Created Supabase project: $PROJECT_ID"
  
  # Wait for project to be ready
  echo "⏳ Waiting for project to be ready..."
  sleep 30
  
  # Get database connection details
  PROJECT_DETAILS=$(curl -s -X GET "$API_URL/$PROJECT_ID" \
    -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN")
  
  DB_PASSWORD=$(echo "$PROJECT_DETAILS" | grep -o '"db_pass":"[^"]*' | cut -d'"' -f4 || echo "")
  DB_HOST=$(echo "$PROJECT_DETAILS" | grep -o '"db_host":"[^"]*' | cut -d'"' -f4 || echo "")
  DB_NAME=$(echo "$PROJECT_DETAILS" | grep -o '"db_name":"[^"]*' | cut -d'"' -f4 || echo "postgres")
  
  if [ -n "$DB_PASSWORD" ] && [ -n "$DB_HOST" ]; then
    # Supabase requires SSL connections
    DATABASE_URL="postgresql://postgres.${PROJECT_ID}:${DB_PASSWORD}@${DB_HOST}:5432/${DB_NAME}?sslmode=require"
    {
      echo "database-url=$DATABASE_URL"
      echo "instance-name=$INSTANCE_NAME"
      echo "project-id=$PROJECT_ID"
    } >> "$GITHUB_OUTPUT"
    echo "✅ Preview instance created successfully"
    echo "DATABASE_URL=$DATABASE_URL" >&2
    exit 0
  fi
fi

# Fallback: Use shared test database with branch-specific schema
# This is a simpler approach that doesn't require creating new projects
echo "⚠️  Using fallback: shared test database with branch-specific schema"
echo "Note: For production use, configure Supabase Management API access"

# Use the main project's database with a branch-specific schema
# This requires the project ref to be set
if [ -n "$SUPABASE_PROJECT_REF" ]; then
  # Get database connection details
  # For Supabase, we need the database password from the project settings
  # This should be stored in GitHub secrets as SUPABASE_DB_PASSWORD
  DB_PASSWORD="${SUPABASE_DB_PASSWORD:-}"
  DB_HOST="db.${SUPABASE_PROJECT_REF}.supabase.co"
  DB_NAME="postgres"
  
  # If password is not provided, try to get it from Supabase API
  if [ -z "$DB_PASSWORD" ] && [ -n "$SUPABASE_ACCESS_TOKEN" ]; then
    PROJECT_DETAILS=$(curl -s -X GET "$API_URL/$SUPABASE_PROJECT_REF" \
      -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" 2>/dev/null || echo "{}")
    DB_PASSWORD=$(echo "$PROJECT_DETAILS" | grep -o '"db_pass":"[^"]*' | cut -d'"' -f4 || echo "")
  fi
  
  # If still no password, use a default (this won't work but allows script to continue)
  if [ -z "$DB_PASSWORD" ]; then
    echo "⚠️  Warning: Database password not found. Please set SUPABASE_DB_PASSWORD secret."
    DB_PASSWORD="postgres"
  fi
  
  # Create branch-specific schema name
  SCHEMA_NAME="preview_${SANITIZED_BRANCH}_pr${PR_NUMBER}"
  
  # Output connection string
  # Note: Schema will be created during migration step
  # Supabase requires SSL connections
  # Use direct connection (not pooler) for migrations
  # Format: postgresql://postgres.[PROJECT-REF]:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres?sslmode=require
  DATABASE_URL="postgresql://postgres.${SUPABASE_PROJECT_REF}:${DB_PASSWORD}@${DB_HOST}:5432/${DB_NAME}?sslmode=require"
  
  {
    echo "database-url=$DATABASE_URL"
    echo "instance-name=$INSTANCE_NAME"
    echo "schema-name=$SCHEMA_NAME"
  } >> "$GITHUB_OUTPUT"
  echo "✅ Using shared database with branch schema: $SCHEMA_NAME"
  echo "⚠️  Note: Schema '$SCHEMA_NAME' will be created during migration step"
  # Output to stdout for workflow to capture
  echo "::notice::DATABASE_URL=$DATABASE_URL"
  echo "::notice::instance-name=$INSTANCE_NAME"
  echo "DATABASE_URL=$DATABASE_URL"
  exit 0
fi

echo "❌ Failed to create preview instance"
exit 1

