# Git Workflow & Change Management

This document defines the Git workflow, branching strategy, and change management process for this Next.js SaaS application.

## Table of Contents

1. [Branching Strategy](#branching-strategy)
2. [Commit Message Convention](#commit-message-convention)
3. [Pull Request Process](#pull-request-process)
4. [Release Management](#release-management)
5. [Code Review Guidelines](#code-review-guidelines)
6. [Issue Tracking](#issue-tracking)
7. [CI/CD Integration](#cicd-integration)

## Branching Strategy

### Branch Types

#### `main` (Production)

- **Purpose**: Production-ready code only
- **Protection**:
  - Requires PR approval (minimum 1 reviewer)
  - Requires passing CI/CD checks
  - No direct commits allowed
  - Requires up-to-date branch
- **Deployment**: Auto-deploys to production
- **Naming**: `main`

#### `develop` (Development)

- **Purpose**: Integration branch for features
- **Protection**:
  - Requires PR approval for non-team members
  - Requires passing CI checks
- **Deployment**: Auto-deploys to staging environment
- **Naming**: `develop`

#### `feature/*` (Feature Branches)

- **Purpose**: New features or enhancements
- **Naming**: `feature/issue-number-short-description`
  - Example: `feature/123-user-authentication`
  - Example: `feature/456-dashboard-analytics`
- **Source**: Branch from `develop`
- **Merge**: Merge back to `develop` via PR
- **Lifecycle**: Delete after merge

#### `bugfix/*` (Bug Fix Branches)

- **Purpose**: Bug fixes for `develop` branch
- **Naming**: `bugfix/issue-number-short-description`
  - Example: `bugfix/789-login-error`
- **Source**: Branch from `develop`
- **Merge**: Merge back to `develop` via PR
- **Lifecycle**: Delete after merge

#### `hotfix/*` (Hotfix Branches)

- **Purpose**: Critical production fixes
- **Naming**: `hotfix/issue-number-short-description`
  - Example: `hotfix/999-security-patch`
- **Source**: Branch from `main`
- **Merge**: Merge to both `main` and `develop`
- **Lifecycle**: Delete after merge

#### `release/*` (Release Branches)

- **Purpose**: Prepare new production release
- **Naming**: `release/v1.2.3` or `release/v1.2.3-rc.1`
- **Source**: Branch from `develop`
- **Merge**: Merge to `main` and back to `develop`
- **Lifecycle**: Delete after merge

### Branch Workflow Diagram

```
main ────────────────────────────────────────────── (production)
  │
  │ (hotfix)
  │
develop ──────────────────────────────────────────── (staging)
  │
  ├── feature/123-user-auth ────────────────────────
  ├── feature/456-dashboard ────────────────────────
  ├── bugfix/789-login-error ───────────────────────
  └── release/v1.2.3 ──────────────────────────────
```

## Commit Message Convention

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification.

### Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- **feat**: New feature
- **fix**: Bug fix
- **docs**: Documentation changes
- **style**: Code style changes (formatting, missing semicolons, etc.)
- **refactor**: Code refactoring
- **perf**: Performance improvements
- **test**: Adding or updating tests
- **build**: Build system or dependency changes
- **ci**: CI/CD configuration changes
- **chore**: Other changes that don't modify src or test files
- **revert**: Revert a previous commit

### Scope (Optional)

- `auth`: Authentication related
- `api`: API routes
- `ui`: UI components
- `db`: Database changes
- `config`: Configuration changes
- `deps`: Dependencies

### Examples

```bash
feat(auth): add OAuth2 login support

Implement Google and GitHub OAuth2 providers using NextAuth.js.
Adds new provider configuration and user profile mapping.

Closes #123

fix(api): resolve user creation validation error

The email validation was incorrectly rejecting valid email formats.
Updated Zod schema to match RFC 5322 specification.

Fixes #456

docs(readme): update installation instructions

Add Docker setup instructions and environment variable examples.

refactor(ui): extract Button component to design system

Move Button component to shared UI library for reusability across
the application.

test(auth): add integration tests for login flow

Cover happy path and error scenarios for user authentication.

perf(db): optimize user query with proper indexing

Add database index on email field to improve query performance.
```

### Commit Message Rules

1. **Subject Line**:
   - Maximum 72 characters
   - Use imperative mood ("add" not "added" or "adds")
   - No period at the end
   - Reference issue number if applicable: `#123`

2. **Body** (Optional but recommended for complex changes):
   - Explain what and why, not how
   - Wrap at 72 characters
   - Reference issues: `Closes #123`, `Fixes #456`, `Relates to #789`

3. **Footer** (Optional):
   - Breaking changes: `BREAKING CHANGE: description`
   - Issue references: `Closes #123`, `Fixes #456`

## Pull Request Process

### PR Creation Checklist

Before creating a PR, ensure:

- [ ] **All uncommitted changes are committed and pushed** (see [Pre-GitHub Operations Checklist](#pre-github-operations-checklist))
- [ ] Code follows project style guidelines
- [ ] All tests pass locally (`npm test`)
- [ ] Type checking passes (`npm run type-check`)
- [ ] Linting passes (`npm run lint`)
- [ ] No console.log or debug code
- [ ] Documentation updated if needed
- [ ] Commit messages follow convention
- [ ] Branch is up to date with target branch
- [ ] PR description is complete

### Pre-GitHub Operations Checklist

**CRITICAL RULE**: Always check for and commit uncommitted changes before performing any GitHub operations (creating PRs, pushing branches, etc.).

Before any GitHub operation:

1. **Check for uncommitted changes**:

   ```bash
   git status
   ```

2. **If there are uncommitted changes**:
   - Review the changes: `git diff`
   - Stage the changes: `git add <files>` or `git add .`
   - Commit with proper message: `git commit -m "type(scope): description"`
   - Push to remote: `git push origin <branch-name>`

3. **Verify working tree is clean**:

   ```bash
   git status
   # Should show: "nothing to commit, working tree clean"
   ```

4. **Only then proceed with GitHub operations**:
   - Creating pull requests
   - Pushing branches
   - Creating releases
   - Any other GitHub API operations

**Why this matters**:

- Ensures all changes are tracked in version control
- Prevents loss of uncommitted work
- Maintains clean git history
- Ensures PRs reflect the complete state of changes
- Prevents confusion about what's included in a PR

### PR Title Format

Follow the same convention as commit messages:

```
<type>(<scope>): <subject>
```

Examples:

- `feat(auth): add password reset functionality`
- `fix(api): resolve user validation error`
- `refactor(ui): extract Button component`

### PR Description Template

Use the PR template (see `.github/pull_request_template.md`). Include:

1. **Description**: What changes are made and why
2. **Type of Change**: Feature, Bug Fix, Refactor, etc.
3. **Testing**: How was this tested?
4. **Checklist**: Completion checklist
5. **Screenshots**: If UI changes
6. **Related Issues**: Link to related issues

### PR Review Process

1. **Author**:
   - Create PR with complete description
   - Request review from appropriate team members
   - Address review comments
   - Keep PR updated with target branch

2. **Reviewers**:
   - Review within 24 hours (business days)
   - Provide constructive feedback
   - Approve or request changes
   - Check for:
     - Code quality and style
     - Test coverage
     - Security concerns
     - Performance implications
     - Documentation completeness

3. **Merge Requirements**:
   - Minimum 1 approval (2 for security-related changes)
   - All CI checks passing
   - No merge conflicts
   - Up to date with target branch

4. **Merge Strategy**:
   - **Squash and Merge**: For feature/bugfix branches (default)
   - **Merge Commit**: For release branches
   - **Rebase and Merge**: Not recommended (use squash instead)

### PR Labels

Use labels to categorize PRs:

- `type:feature`: New features
- `type:bugfix`: Bug fixes
- `type:refactor`: Code refactoring
- `type:docs`: Documentation
- `type:chore`: Maintenance tasks
- `priority:high`: High priority
- `priority:low`: Low priority
- `breaking`: Breaking changes
- `security`: Security-related changes
- `needs-review`: Awaiting review
- `ready-to-merge`: Approved and ready

## Release Management

### Versioning

We follow [Semantic Versioning](https://semver.org/): `MAJOR.MINOR.PATCH`

- **MAJOR**: Breaking changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes (backward compatible)

### Release Process

#### 1. Create Release Branch

```bash
# From develop branch
git checkout develop
git pull origin develop
git checkout -b release/v1.2.3
git push origin release/v1.2.3
```

#### 2. Prepare Release

- Update version in `package.json`
- Update `CHANGELOG.md`
- Run full test suite
- Update documentation if needed
- Create release PR to `main`

#### 3. Release PR

- PR from `release/v1.2.3` to `main`
- Requires 2 approvals
- All CI checks must pass
- Include release notes in PR description

#### 4. Merge to Main

- Merge release PR to `main`
- Tag release: `git tag -a v1.2.3 -m "Release v1.2.3"`
- Push tag: `git push origin v1.2.3`

#### 5. Merge Back to Develop

- Merge `main` back to `develop`
- Resolve any conflicts
- Continue development

#### 6. Create GitHub Release

- Use GitHub Releases page
- Use tag created above
- Include changelog
- Attach release notes

### Hotfix Process

For critical production issues:

1. Create hotfix branch from `main`:

   ```bash
   git checkout main
   git pull origin main
   git checkout -b hotfix/999-critical-bug
   ```

2. Fix the issue and test thoroughly

3. Create PR to `main`:
   - Mark as `priority:high`
   - Requires 2 approvals
   - Fast-track review process

4. Merge to `main` and tag:

   ```bash
   git tag -a v1.2.4 -m "Hotfix v1.2.4"
   git push origin v1.2.4
   ```

5. Merge back to `develop`:
   ```bash
   git checkout develop
   git merge main
   git push origin develop
   ```

### Changelog

Maintain `CHANGELOG.md` following [Keep a Changelog](https://keepachangelog.com/) format:

```markdown
## [1.2.3] - 2024-01-15

### Added

- User authentication with OAuth2
- Dashboard analytics

### Changed

- Improved API response times

### Fixed

- Login error handling
- Database connection pooling

### Security

- Updated dependencies with security patches
```

## Code Review Guidelines

### For Authors

1. **Keep PRs Small**:
   - Focused on single feature/fix
   - Easier to review
   - Faster to merge

2. **Write Clear Descriptions**:
   - Explain what and why
   - Include context
   - Link related issues

3. **Respond to Feedback**:
   - Address all comments
   - Ask questions if unclear
   - Update PR as needed

4. **Keep PR Updated**:
   - Rebase on target branch regularly
   - Resolve conflicts promptly

### For Reviewers

1. **Be Constructive**:
   - Explain reasoning
   - Suggest alternatives
   - Be respectful

2. **Check Thoroughly**:
   - Code quality
   - Test coverage
   - Security concerns
   - Performance
   - Documentation

3. **Review Promptly**:
   - Within 24 hours
   - Communicate delays
   - Prioritize urgent PRs

4. **Approve When Ready**:
   - Don't block on minor issues
   - Request changes for important issues
   - Approve if satisfied

## Issue Tracking

### Issue Types

- **Bug**: Something isn't working
- **Feature**: New functionality request
- **Enhancement**: Improvement to existing feature
- **Documentation**: Documentation improvements
- **Question**: Questions or discussions
- **Task**: General tasks

### Issue Labels

- `bug`: Bug reports
- `enhancement`: Feature requests
- `documentation`: Documentation
- `question`: Questions
- `good first issue`: Good for newcomers
- `help wanted`: Needs help
- `priority:high`: High priority
- `priority:medium`: Medium priority
- `priority:low`: Low priority
- `status:in-progress`: Currently being worked on
- `status:blocked`: Blocked by something
- `status:needs-review`: Needs review

### Issue Workflow

1. **Create Issue**: Use issue template
2. **Triage**: Label and assign
3. **Development**: Create branch, work on issue
4. **Review**: PR review process
5. **Close**: Issue closed when PR merged

## CI/CD Integration

### Continuous Integration

Automated checks on every PR:

1. **Linting**: ESLint checks
2. **Type Checking**: TypeScript validation
3. **Unit Tests**: Jest test suite
4. **E2E Tests**: Playwright tests
5. **Build**: Next.js build verification
6. **Security**: Dependency vulnerability scanning
7. **Commit Message Validation**: Conventional Commits format
8. **PR Title Validation**: Conventional Commits format

### Continuous Deployment

- **Staging**: Auto-deploy `develop` branch
- **Production**: Manual deployment from `main` (after release)

### GitHub Actions Workflows

See `.github/workflows/` for:

- `ci.yml`: Continuous Integration
- `release.yml`: Release automation
- `security.yml`: Security scanning

## Workflow Enforcement

### Local Enforcement (Husky Hooks)

The following checks are enforced locally via Git hooks:

1. **Pre-commit Hook** (`.husky/pre-commit`):
   - Linting (ESLint)
   - Code formatting (Prettier)
   - Type checking (TypeScript)
   - Unit tests

2. **Commit Message Hook** (`.husky/commit-msg`):
   - Validates Conventional Commits format
   - Checks subject line length (max 72 characters)
   - Ensures proper type and scope

3. **Pre-push Hook** (`.husky/pre-push`):
   - **Branch naming validation**: Enforces naming conventions
   - **Protected branch check**: Blocks direct pushes to `main`/`develop`
   - Build verification
   - Full test suite with coverage check (80% minimum)

### Server-Side Enforcement (GitHub)

For complete protection, configure GitHub branch protection rules:

- **Branch Protection**: Prevents direct pushes to protected branches
- **Required Reviews**: Ensures code review before merging
- **Status Checks**: Requires all CI checks to pass
- **PR Requirements**: Enforces PR workflow

See [GitHub Branch Protection Setup](./GITHUB_BRANCH_PROTECTION.md) for detailed configuration instructions.

### Using GitHub CLI (gh) for Administrative Tasks

The GitHub CLI (`gh`) provides a powerful command-line interface for managing repository settings and administrative tasks. This is especially useful for:

- Updating branch protection rules
- Managing repository settings
- Configuring workflows
- Managing issues and pull requests programmatically

#### Installation

```bash
# Linux (Debian/Ubuntu)
sudo apt install gh

# macOS
brew install gh

# Or download from: https://cli.github.com/
```

#### Authentication

```bash
# Login to GitHub
gh auth login

# Verify authentication
gh auth status
```

#### Common Administrative Tasks

**Update Branch Protection Status Checks**

When status check names change (e.g., after renaming a workflow), update branch protection:

```bash
# Update main branch protection
gh api repos/:owner/:repo/branches/main/protection/required_status_checks \
  -X PATCH --input - << 'EOF'
{
  "strict": true,
  "contexts": [
    "CI / lint",
    "CI / type-check",
    "CI / test",
    "CI / build",
    "CI / e2e",
    "CI / security",
    "CI / commit-message",
    "CI / pr-checks"
  ]
}
EOF

# Update develop branch protection
gh api repos/:owner/:repo/branches/develop/protection/required_status_checks \
  -X PATCH --input - << 'EOF'
{
  "strict": true,
  "contexts": [
    "CI / lint",
    "CI / type-check",
    "CI / test",
    "CI / build"
  ]
}
EOF
```

**View Current Branch Protection Settings**

```bash
# View main branch protection
gh api repos/:owner/:repo/branches/main/protection

# View required status checks
gh api repos/:owner/:repo/branches/main/protection --jq '.required_status_checks.contexts[]'
```

**Manage Repository Settings**

```bash
# View repository settings
gh repo view --json name,description,visibility

# Update repository description
gh repo edit --description "New description"

# Enable/disable features
gh repo edit --enable-issues
gh repo edit --enable-wiki
```

**Manage Branch Protection Rules**

```bash
# List all branch protection rules
gh api repos/:owner/:repo/branches --jq '.[].name'

# Get specific branch protection details
gh api repos/:owner/:repo/branches/main/protection

# Update pull request review requirements
gh api repos/:owner/:repo/branches/main/protection/required_pull_request_reviews \
  -X PATCH -f required_approving_review_count=0 \
  -f dismiss_stale_reviews=false
```

**Workflow Management**

```bash
# List workflows
gh workflow list

# View workflow runs
gh run list

# View specific workflow run
gh run view <run-id>

# Rerun a failed workflow
gh run rerun <run-id>
```

**Issue and PR Management**

```bash
# List issues
gh issue list

# Create an issue
gh issue create --title "Issue title" --body "Issue description"

# List PRs
gh pr list

# View PR details
gh pr view <number>

# Merge a PR
gh pr merge <number> --squash
```

#### Tips

- Use `:owner/:repo` as a placeholder - `gh` will automatically use the current repository
- Use `--jq` flag for JSON output filtering (requires `jq` to be installed)
- Use `--input -` with heredoc syntax for complex JSON payloads
- Always verify changes with `gh api` GET requests before making PATCH/PUT requests

#### Security Notes

- `gh` uses your GitHub authentication token
- Ensure you have appropriate repository permissions (admin for branch protection)
- Review changes carefully before applying them
- Consider testing on a non-production branch first

### Enforcement Summary

| Rule                           | Local Hook    | CI/CD  | GitHub Protection |
| ------------------------------ | ------------- | ------ | ----------------- |
| Commit message format          | ✅ commit-msg | ✅ Yes | ⚠️ Optional       |
| Code quality                   | ✅ pre-commit | ✅ Yes | ✅ Yes            |
| Branch naming                  | ✅ pre-push   | ❌ No  | ⚠️ Optional       |
| Direct commits to main/develop | ✅ pre-push   | ❌ No  | ✅ Yes            |
| PR requirements                | ❌ No         | ✅ Yes | ✅ Yes            |
| Required reviews               | ❌ No         | ❌ No  | ✅ Yes            |

**Note**: Hooks can be bypassed with `--no-verify`, but this should only be used in emergencies. GitHub protection rules cannot be bypassed (except by repository admins).

## Best Practices

### General

1. **Keep Branches Clean**:
   - One feature per branch
   - Regular commits
   - Meaningful commit messages

2. **Stay Updated**:
   - Regularly pull from target branch
   - Resolve conflicts early
   - Keep PRs up to date

3. **Test Before PR**:
   - Run tests locally
   - Check linting
   - Verify build

4. **Communicate**:
   - Use PR comments for discussion
   - Update issues with progress
   - Ask questions early

### Security

1. **Never Commit Secrets**:
   - Use environment variables
   - Check `.gitignore`
   - Rotate exposed secrets immediately

2. **Review Security Changes**:
   - Require 2 approvals
   - Security expert review
   - Document security implications

3. **Dependency Updates**:
   - Review changelogs
   - Test thoroughly
   - Monitor for vulnerabilities

## Troubleshooting

### Common Issues

1. **Merge Conflicts**:

   ```bash
   git checkout develop
   git pull origin develop
   git checkout feature/your-branch
   git rebase develop
   # Resolve conflicts
   git push --force-with-lease
   ```

2. **Failed CI Checks**:
   - Run checks locally
   - Fix issues
   - Push fixes

3. **PR Not Merging**:
   - Check approval status
   - Verify CI checks pass
   - Ensure branch is up to date

## References

- [Conventional Commits](https://www.conventionalcommits.org/)
- [Semantic Versioning](https://semver.org/)
- [Keep a Changelog](https://keepachangelog.com/)
- [Git Flow](https://nvie.com/posts/a-successful-git-branching-model/)
