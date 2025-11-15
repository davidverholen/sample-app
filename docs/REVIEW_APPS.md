# Review Apps with Vercel and Supabase

This document describes the review apps (preview deployments) setup for pull requests, which automatically deploy each PR branch to Vercel, create a Supabase preview instance, and run E2E tests.

## Overview

When a pull request is opened or updated, the review apps workflow:

1. **Deploys to Vercel Preview** - Creates a preview deployment of the PR branch
2. **Creates Supabase Preview Instance** - Sets up a branch-based database for the preview
3. **Runs E2E Tests** - Executes end-to-end tests against the preview deployment
4. **Cleans Up** - Removes preview resources when the PR is closed

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
- `SUPABASE_PROJECT_REF` - Supabase project reference ID
  - Get from: Supabase project settings → General → Reference ID

### Optional Secrets

- `NEXTAUTH_SECRET` - NextAuth secret (if not provided, a random secret is generated per preview)
- `SUPABASE_DB_PASSWORD` - Database password (if using shared database approach)

## How It Works

### 1. Deploy Preview Job

The `deploy-preview` job:

1. Checks out the PR branch code
2. Creates a Supabase preview instance (or uses shared database with branch schema)
3. Applies database migrations to the preview instance
4. Seeds the preview database with test data
5. Deploys the branch to Vercel as a preview deployment
6. Sets preview-specific environment variables on Vercel
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
2. Deletes the Supabase preview instance
3. Vercel automatically cleans up preview deployments
4. Comments on the PR confirming cleanup

## Supabase Preview Instances

### Approach 1: New Supabase Projects (Recommended for Production)

The scripts attempt to create new Supabase projects via the Management API. This requires:

- Supabase Team plan with API access
- `SUPABASE_ACCESS_TOKEN` with project creation permissions
- `SUPABASE_ORG_ID` environment variable (can be added to workflow)

**Pros:**

- Complete isolation between preview instances
- No risk of data conflicts
- True branch-based databases

**Cons:**

- Requires paid Supabase plan
- API rate limits may apply
- Slower to create/delete

### Approach 2: Shared Database with Branch Schemas (Fallback)

If project creation fails, the scripts fall back to using a shared database with branch-specific schemas:

- Uses the main Supabase project database
- Creates a schema per branch: `preview_<branch>_pr<number>`
- Applies migrations to the branch schema

**Pros:**

- Works with free Supabase plan
- Faster setup
- No API rate limits

**Cons:**

- Less isolation (shared database)
- Requires careful schema management
- Potential for naming conflicts

## Environment Variables

Preview deployments receive the following environment variables:

- `DATABASE_URL` - Connection string for the Supabase preview instance
- `NEXTAUTH_SECRET` - Generated per preview (or from secret)
- `NEXTAUTH_URL` - Vercel preview URL
- `NEXT_PUBLIC_APP_URL` - Vercel preview URL

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

### Supabase Preview Instance Creation Fails

**Issue**: Supabase preview instance creation fails

**Solutions**:

- Verify `SUPABASE_ACCESS_TOKEN` has correct permissions
- Check if using Management API approach (requires Team plan)
- Script will fall back to shared database approach
- Check Supabase API rate limits

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
- Supabase preview instances may need manual cleanup if script fails
- Check Supabase dashboard for orphaned projects/schemas

## Manual Testing

To test the review apps workflow manually:

1. Create a test PR branch
2. Push the branch to GitHub
3. Open a pull request
4. Monitor the workflow in GitHub Actions
5. Check PR comments for preview URL and test results
6. Close the PR to trigger cleanup

## Best Practices

1. **Monitor Resource Usage**: Review apps create resources that consume Supabase/Vercel quotas
2. **Clean Up Orphaned Resources**: Periodically check for orphaned preview instances
3. **Set Timeouts**: Workflow has timeouts to prevent infinite hangs
4. **Review Test Results**: Always check E2E test results before merging
5. **Use Branch Naming**: Follow branch naming conventions for better organization

## Limitations

- Supabase preview instances require Management API access (Team plan) for full isolation
- Vercel preview deployments are automatically cleaned up after 30 days of inactivity
- E2E tests run sequentially (not in parallel) to avoid resource conflicts
- Preview instances share the same Supabase region as the main project

## Future Improvements

- [ ] Support for multiple Supabase regions
- [ ] Parallel E2E test execution
- [ ] Automatic cleanup of stale preview instances
- [ ] Preview instance health checks
- [ ] Integration with Supabase Branching (when available)

## Related Documentation

- [Vercel Preview Deployments](https://vercel.com/docs/deployments/preview-deployments)
- [Supabase Management API](https://supabase.com/docs/reference/api)
- [GitHub Actions Workflows](./GIT_WORKFLOW.md)
- [E2E Testing Setup](./GIT_SETUP.md)
