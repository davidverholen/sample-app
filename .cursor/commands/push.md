# Push to GitHub Pull Request

Push changes to GitHub following the Git workflow. Strictly follow all workflow rules and conventions.

## Pre-Push Checklist

### 1. Check for Uncommitted Changes

**CRITICAL**: Always check for and commit uncommitted changes before pushing, especially changes made during corrections (e.g., Prettier formatting, lint fixes).

```bash
git status
```

### 2. Commit Any Corrections

If pre-commit hooks made corrections (formatting, lint fixes, etc.), you MUST commit these changes before pushing:

```bash
# Review what changed
git diff

# Stage the correction changes
git add <files>

# Commit with proper message
git commit -m "style: apply formatting corrections from pre-commit hooks"
```

**Common correction scenarios:**

- Prettier auto-formatting files
- ESLint auto-fixes
- TypeScript fixes
- Any other automated corrections

### 3. Verify Working Tree is Clean

```bash
git status
# Should show: "nothing to commit, working tree clean"
```

### 4. Follow Commit Message Convention

All commits MUST follow [Conventional Commits](https://www.conventionalcommits.org/) format:

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Valid types**: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`

**Examples:**

- `fix(api): resolve user validation error`
- `feat(auth): add password reset functionality`
- `style: apply Prettier formatting corrections`

### 5. Pre-Push Hook Checks

The pre-push hook will automatically run and check:

- ✅ Branch naming convention (feature/bugfix/hotfix/release)
- ✅ Protected branch check (blocks direct pushes to main/develop)
- ✅ Build verification
- ✅ Full test suite with coverage (80% minimum)

### 6. Push to Remote

```bash
git push origin <branch-name>
```

## Branch Naming

- `feature/123-short-description` - New features
- `bugfix/456-short-description` - Bug fixes
- `hotfix/789-short-description` - Critical production fixes
- `release/v1.2.3` - Release branches

## Important Notes

- **Never push directly to `main` or `develop`** - Use Pull Requests
- **Always commit corrections** - Don't skip committing auto-fixes
- **Follow commit message format** - Pre-commit hook validates this
- **Ensure tests pass** - Pre-push hook runs full test suite
- **Maintain 80%+ test coverage** - Pre-push hook enforces this

## Workflow Summary

1. Make your changes
2. Run `git status` to check for uncommitted changes
3. If pre-commit hooks made corrections, commit them first
4. Commit your main changes with proper message format
5. Verify working tree is clean: `git status`
6. Push to remote: `git push origin <branch-name>`
7. Pre-push hooks will run automatically (build, tests, coverage)
