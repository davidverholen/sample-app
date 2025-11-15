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

# Sanitize branch name for use in instance name (remove special characters)
SANITIZED_BRANCH=$(echo "$BRANCH_NAME" | sed 's/[^a-zA-Z0-9-]/-/g' | tr '[:upper:]' '[:lower:]' | cut -c1-30)
INSTANCE_NAME="preview-${SANITIZED_BRANCH}-pr${PR_NUMBER}"

echo "🚀 Creating Supabase preview instance: $INSTANCE_NAME"

# Use Supabase Management API to create a new project for the preview
# This requires a Supabase Team plan with API access
API_URL="https://api.supabase.com/v1/projects"

# Get organization ID from project details
echo "📋 Fetching organization ID from project: $SUPABASE_PROJECT_REF"
PROJECT_DETAILS=$(curl -s -X GET "$API_URL/$SUPABASE_PROJECT_REF" \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
  -H "Content-Type: application/json" 2>&1)

# Check if API call was successful
if echo "$PROJECT_DETAILS" | grep -q '"error"'; then
  echo "❌ Error: Failed to fetch project details"
  echo "Response: $PROJECT_DETAILS"
  exit 1
fi

SUPABASE_ORG_ID=$(echo "$PROJECT_DETAILS" | grep -o '"organization_id":"[^"]*' | cut -d'"' -f4 || echo "")

if [ -z "$SUPABASE_ORG_ID" ]; then
  echo "❌ Error: Failed to extract organization_id from project details"
  echo "Please verify SUPABASE_PROJECT_REF is correct and SUPABASE_ACCESS_TOKEN has proper permissions"
  exit 1
fi

echo "✅ Found organization ID: $SUPABASE_ORG_ID"

# Create a new Supabase project for the preview
echo "📦 Creating new Supabase project..."
RESPONSE=$(curl -s -X POST "$API_URL" \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"$INSTANCE_NAME\",
    \"organization_id\": \"$SUPABASE_ORG_ID\",
    \"region\": \"us-east-1\",
    \"plan\": \"free\",
    \"kps_enabled\": false
  }" 2>&1)

# Check if project creation was successful
if echo "$RESPONSE" | grep -q '"error"'; then
  echo "❌ Error: Failed to create Supabase project"
  echo "Response: $RESPONSE"
  exit 1
fi

if ! echo "$RESPONSE" | grep -q '"id"'; then
  echo "❌ Error: Invalid response from Supabase API"
  echo "Response: $RESPONSE"
  exit 1
fi

PROJECT_ID=$(echo "$RESPONSE" | grep -o '"id":"[^"]*' | cut -d'"' -f4)
echo "✅ Created Supabase project: $PROJECT_ID"

# Wait for project to be ready
echo "⏳ Waiting for project to be ready..."
sleep 30

# Get database connection details
echo "📋 Fetching database connection details..."
PROJECT_DETAILS=$(curl -s -X GET "$API_URL/$PROJECT_ID" \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
  -H "Content-Type: application/json" 2>&1)

if echo "$PROJECT_DETAILS" | grep -q '"error"'; then
  echo "❌ Error: Failed to fetch project details after creation"
  echo "Response: $PROJECT_DETAILS"
  exit 1
fi

DB_PASSWORD=$(echo "$PROJECT_DETAILS" | grep -o '"db_pass":"[^"]*' | cut -d'"' -f4 || echo "")
DB_HOST=$(echo "$PROJECT_DETAILS" | grep -o '"db_host":"[^"]*' | cut -d'"' -f4 || echo "")
DB_NAME=$(echo "$PROJECT_DETAILS" | grep -o '"db_name":"[^"]*' | cut -d'"' -f4 || echo "postgres")

if [ -z "$DB_PASSWORD" ] || [ -z "$DB_HOST" ]; then
  echo "❌ Error: Failed to extract database connection details"
  echo "DB_PASSWORD: ${DB_PASSWORD:+set}" 
  echo "DB_HOST: ${DB_HOST:+set}"
  echo "Response: $PROJECT_DETAILS"
  exit 1
fi

# Supabase requires SSL connections
DATABASE_URL="postgresql://postgres.${PROJECT_ID}:${DB_PASSWORD}@${DB_HOST}:5432/${DB_NAME}?sslmode=require"

# Always set outputs (even if empty, to prevent workflow failures)
{
  echo "database-url=$DATABASE_URL"
  echo "instance-name=$INSTANCE_NAME"
  echo "project-id=$PROJECT_ID"
} >> "$GITHUB_OUTPUT"

echo "✅ Preview instance created successfully"
echo "DATABASE_URL format: postgresql://postgres.***:***@${DB_HOST}:5432/${DB_NAME}?sslmode=require"
exit 0

