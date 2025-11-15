#!/bin/bash
set -e

# Script to cleanup a Supabase preview instance for a PR branch
# Usage: ./cleanup-supabase-preview.sh <branch-name> <pr-number> <access-token> <project-ref>

BRANCH_NAME="$1"
PR_NUMBER="$2"
SUPABASE_ACCESS_TOKEN="$3"
SUPABASE_PROJECT_REF="$4"

if [ -z "$BRANCH_NAME" ] || [ -z "$PR_NUMBER" ]; then
  echo "❌ Error: Missing required arguments"
  echo "Usage: $0 <branch-name> <pr-number> <access-token> <project-ref>"
  exit 1
fi

# Sanitize branch name for use in instance name (remove special characters)
SANITIZED_BRANCH=$(echo "$BRANCH_NAME" | sed 's/[^a-zA-Z0-9-]/-/g' | tr '[:upper:]' '[:lower:]' | cut -c1-30)
INSTANCE_NAME="preview-${SANITIZED_BRANCH}-pr${PR_NUMBER}"

echo "🧹 Cleaning up Supabase preview instance: $INSTANCE_NAME"

# Try to delete the Supabase project if it was created via API
if [ -n "$SUPABASE_ACCESS_TOKEN" ]; then
  API_URL="https://api.supabase.com/v1/projects"
  
  # List projects and find the one matching our instance name
  PROJECTS=$(curl -s -X GET "$API_URL" \
    -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" || echo "[]")
  
  # Extract project ID if it exists
  PROJECT_ID=$(echo "$PROJECTS" | grep -o "\"id\":\"[^\"]*\",\"name\":\"$INSTANCE_NAME\"" | grep -o "\"id\":\"[^\"]*" | cut -d'"' -f4 || echo "")
  
  if [ -n "$PROJECT_ID" ]; then
    echo "🗑️  Deleting Supabase project: $PROJECT_ID"
    DELETE_RESPONSE=$(curl -s -X DELETE "$API_URL/$PROJECT_ID" \
      -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" || echo "{}")
    
    if echo "$DELETE_RESPONSE" | grep -q "deleted\|success"; then
      echo "✅ Successfully deleted Supabase project"
      exit 0
    else
      echo "⚠️  Failed to delete project via API, trying schema cleanup..."
    fi
  fi
fi

# Fallback: Clean up branch-specific schema from shared database
if [ -n "$SUPABASE_PROJECT_REF" ]; then
  SCHEMA_NAME="preview_${SANITIZED_BRANCH}_pr${PR_NUMBER}"
  DB_PASSWORD="${SUPABASE_DB_PASSWORD:-}"
  DB_HOST="db.${SUPABASE_PROJECT_REF}.supabase.co"
  DB_NAME="postgres"
  
  # Get password from environment or use default (will fail if wrong, but allows script to continue)
  if [ -z "$DB_PASSWORD" ]; then
    echo "⚠️  Warning: SUPABASE_DB_PASSWORD not set, attempting cleanup with default"
    DB_PASSWORD="postgres"
  fi
  
  # Construct DATABASE_URL with SSL requirement for Supabase
  DATABASE_URL="postgresql://postgres.${SUPABASE_PROJECT_REF}:${DB_PASSWORD}@${DB_HOST}:5432/${DB_NAME}?sslmode=require"
  export DATABASE_URL
  
  echo "🗑️  Dropping schema: $SCHEMA_NAME"
  
  # Use Prisma to drop the schema (Prisma should be available from workflow setup)
  if command -v npx &> /dev/null; then
    # Set schema in connection string
    SCHEMA_DATABASE_URL="${DATABASE_URL}&schema=${SCHEMA_NAME}"
    export DATABASE_URL="$SCHEMA_DATABASE_URL"
    
    npx prisma db execute --stdin <<EOF || echo "⚠️  Schema cleanup failed, continuing..."
DROP SCHEMA IF EXISTS "$SCHEMA_NAME" CASCADE;
EOF
    echo "✅ Schema cleanup completed"
  else
    echo "⚠️  Prisma not available, skipping schema cleanup"
  fi
  
  exit 0
fi

echo "⚠️  No cleanup action taken (missing configuration)"
exit 0

