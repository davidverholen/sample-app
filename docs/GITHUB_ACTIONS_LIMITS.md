# GitHub Actions Usage Limits & Optimization

## Free Tier Limits

### Private Repositories

- **2,000 minutes/month** for free accounts
- **500 MB storage** for artifacts
- **500 MB bandwidth** per month
- Jobs timeout after **6 hours** (default)

### Public Repositories

- **Unlimited minutes** ✅
- **Unlimited storage** ✅
- **Unlimited bandwidth** ✅

## What We've Optimized

### 1. Added Timeouts to All Jobs

All jobs now have explicit timeouts to prevent infinite hangs:

- **Lint**: 10 minutes
- **Type Check**: 10 minutes
- **Test**: 15 minutes
- **Build**: 20 minutes
- **E2E Tests**: 30 minutes
- **Security Scan**: 10 minutes
- **Commit Message Validation**: 5 minutes
- **PR Checks**: 5 minutes
- **PR Summary**: 2 minutes

### 2. Removed Paid Features

- ❌ **Dependency Review** (requires GitHub Advanced Security for private repos)
- ❌ **CodeQL Analysis** (requires GitHub Advanced Security for private repos)
- ✅ **npm audit** (always free, kept)

### 3. Optimized E2E Tests

- Only install Chromium browser (not all browsers)
- Only run on PRs and main/develop branches
- Added 30-minute timeout

### 4. Made Codecov Optional

- Only runs if `CODECOV_TOKEN` secret is set
- Has 2-minute timeout
- Won't hang if token is missing

### 5. Added Timeouts to Slow Steps

- Playwright browser installation: 5 minutes
- TruffleHog secret scanning: 5 minutes
- Codecov upload: 2 minutes

## Monitoring Usage

### Check Your Usage

1. Go to your repository on GitHub
2. Click **Settings** → **Actions** → **Usage**
3. View your monthly minutes consumption

### Typical Usage Per Run

- **Lint**: ~2-3 minutes
- **Type Check**: ~1-2 minutes
- **Test**: ~3-5 minutes
- **Build**: ~5-8 minutes
- **E2E**: ~10-15 minutes (only on PRs/main/develop)
- **Security**: ~2-3 minutes
- **PR Checks**: ~1-2 minutes

**Total per PR**: ~25-40 minutes (with E2E) or ~15-20 minutes (without E2E)

### Monthly Estimate

- **~50 PRs/month** = ~1,250-2,000 minutes (within free tier)
- **~100 PRs/month** = ~2,500-4,000 minutes (exceeds free tier)

## If You Exceed Limits

### Options

1. **Make repository public** (unlimited minutes)
2. **Upgrade to GitHub Pro** ($4/month):
   - 3,000 minutes/month for private repos
   - Additional minutes: $0.008/minute
3. **Optimize further**:
   - Skip E2E tests on draft PRs
   - Run E2E tests only on main/develop
   - Use matrix builds more efficiently
   - Cache more aggressively

## Troubleshooting Hangs

### Common Causes

1. **Missing secrets** (Codecov, etc.) - Now handled with conditionals
2. **Network issues** - Timeouts prevent infinite waits
3. **Database service slow to start** - Health checks help
4. **Playwright browser download** - Now only installs Chromium

### If Actions Still Hang

1. Check the Actions tab for which step is hanging
2. Look at the logs to see where it's stuck
3. Check if you've hit your usage limit
4. Verify all required secrets are set

## Best Practices

### To Save Minutes

- ✅ Use caching (already configured)
- ✅ Run E2E tests only when needed
- ✅ Use job dependencies to avoid redundant work
- ✅ Skip jobs on draft PRs (optional)

### To Avoid Hangs

- ✅ All jobs have timeouts (done)
- ✅ Optional steps check for secrets (done)
- ✅ Database services have health checks (done)
- ✅ Continue-on-error for non-critical steps (done)

## Current Configuration Summary

- ✅ All jobs have timeouts
- ✅ No paid features required
- ✅ E2E tests optimized (Chromium only)
- ✅ Codecov optional
- ✅ Security scanning free (npm audit only)
- ✅ Proper error handling throughout

Your workflows should now run reliably without hanging and stay within free tier limits for reasonable usage.
