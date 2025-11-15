# GitHub Branch Protection Setup

This document describes how to configure GitHub branch protection rules to enforce the Git workflow at the repository level.

## Overview

While Husky hooks provide local enforcement, GitHub branch protection rules provide server-side enforcement that cannot be bypassed. This is the final line of defense for maintaining code quality and workflow compliance.

## Solo Developer Configuration

If you're the only contributor to this repository, you can configure branch protection to allow self-merges while still enforcing self-review through workflow rules. This maintains code quality standards while allowing you to work independently.

**Key Configuration for Solo Developers**:

- Set **Required number of reviewers** to `0`
- Enable **Allow specified actors to bypass required pull requests** (for admins)
- Enforce **self-review checklist** via workflow rules (see `.cursor/rules/git-workflow-enforcement.mdc`)
- All CI/CD status checks must still pass

## Required Branch Protection Rules

### `main` Branch Protection

Configure the following rules for the `main` branch:

#### 1. Require Pull Request Reviews

**For Solo Developers**:

- ✅ **Require a pull request before merging**
- ⚠️ **Required number of reviewers**: 0 (self-review enforced via workflow rules)
- ✅ **Allow specified actors to bypass required pull requests**: Enable for repository admins
- ✅ **Dismiss stale pull request approvals when new commits are pushed** (if enabled)

**For Teams**:

- ✅ **Require a pull request before merging**
- ✅ **Required number of reviewers**: 1 (2 for security-related changes)
- ✅ **Dismiss stale pull request approvals when new commits are pushed**
- ✅ **Require review from Code Owners** (if CODEOWNERS file exists)
- ✅ **Restrict who can dismiss pull request reviews**: Repository admins only

#### 2. Require Status Checks to Pass

- ✅ **Require status checks to pass before merging**
- ✅ **Required status checks**:
  - `Lint` (from CI workflow)
  - `Type Check` (from CI workflow)
  - `Test` (from CI workflow)
  - `Build` (from CI workflow)
  - `E2E Tests` (from CI workflow)
  - `Security Scan` (from CI workflow)
  - `Validate Commit Messages` (from CI workflow)
  - `PR Checks` (from CI workflow)
- ✅ **Require branches to be up to date before merging**

**Important**: GitHub status check context names use the job's `name:` field from the workflow file, NOT `workflow-name / job-name`. To find the correct status check names, check a PR's "Checks" tab or use: `gh pr view <number> --json statusCheckRollup --jq '.statusCheckRollup[].name'`. Use those exact names (case-sensitive) in branch protection settings.

#### 3. Require Conversation Resolution

- ✅ **Require conversation resolution before merging**

#### 4. Require Linear History

- ✅ **Require linear history** (prevents merge commits, enforces rebase/squash)

#### 5. Restrict Pushes

- ✅ **Restrict who can push to matching branches**: No one (only via PR)
- ✅ **Allow force pushes**: ❌ Disabled
- ✅ **Allow deletions**: ❌ Disabled

#### 6. Branch Name Pattern (Optional but Recommended)

- ✅ **Branch name pattern**: `^(feature|bugfix|hotfix|release)/.*`
- This prevents creating branches that don't follow the naming convention

### `develop` Branch Protection

Configure similar rules for `develop`, but slightly less strict:

#### 1. Require Pull Request Reviews

**For Solo Developers**:

- ✅ **Require a pull request before merging**
- ⚠️ **Required number of reviewers**: 0 (self-review enforced via workflow rules)
- ✅ **Allow specified actors to bypass required pull requests**: Enable for repository admins

**For Teams**:

- ✅ **Require a pull request before merging**
- ✅ **Required number of reviewers**: 1
- ✅ **Dismiss stale pull request approvals when new commits are pushed**

#### 2. Require Status Checks to Pass

- ✅ **Require status checks to pass before merging**
- ✅ **Required status checks**:
  - `Lint`
  - `Type Check`
  - `Test`
  - `Build`
- ✅ **Require branches to be up to date before merging**

**Important**: GitHub status check context names use the job's `name:` field from the workflow file. Check the workflow file (`.github/workflows/ci.yml`) for the `name:` field of each job, or view a PR's checks tab to see the exact names. Use those exact names (case-sensitive) in branch protection settings.

#### 3. Restrict Pushes

- ✅ **Restrict who can push to matching branches**: Team members only (or no one)
- ✅ **Allow force pushes**: ❌ Disabled
- ✅ **Allow deletions**: ❌ Disabled

## Setup Instructions

You can configure branch protection either via the GitHub UI or using the GitHub CLI (`gh`). Both methods are described below.

### Method 1: Using GitHub CLI (Recommended)

The GitHub CLI provides a programmatic way to configure branch protection, which is especially useful for updating status check names.

#### Prerequisites

```bash
# Install GitHub CLI (if not already installed)
# Linux: sudo apt install gh
# macOS: brew install gh

# Authenticate
gh auth login
```

#### Update Branch Protection Status Checks

**For `main` branch:**

```bash
gh api repos/:owner/:repo/branches/main/protection/required_status_checks \
  -X PATCH --input - << 'EOF'
{
  "strict": true,
  "contexts": [
    "Lint",
    "Type Check",
    "Test",
    "Build",
    "E2E Tests",
    "Security Scan",
    "Validate Commit Messages",
    "PR Checks"
  ]
}
EOF
```

**For `develop` branch:**

```bash
gh api repos/:owner/:repo/branches/develop/protection/required_status_checks \
  -X PATCH --input - << 'EOF'
{
  "strict": true,
  "contexts": [
    "Lint",
    "Type Check",
    "Test",
    "Build"
  ]
}
EOF
```

**Verify the update:**

