# Review Apps with Vercel and Supabase

This document describes the review apps (preview deployments) setup for pull requests, which automatically deploy each PR branch to Vercel, create isolated PostgreSQL schemas within a single Supabase project, and run E2E tests.

## Overview

When a pull request is opened or updated, the review apps workflow:

1. **Deploys to Vercel Preview** - Creates a preview deployment of the PR branch
2. **Creates PostgreSQL Schema** - Sets up an isolated schema within the main Supabase project for the preview
3. **Runs E2E Tests** - Executes end-to-end tests against the preview deployment
4. **Cleans Up** - Removes preview schema when the PR is closed

**Key Feature**: This implementation uses PostgreSQL schema-based isolation within a single Supabase project, making it compatible with the Supabase free tier (which allows only 2 active projects).

## Workflow Triggers

The review apps workflow (`.github/workflows/review-apps.yml`) runs on:

- `pull_request.opened` - Create preview deployment
- `pull_request.synchronize` - Update preview deployment when PR is updated
- `pull_request.reopened` - Recreate preview deployment
- `pull_request.closed` - Cleanup preview resources
- `workflow_dispatch` - Manual trigger

## Initial Supabase Database Setup

**IMPORTANT**: Before using review apps, you must set up the main Supabase database schema.

If your Supabase dashboard shows "tables: 0", the schema hasn't been applied yet. To fix this:

1. **Get your Supabase connection string**:
   - Go to Supabase Dashboard → Project Settings → Database
   - Copy the "Connection string" (URI format)
   - It should look like: `postgresql://postgres.[PROJECT-REF]:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres`

2. **Set up the database schema**:

   ```bash
   # Set DATABASE_URL environment variable
   export DATABASE_URL="postgresql://postgres.[PROJECT-REF]:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"

   # Run the setup script
   ./scripts/setup-supabase-schema.sh
   ```

   Or manually:

   ```bash
   export DATABASE_URL="your-connection-string"
   npx prisma generate
   npx prisma db push --accept-data-loss
   npm run db:seed
   ```

3. **Verify setup**:
   - Check Supabase dashboard - should now show tables (users, accounts, sessions, verification_tokens)
   - Or run: `npx prisma studio` to view the database

## Required GitHub Secrets

The following secrets must be configured in GitHub Settings → Secrets and variables → Actions:

### Vercel Secrets

