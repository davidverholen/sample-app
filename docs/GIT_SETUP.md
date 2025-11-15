# Git Workflow Setup Guide

This guide will help you set up the Git workflow for this project.

## Prerequisites

- Node.js 20.x or higher
- Git 2.30.0 or higher
- npm or yarn

## Initial Setup

### 1. Install Dependencies

```bash
npm install
```

This will automatically install Husky and set up git hooks via the `prepare` script.

### 2. Configure Git Commit Template

Set up the commit message template:

```bash
git config commit.template .gitmessage
```

Or set it globally:

```bash
git config --global commit.template .gitmessage
```

### 3. Verify Husky Installation

After running `npm install`, Husky should be set up automatically. Verify by checking:

```bash
ls -la .husky/
```

You should see:
- `pre-commit`
- `commit-msg`
- `pre-push`

### 4. Make Husky Hooks Executable

If hooks are not executable, run:

```bash
chmod +x .husky/pre-commit
chmod +x .husky/commit-msg
chmod +x .husky/pre-push
```

## Branch Setup

### Create Develop Branch

If you don't have a `develop` branch yet:

```bash
git checkout -b develop
git push -u origin develop
```

### Set Up Branch Protection

In GitHub:
1. Go to Settings → Branches
2. Add branch protection rule for `main`:
   - Require pull request reviews (1 reviewer minimum)
   - Require status checks to pass
   - Require branches to be up to date
   - Do not allow force pushes
   - Do not allow deletions

3. Add branch protection rule for `develop`:
   - Require pull request reviews (for non-team members)
   - Require status checks to pass

## GitHub Integration

### 1. Set Up GitHub Secrets

For CI/CD workflows, add these secrets in GitHub Settings → Secrets and variables → Actions:

- `DATABASE_URL`: Database connection string
- `NEXTAUTH_SECRET`: NextAuth secret
- `NEXTAUTH_URL`: Application URL
- `STAGING_DATABASE_URL`: Staging database URL
- `STAGING_NEXTAUTH_SECRET`: Staging NextAuth secret
- `STAGING_NEXTAUTH_URL`: Staging URL

### 2. Enable GitHub Actions

GitHub Actions are automatically enabled when you push the `.github/workflows/` directory.

### 3. Configure Codecov (Optional)

1. Sign up at [codecov.io](https://codecov.io)
2. Add your repository
3. Get your upload token
4. Add it as a GitHub secret: `CODECOV_TOKEN`

## Workflow Usage

### Creating a Feature Branch

```bash
# Ensure you're on develop
git checkout develop
git pull origin develop

# Create feature branch (include issue number)
git checkout -b feature/123-user-authentication

# Make changes and commit
git add .
git commit -m "feat(auth): add user authentication

Implement email/password authentication with NextAuth.js.
Includes login, registration, and session management.

Closes #123"

# Push branch
git push -u origin feature/123-user-authentication
```

### Creating a Pull Request

1. Push your branch to GitHub
2. Go to GitHub and create a Pull Request
3. Fill out the PR template
4. Request reviews from team members
5. Wait for CI checks to pass
6. Address review comments
7. Merge when approved

### Creating a Release

```bash
# From develop branch
git checkout develop
git pull origin develop

# Create release branch
git checkout -b release/v1.2.3

# Update version in package.json
npm version 1.2.3 --no-git-tag

# Update CHANGELOG.md
# Add release notes

# Commit changes
git add .
git commit -m "chore(release): prepare v1.2.3"

# Push release branch
git push -u origin release/v1.2.3

# Create PR to main
# After merge, tag release
git checkout main
git pull origin main
git tag -a v1.2.3 -m "Release v1.2.3"
git push origin v1.2.3
```

## Testing the Setup

### Test Pre-commit Hook

```bash
# Make a small change
echo "// test" >> app/page.tsx

# Try to commit with invalid message
git add app/page.tsx
git commit -m "test commit"
# Should fail with commit message validation error

# Commit with valid message
git commit -m "test: verify pre-commit hook"
# Should run linting, type-check, and tests
```

### Test Commit Message Validation

```bash
# Try invalid commit message
git commit -m "invalid commit"
# Should fail

# Try valid commit message
git commit -m "test: verify commit message validation"
# Should pass
```

### Test Pre-push Hook

```bash
# Make changes that break build
# Try to push
git push
# Should fail if build or tests fail
```

## Troubleshooting

### Husky Hooks Not Running

1. Check if Husky is installed:
   ```bash
   npm list husky
   ```

2. Reinstall Husky:
   ```bash
   npm run prepare
   ```

3. Check Git hooks path:
   ```bash
   git config core.hooksPath
   ```
   Should be `.husky`

4. Set hooks path manually:
   ```bash
   git config core.hooksPath .husky
   ```

### Commit Message Validation Failing

- Ensure commit message follows format: `<type>(<scope>): <subject>`
- Check subject line is max 72 characters
- Use valid type (feat, fix, docs, etc.)

### Pre-commit Checks Failing

- Fix linting errors: `npm run lint`
- Fix formatting: `npm run format`
- Fix type errors: `npm run type-check`
- Fix test failures: `npm test`

### CI/CD Workflows Not Running

- Check GitHub Actions is enabled
- Verify workflow files are in `.github/workflows/`
- Check workflow syntax
- Ensure secrets are configured

## Best Practices

1. **Always Pull Before Creating Branch**:
   ```bash
   git checkout develop
   git pull origin develop
   ```

2. **Keep Branches Up to Date**:
   ```bash
   git fetch origin
   git rebase origin/develop
   ```

3. **Write Meaningful Commits**:
   - One logical change per commit
   - Clear commit messages
   - Reference issues

4. **Test Before Pushing**:
   - Run tests locally
   - Check linting
   - Verify build

5. **Keep PRs Small**:
   - Focused on single feature/fix
   - Easier to review
   - Faster to merge

## Additional Resources

- [Git Workflow Documentation](./GIT_WORKFLOW.md)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [Semantic Versioning](https://semver.org/)
- [Husky Documentation](https://typicode.github.io/husky/)