```bash
# Check main branch protection
gh api repos/:owner/:repo/branches/main/protection --jq '.required_status_checks.contexts[]'

# Check develop branch protection
gh api repos/:owner/:repo/branches/develop/protection --jq '.required_status_checks.contexts[]'
```

For more administrative tasks using `gh` CLI, see [Git Workflow Documentation](./GIT_WORKFLOW.md#using-github-cli-gh-for-administrative-tasks).

### Method 2: Using GitHub UI

#### Step 1: Navigate to Branch Protection Settings

1. Go to your GitHub repository
2. Click **Settings** → **Branches**
3. Under **Branch protection rules**, click **Add rule** (or edit existing rule)

#### Step 2: Configure `main` Branch Protection

1. **Branch name pattern**: `main`
2. Configure all settings as described above
3. **Important**: Under "Required status checks", use the exact job names from the workflow (case-sensitive):
   - ✅ `Lint` (from job `name: Lint`)
   - ✅ `Type Check` (from job `name: Type Check`)
   - ✅ `Test` (from job `name: Test`)
   - ✅ `Build` (from job `name: Build`)
   - ✅ `E2E Tests` (from job `name: E2E Tests`)
   - ✅ `Security Scan` (from job `name: Security Scan`)
   - ✅ `Validate Commit Messages` (from job `name: Validate Commit Messages`)
   - ✅ `PR Checks` (from job `name: PR Checks`)
4. Click **Save** or **Create**

#### Step 3: Configure `develop` Branch Protection

1. Click **Add rule** again (or edit existing rule)
2. **Branch name pattern**: `develop`
3. Configure settings as described above
4. **Important**: Under "Required status checks", use the exact job names (case-sensitive):
   - ✅ `Lint`
   - ✅ `Type Check`
   - ✅ `Test`
   - ✅ `Build`
5. Click **Save** or **Create**

### Step 4: Verify Protection

1. Try to push directly to `main`:

   ```bash
   git checkout main
   git push origin main
   ```

   This should be blocked or require special permissions.

2. Create a test branch and try to push:
   ```bash
   git checkout -b test-direct-push
   git push origin test-direct-push
   ```
   This should work, but the branch name validation will warn you.

## Bypassing Protection (Emergency Only)

⚠️ **WARNING**: Only use in emergencies (e.g., critical security fix, repository corruption).

### For Repository Admins

1. Go to **Settings** → **Branches**
2. Temporarily disable protection rules
3. Make the necessary changes
4. Re-enable protection rules immediately

### Alternative: Use GitHub UI

1. Make changes via GitHub's web editor
2. Create a commit directly through the UI
3. This bypasses some protections but still requires admin access

## Enforcement Summary

| Rule                           | Local (Husky)     | GitHub Protection   | Bypassable?         |
| ------------------------------ | ----------------- | ------------------- | ------------------- |
| Commit message format          | ✅ Yes            | ✅ Yes (CI)         | ⚠️ `--no-verify`    |
| Code quality checks            | ✅ Yes            | ✅ Yes (CI)         | ⚠️ `--no-verify`    |
| Branch naming                  | ✅ Yes (pre-push) | ⚠️ Optional         | ⚠️ `--no-verify`    |
| Direct commits to main/develop | ✅ Yes (pre-push) | ✅ Yes (protection) | ❌ No (server-side) |
| PR requirements                | ❌ No             | ✅ Yes              | ❌ No               |
| Required reviews               | ❌ No             | ✅ Yes              | ❌ No               |

## Best Practices

1. **Never bypass protection rules** unless it's a true emergency
2. **Document any bypasses** in a team communication channel
3. **Review bypassed changes** immediately after the emergency
4. **Re-enable protection** as soon as possible
5. **Use `--no-verify` sparingly** and only for non-critical changes
6. **Always create feature branches** for any changes
7. **Link all changes to issues** via branch names and commit messages

## Troubleshooting

### Issue: "Cannot push to protected branch"

**Solution**: Create a feature branch and open a PR instead.

### Issue: "Required status checks are failing"

**Solution**:

1. Check the CI logs to see what failed
2. Fix the issues locally
3. Push again (CI will re-run)

### Issue: "Required status checks do not match expected builds"

**Solution**:

This happens when the status check names in branch protection don't match the actual status check names created by GitHub Actions.

1. **Check the actual status check names**:
   ```bash
   # View status checks on a PR
   gh pr view <number> --json statusCheckRollup --jq '.statusCheckRollup[].name'
   
   # Or check via API
   gh api repos/:owner/:repo/pulls/<number> --jq '.head.sha' | \
     xargs -I {} gh api repos/:owner/:repo/commits/{}/check-runs --jq '.check_runs[].name'
   ```

2. **Update branch protection settings**:
   - Go to **Settings** → **Branches**
   - Edit your branch protection rule
   - Under "Required status checks", use the exact job names from the workflow's `name:` field
   - Status check names are case-sensitive and must match exactly

3. **Verify the status check names match**:
   - GitHub uses the job's `name:` field as the status check context
   - Check the workflow file (`.github/workflows/ci.yml`) for the `name:` field of each job
   - Make sure every required check in branch protection matches exactly what appears in the PR checks tab

### Issue: "Branch is out of date"

**Solution**:

```bash
git checkout your-branch
git fetch origin
git rebase origin/main  # or origin/develop
# Resolve conflicts if any
git push --force-with-lease
```

### Issue: "Need approval from reviewers"

**Solution**: Request review from team members or wait for approval.

## References

- [GitHub Branch Protection Documentation](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches)
- [Git Workflow Documentation](./GIT_WORKFLOW.md)
- [Git Setup Guide](./GIT_SETUP.md)