- `VERCEL_TOKEN` - Vercel authentication token
  - Get from: [Vercel Account Settings → Tokens](https://vercel.com/account/tokens)
- `VERCEL_ORG_ID` - Vercel organization ID
  - Get from: Vercel dashboard → Settings → General
- `VERCEL_PROJECT_ID` - Vercel project ID
  - Get from: Vercel project settings → General

### Supabase Secrets

- `SUPABASE_ACCESS_TOKEN` - Supabase access token
  - Get from: [Supabase Dashboard → Account Settings → Access Tokens](https://supabase.com/dashboard/account/tokens)
  - Required permissions: `projects:read` (to fetch project details)
- `SUPABASE_PROJECT_REF` - Supabase project reference ID
  - Get from: Supabase project settings → General → Reference ID
- `SUPABASE_DB_PASSWORD` - **REQUIRED** - Main Supabase project's database password
  - Get from: Supabase Dashboard → Project Settings → Database → Connection string
  - Extract the password from the connection string: `postgresql://postgres.[PROJECT-REF]:[PASSWORD]@...`
  - This is used to connect to the main database to create/drop schemas

### Optional Secrets

- `NEXTAUTH_SECRET` - NextAuth secret (if not provided, a random secret is generated per preview)

## How It Works

### 1. Deploy Preview Job

The `deploy-preview` job:

1. Checks out the PR branch code
2. Creates a PostgreSQL schema (e.g., `preview_pr7`) in the main Supabase project
3. Applies database migrations to the preview schema using `search_path`
4. Seeds the preview database with test data
5. Deploys the branch to Vercel as a preview deployment
6. Sets preview-specific environment variables on Vercel (including schema-specific DATABASE_URL)
7. Comments on the PR with the preview URL

### 2. E2E Preview Job

The `e2e-preview` job:

1. Waits for the Vercel preview deployment to be ready
2. Runs E2E tests against the preview URL (not localhost)
3. Uploads test results and videos as artifacts
4. Comments on the PR with test results

### 3. Cleanup Preview Job

The `cleanup-preview` job:

1. Runs when a PR is closed
2. Drops the PostgreSQL schema (e.g., `DROP SCHEMA preview_pr7 CASCADE`)
3. Vercel automatically cleans up preview deployments
4. Comments on the PR confirming cleanup

## Supabase Preview Schemas

Review apps create isolated PostgreSQL schemas within a single Supabase project for each pull request. This provides complete data isolation while working within the free tier's project limits.

**How It Works:**

- Each PR gets its own PostgreSQL schema (e.g., `preview_pr7`, `preview_pr8`)
- Schemas are created in the main Supabase project's database
- Connection strings use `search_path` parameter to target specific schemas
- Prisma migrations apply to the schema-specific search path
- Schemas are dropped when PRs are closed

**Requirements:**

- Single Supabase project (works with free tier!)
- `SUPABASE_ACCESS_TOKEN` with `projects:read` permission (to fetch project details)
- `SUPABASE_PROJECT_REF` for the main project
- `SUPABASE_DB_PASSWORD` for the main project's database password

**Benefits:**

- ✅ Works with Supabase free tier (no Team plan required)
- ✅ Complete data isolation between preview instances
- ✅ Fast schema creation (instant vs. 30+ seconds for projects)
- ✅ Easy cleanup (drop schema vs. delete project)
- ✅ No API rate limits for schema operations
- ✅ True branch-based database isolation

**Limitations:**

- ⚠️ All schemas share the same database resources (500MB limit on free tier)
- ⚠️ Need to monitor total database size across all preview schemas
- ⚠️ Schema names must be unique (PR number ensures this)
- ⚠️ Requires main project's database password to be stored as a secret

## Environment Variables

Preview deployments receive the following environment variables:

- `DATABASE_URL` - Connection string for the preview schema (includes `search_path=preview_pr{NUMBER}`)
  - Format: `postgresql://postgres.[PROJECT-REF]:[PASSWORD]@[HOST]:5432/postgres?sslmode=require&search_path=preview_pr7`
- `NEXTAUTH_SECRET` - Generated per preview (or from secret)
- `NEXTAUTH_URL` - Vercel preview URL
- `NEXT_PUBLIC_APP_URL` - Vercel preview URL

**Important Note**: Environment variables are set for the `preview` environment scope, which means all preview deployments share the same environment variables. The workflow sets these variables right before each deployment to ensure the latest values are used. However, if multiple PRs deploy simultaneously, they may temporarily overwrite each other's variables. For production use with many concurrent PRs, consider using the Vercel API to set deployment-specific environment variables.

**Schema Isolation**: Each preview deployment uses a unique `search_path` parameter in the DATABASE_URL, ensuring that Prisma operations target the correct schema. This provides complete data isolation between preview instances.

## Playwright Configuration

The Playwright configuration (`playwright.config.ts`) has been updated to:

- Use `PREVIEW_URL` environment variable for base URL when testing preview deployments
- Disable local dev server when `PREVIEW_URL` is set
- Fall back to `http://localhost:3000` for local E2E testing

## CI Workflow Integration

The main CI workflow (`.github/workflows/ci.yml`) has been updated to:

- Skip E2E tests for pull requests (review apps workflow handles it)
- Continue running E2E tests for `main` and `develop` branches

## Troubleshooting

### Preview Deployment Fails

**Issue**: Vercel deployment fails

**Solutions**:

- Check Vercel project is linked correctly
- Verify `VERCEL_TOKEN`, `VERCEL_ORG_ID`, and `VERCEL_PROJECT_ID` secrets are set
- Check Vercel deployment logs in the workflow run
- Ensure build succeeds locally

### Supabase Preview Schema Creation Fails

**Issue**: PostgreSQL schema creation fails

**Solutions**:

- Verify `SUPABASE_ACCESS_TOKEN` has `projects:read` permission (to fetch project details)
- Verify `SUPABASE_DB_PASSWORD` is set correctly (main project's database password)
- Check that `SUPABASE_PROJECT_REF` is correct
- Verify the main Supabase project is accessible
- Check database connection string format
- Ensure Prisma Client is generated before schema creation
- Check workflow logs for specific error messages

**Common Errors**:

- `SUPABASE_DB_PASSWORD is required but not set`: Add the main project's database password to GitHub secrets
- `Failed to extract database host`: Verify `SUPABASE_PROJECT_REF` and `SUPABASE_ACCESS_TOKEN` are correct
- `Error creating schema`: Check database permissions and connection string

### E2E Tests Fail on Preview

**Issue**: E2E tests fail against preview deployment

**Solutions**:

- Check preview URL is accessible (wait longer for deployment)
- Verify environment variables are set correctly on Vercel
- Check database connection (Supabase preview instance)
- Review test logs and videos in workflow artifacts
- Ensure preview deployment is fully ready before tests run

### Cleanup Fails

**Issue**: Preview resources not cleaned up

**Solutions**:

- Check cleanup script logs in workflow
- Vercel automatically cleans up preview deployments
- Supabase preview schemas may need manual cleanup if script fails
- To manually drop a schema, connect to your Supabase database and run:
  ```sql
  DROP SCHEMA IF EXISTS preview_pr{NUMBER} CASCADE;
  ```
- Check Supabase dashboard → Database → Schemas to see all preview schemas

## Manual Testing

To test the review apps workflow manually:

1. Create a test PR branch
2. Push the branch to GitHub
3. Open a pull request
4. Monitor the workflow in GitHub Actions
5. Check PR comments for preview URL and test results
6. Close the PR to trigger cleanup

## Best Practices

1. **Monitor Resource Usage**: Review apps create schemas that share the main database's resources (500MB on free tier)
2. **Clean Up Orphaned Schemas**: Periodically check for orphaned preview schemas and drop them manually if needed
3. **Set Timeouts**: Workflow has timeouts to prevent infinite hangs
4. **Review Test Results**: Always check E2E test results before merging
5. **Use Branch Naming**: Follow branch naming conventions for better organization
6. **Monitor Database Size**: Keep an eye on total database size across all schemas to stay within free tier limits

## Limitations

- ⚠️ All preview schemas share the same database resources (500MB limit on free tier)
- ⚠️ Need to monitor total database size across all preview schemas
- ⚠️ Requires main project's database password to be stored as a secret
- Vercel preview deployments are automatically cleaned up after 30 days of inactivity
- E2E tests run sequentially (not in parallel) to avoid resource conflicts
- Schema creation is instant (no waiting for project initialization)

## Future Improvements

- [ ] Automatic cleanup of stale preview schemas (older than X days)
- [ ] Parallel E2E test execution
- [ ] Schema health checks
- [ ] Database size monitoring and alerts
- [ ] Integration with Supabase Branching (when available)
- [ ] Support for schema-level backups

## Related Documentation

- [Vercel Preview Deployments](https://vercel.com/docs/deployments/preview-deployments)
- [Supabase Management API](https://supabase.com/docs/reference/api)
- [GitHub Actions Workflows](./GIT_WORKFLOW.md)
- [E2E Testing Setup](./GIT_SETUP.md)
