#!/bin/bash
set -e

# Script to cleanup a Supabase preview instance for a PR branch
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

# Sanitize branch name for use in instance name (remove special characters)
SANITIZED_BRANCH=$(echo "$BRANCH_NAME" | sed 's/[^a-zA-Z0-9-]/-/g' | tr '[:upper:]' '[:lower:]' | cut -c1-30)
INSTANCE_NAME="preview-${SANITIZED_BRANCH}-pr${PR_NUMBER}"

echo "🧹 Cleaning up Supabase preview instance: $INSTANCE_NAME"

# Delete the Supabase project via Management API
API_URL="https://api.supabase.com/v1/projects"

# List projects and find the one matching our instance name
echo "📋 Searching for project: $INSTANCE_NAME"
PROJECTS=$(curl -s -X GET "$API_URL" \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
  -H "Content-Type: application/json" 2>&1)

# Check for API errors
if echo "$PROJECTS" | grep -q '"error"'; then
  echo "❌ Error: Failed to list projects"
  echo "Response: $PROJECTS"
  exit 1
fi

# Extract project ID if it exists
PROJECT_ID=$(echo "$PROJECTS" | grep -o "\"id\":\"[^\"]*\",\"name\":\"$INSTANCE_NAME\"" | grep -o "\"id\":\"[^\"]*" | cut -d'"' -f4 || echo "")

if [ -z "$PROJECT_ID" ]; then
  echo "⚠️  Project not found: $INSTANCE_NAME"
  echo "Project may have already been deleted or never created"
  exit 0
fi

echo "🗑️  Deleting Supabase project: $PROJECT_ID"
DELETE_RESPONSE=$(curl -s -X DELETE "$API_URL/$PROJECT_ID" \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
  -H "Content-Type: application/json" 2>&1)

# Check if deletion was successful
if echo "$DELETE_RESPONSE" | grep -q '"error"'; then
  echo "❌ Error: Failed to delete project"
  echo "Response: $DELETE_RESPONSE"
  exit 1
fi

if echo "$DELETE_RESPONSE" | grep -qE "deleted|success|200"; then
  echo "✅ Successfully deleted Supabase project"
  exit 0
else
  echo "⚠️  Unexpected response from delete API"
  echo "Response: $DELETE_RESPONSE"
  exit 0  # Don't fail cleanup
fi

