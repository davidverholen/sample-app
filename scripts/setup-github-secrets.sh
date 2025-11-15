#!/bin/bash
set -e

# Script to help set up GitHub secrets for review apps
# This script sets the secrets that can be obtained via CLI
# For VERCEL_TOKEN and SUPABASE_ACCESS_TOKEN, you'll need to create them manually

echo "🔐 Setting up GitHub secrets for review apps..."
echo ""

# Get repository name
REPO=$(gh repo view --json nameWithOwner -q .nameWithOwner)
echo "Repository: $REPO"
echo ""

# Get Vercel project details
echo "📦 Getting Vercel project details..."
if command -v vercel &> /dev/null; then
  if [ -f ".vercel/project.json" ]; then
    VERCEL_PROJECT_ID=$(cat .vercel/project.json | jq -r '.projectId')
    VERCEL_ORG_ID=$(cat .vercel/project.json | jq -r '.orgId')
    echo "✅ Found Vercel project: $VERCEL_PROJECT_ID"
    echo "✅ Found Vercel org: $VERCEL_ORG_ID"
  else
    echo "⚠️  .vercel/project.json not found. Run 'vercel link' first."
    exit 1
  fi
else
  echo "❌ Vercel CLI not found. Please install it: npm i -g vercel"
  exit 1
fi

# Get Supabase project ref
echo ""
echo "🗄️  Getting Supabase project details..."
if command -v supabase &> /dev/null; then
  if [ -f "supabase/.temp/project-ref" ]; then
    SUPABASE_PROJECT_REF=$(cat supabase/.temp/project-ref)
    echo "✅ Found Supabase project ref: $SUPABASE_PROJECT_REF"
  else
    echo "⚠️  Supabase project ref not found. Run 'supabase link' first."
    exit 1
  fi
else
  echo "❌ Supabase CLI not found. Please install it: npm i -g supabase"
  exit 1
fi

# Set GitHub secrets
echo ""
echo "🔑 Setting GitHub secrets..."

# Set Vercel secrets
echo "Setting VERCEL_ORG_ID..."
gh secret set VERCEL_ORG_ID --body "$VERCEL_ORG_ID" --repo "$REPO"

echo "Setting VERCEL_PROJECT_ID..."
gh secret set VERCEL_PROJECT_ID --body "$VERCEL_PROJECT_ID" --repo "$REPO"

# Set Supabase secrets
echo "Setting SUPABASE_PROJECT_REF..."
gh secret set SUPABASE_PROJECT_REF --body "$SUPABASE_PROJECT_REF" --repo "$REPO"

echo ""
echo "✅ Successfully set secrets that can be obtained via CLI"
echo ""
echo "⚠️  MANUAL STEPS REQUIRED:"
echo ""
echo "1. Create Vercel Token:"
echo "   - Go to: https://vercel.com/account/tokens"
echo "   - Click 'Create Token'"
echo "   - Name it 'GitHub Actions' or similar"
echo "   - Copy the token"
echo "   - Run: gh secret set VERCEL_TOKEN --body 'YOUR_TOKEN' --repo $REPO"
echo ""
echo "2. Create Supabase Access Token:"
echo "   - Go to: https://supabase.com/dashboard/account/tokens"
echo "   - Click 'Generate New Token'"
echo "   - Name it 'GitHub Actions' or similar"
echo "   - Select scope: 'All projects' or specific project"
echo "   - Copy the token"
echo "   - Run: gh secret set SUPABASE_ACCESS_TOKEN --body 'YOUR_TOKEN' --repo $REPO"
echo ""
echo "3. (Optional) Set Supabase Database Password:"
echo "   - Get from Supabase Dashboard → Project Settings → Database"
echo "   - Run: gh secret set SUPABASE_DB_PASSWORD --body 'YOUR_PASSWORD' --repo $REPO"
echo ""
echo "📋 Current secrets:"
gh secret list --repo "$REPO"

