# Supabase Setup Guide

This guide explains how to set up Supabase for use with GitHub Actions workflows, specifically for review apps (preview deployments).

## Overview

The project uses Supabase Management API to create isolated preview database instances for each pull request. This requires:

1. A Supabase account with Team plan (for Management API access)
2. GitHub secrets configured with Supabase credentials
3. Proper project linking

## Prerequisites

- Supabase account with Team plan (required for Management API access)
- GitHub repository with Actions enabled
- Supabase CLI installed locally (optional, for local development)

## Required GitHub Secrets

The following secrets must be configured in your GitHub repository:

### `SUPABASE_ACCESS_TOKEN`

A Supabase Management API access token with permissions to create and manage projects.

**How to obtain:**

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Navigate to **Account Settings** → **Access Tokens**
3. Click **Generate New Token**
4. Give it a descriptive name (e.g., "GitHub Actions Preview Deployments")
5. Copy the token and add it to GitHub secrets

**Required permissions:**

- `projects:read` - To read project details
- `projects:write` - To create and delete preview projects

### `SUPABASE_PROJECT_REF`

The reference ID of your main Supabase project. This is used to:

- Extract organization ID for creating preview projects
- Reference the main project for configuration

**How to find:**

1. Go to your Supabase project dashboard
2. Navigate to **Settings** → **General**
3. Find the **Reference ID** field
4. Copy the value (format: `abcdefghijklmnop`)

**Example:** `abcdefghijklmnop`

## Local Setup (Optional)

For local development, you can link your project to Supabase:

```bash
# Install Supabase CLI (if not already installed)
npm install -g supabase

# Login to Supabase
supabase login

# Link your project (if you have an existing Supabase project)
supabase link --project-ref your-project-ref

# Or initialize a new Supabase project locally
supabase init
```

## How It Works

### Review Apps Workflow

When a pull request is opened:

1. **Secret Validation**: Workflow validates that all required secrets are set
2. **Create Preview Instance**: Script creates a new Supabase project via Management API
3. **Wait for Ready**: Workflow waits for the project to be active and database to be ready
4. **Apply Migrations**: Prisma migrations are applied to the preview database
5. **Seed Database**: Database is seeded with test data (if seed script exists)
6. **Deploy to Vercel**: Preview deployment is created with the preview database URL

When a pull request is closed:

1. **Cleanup**: The preview Supabase project is automatically deleted

### Scripts

#### `scripts/create-supabase-preview.sh`

Creates a new Supabase project for a PR branch.

**Usage:**

```bash
./scripts/create-supabase-preview.sh <branch-name> <pr-number> <access-token> <project-ref>
```

**Outputs:**

- `database-url`: PostgreSQL connection string for the preview database
- `instance-name`: Name of the preview instance
- `project-id`: Supabase project ID

**Requirements:**

- `SUPABASE_ACCESS_TOKEN` must be set
- `SUPABASE_PROJECT_REF` must be set
- Supabase Team plan with Management API access

#### `scripts/cleanup-supabase-preview.sh`

Deletes a Supabase preview project when PR is closed.

**Usage:**

```bash
./scripts/cleanup-supabase-preview.sh <branch-name> <pr-number> <access-token> <project-ref>
```

**Requirements:**

- `SUPABASE_ACCESS_TOKEN` must be set

#### `scripts/test-db-connection.js`

Tests database connectivity using Prisma.

**Usage:**

```bash
DATABASE_URL="postgresql://..." node scripts/test-db-connection.js
```

**Requirements:**

- `DATABASE_URL` environment variable must be set
- Prisma Client must be generated (`npx prisma generate`)

## Troubleshooting

### Error: "SUPABASE_ACCESS_TOKEN is required but not set"

**Solution:** Add `SUPABASE_ACCESS_TOKEN` to GitHub secrets.

1. Go to your repository → **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret**
3. Name: `SUPABASE_ACCESS_TOKEN`
4. Value: Your Supabase Management API access token
5. Click **Add secret**

### Error: "SUPABASE_PROJECT_REF is required but not set"

**Solution:** Add `SUPABASE_PROJECT_REF` to GitHub secrets.

1. Go to your repository → **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret**
3. Name: `SUPABASE_PROJECT_REF`
4. Value: Your Supabase project reference ID
5. Click **Add secret**

### Error: "Failed to create Supabase project"

**Possible causes:**

1. **Invalid access token**: Verify your `SUPABASE_ACCESS_TOKEN` is correct and has proper permissions
2. **Insufficient permissions**: Ensure your access token has `projects:write` permission
3. **Team plan required**: Management API project creation requires a Supabase Team plan
4. **Rate limiting**: Supabase API may be rate-limited, wait a few minutes and retry

**Solution:**

- Verify your access token in Supabase Dashboard → Account Settings → Access Tokens
- Check that your account has a Team plan
- Review the workflow logs for detailed error messages

### Error: "Failed to extract organization_id"

**Possible causes:**

1. **Invalid project reference**: `SUPABASE_PROJECT_REF` may be incorrect
2. **Access token permissions**: Token may not have `projects:read` permission
3. **Project not found**: Project reference may not exist or be inaccessible

**Solution:**

- Verify `SUPABASE_PROJECT_REF` matches your project's reference ID
- Ensure access token has `projects:read` permission
- Check that the project exists in your Supabase dashboard

### Error: "Database connection failed"

**Possible causes:**

1. **Database not ready**: New Supabase projects can take 1-5 minutes to initialize
2. **Invalid connection string**: Database URL may be malformed
3. **Network issues**: GitHub Actions may not be able to reach Supabase

**Solution:**

- Wait a few minutes and retry (projects take time to initialize)
- Verify the database URL format is correct
- Check Supabase project status in dashboard
- Review workflow logs for detailed connection error messages

### Error: "Readiness check timed out"

**Possible causes:**

1. **Project initialization delay**: Supabase projects can take 1-5 minutes to become active
2. **Network connectivity**: GitHub Actions may have network issues
3. **Supabase service issues**: Supabase may be experiencing issues

**Solution:**

- This is usually a temporary issue - wait and retry
- Check [Supabase Status](https://status.supabase.com/) for service issues
- Review workflow logs for detailed error messages
- Consider increasing timeout in workflow if projects consistently take longer

### Preview Projects Not Being Cleaned Up

**Possible causes:**

1. **Cleanup script failing**: Script may be failing silently
2. **Access token permissions**: Token may not have `projects:write` permission
3. **Project not found**: Project may have already been deleted

**Solution:**

- Check workflow logs for cleanup step errors
- Verify access token has `projects:write` permission
- Manually delete orphaned projects in Supabase dashboard if needed

## Best Practices

1. **Monitor Preview Projects**: Regularly check your Supabase dashboard for orphaned preview projects
2. **Set Up Alerts**: Configure alerts for failed workflow runs
3. **Review Logs**: Check workflow logs regularly to catch issues early
4. **Test Locally**: Test scripts locally before pushing changes
5. **Rotate Tokens**: Regularly rotate access tokens for security

## Cost Considerations

- Each preview project uses Supabase free tier resources
- Preview projects are automatically deleted when PRs are closed
- Monitor your Supabase usage to avoid unexpected costs
- Consider setting up usage alerts in Supabase dashboard

## Related Documentation

- [Supabase Management API Documentation](https://supabase.com/docs/reference/api)
- [Supabase CLI Documentation](https://supabase.com/docs/reference/cli)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Review Apps Documentation](./REVIEW_APPS.md)
