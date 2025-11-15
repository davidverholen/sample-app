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
  - `lint` (from CI workflow)
  - `type-check` (from CI workflow)
  - `test` (from CI workflow)
  - `build` (from CI workflow)
  - `e2e` (from CI workflow)
  - `security` (from CI workflow)
  - `commit-message` (from CI workflow)
  - `pr-checks` (from CI workflow)
- ✅ **Require branches to be up to date before merging**

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
  - `lint`
  - `type-check`
  - `test`
  - `build`
- ✅ **Require branches to be up to date before merging**

#### 3. Restrict Pushes

- ✅ **Restrict who can push to matching branches**: Team members only (or no one)
- ✅ **Allow force pushes**: ❌ Disabled
- ✅ **Allow deletions**: ❌ Disabled

## Setup Instructions

### Step 1: Navigate to Branch Protection Settings

1. Go to your GitHub repository
2. Click **Settings** → **Branches**
3. Under **Branch protection rules**, click **Add rule**

### Step 2: Configure `main` Branch Protection

1. **Branch name pattern**: `main`
2. Configure all settings as described above
3. Click **Create**

### Step 3: Configure `develop` Branch Protection

1. Click **Add rule** again
2. **Branch name pattern**: `develop`
3. Configure settings as described above
4. Click **Create**

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
