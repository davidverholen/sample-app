# Review Pull Request

Review the current pull request focusing on your domain expertise and **POST THE REVIEW TO GITHUB**. Each agent should check aspects relevant to their specialization and submit their review as a GitHub PR review.

## CRITICAL: Post Review to GitHub

**MANDATORY**: All reviews MUST be posted to GitHub as PR reviews, not just local analysis. Use GitHub CLI (`gh`) to submit your review.

## General Review Process

1. **Get PR Information**:

   ```bash
   # Get current branch and PR number
   gh pr view --json number,title,body,headRefName,baseRefName

   # Get PR number for review commands
   PR_NUMBER=$(gh pr view --json number --jq '.number')
   ```

2. **View PR Changes**:

   ```bash
   # View all changed files
   gh pr diff

   # View specific file changes
   gh pr diff --name-only

   # View changed files with stats
   gh pr view --json files --jq '.files[] | "\(.path) (\(.additions)+ \(.deletions)-)"'
   ```

3. **Check CI/CD Status**:

   ```bash
   # View workflow runs for this PR
   gh pr checks

   # View detailed check status
   gh pr view --json statusCheckRollup --jq '.statusCheckRollup[] | "\(.name): \(.status) - \(.conclusion)"'
   ```

## Agent-Specific Review Focus

### DevOps & Infrastructure Expert

**Focus Areas:**

- ✅ Workflow changes (`.github/workflows/*.yml`)
- ✅ CI/CD configuration
- ✅ Deployment configurations (`vercel.json`, `Dockerfile`, etc.)
- ✅ Environment variable management
- ✅ Infrastructure as code changes
- ✅ Review apps configuration
- ✅ Database migration scripts
- ✅ Build and deployment scripts

**Checklist:**

- [ ] Workflow files follow best practices
- [ ] No hardcoded secrets or credentials
- [ ] Environment variables properly configured
- [ ] Deployment configurations are correct
- [ ] Timeouts and resource limits are appropriate
- [ ] Error handling in scripts is robust
- [ ] No fallback chains (fail fast principle)

### Backend/API Expert

**Focus Areas:**

- ✅ API routes (`app/api/**`)
- ✅ Server Actions (`app/actions/**`, `app/**/actions.ts`)
- ✅ Middleware (`middleware.ts`)
- ✅ Business logic implementation
- ✅ Request/response handling
- ✅ Error handling and validation
- ✅ Rate limiting and security

**Checklist:**

- [ ] Input validation with Zod schemas
- [ ] Proper error handling (no generic catch-all)
- [ ] Appropriate HTTP status codes
- [ ] Server Actions use `'use server'` directive
- [ ] No sensitive data exposed in responses
- [ ] Proper authentication/authorization checks
- [ ] Rate limiting implemented where needed
- [ ] Fail fast with clear error messages

### Next.js Frontend Expert

**Focus Areas:**

- ✅ React components (`components/**`, `app/**/page.tsx`)
- ✅ Server Components vs Client Components
- ✅ Data fetching patterns
- ✅ Form handling and validation
- ✅ State management
- ✅ Routing and navigation

**Checklist:**

- [ ] Server Components used by default
- [ ] `'use client'` only when necessary
- [ ] Proper data fetching patterns
- [ ] Forms use Server Actions
- [ ] Proper error boundaries
- [ ] Loading states implemented
- [ ] TypeScript types are correct
- [ ] No `any` types without justification

### Database & Schema Expert

**Focus Areas:**

- ✅ Prisma schema changes (`prisma/schema.prisma`)
- ✅ Migration files (`prisma/migrations/**`)
- ✅ Database queries and operations
- ✅ Data relationships and constraints
- ✅ Indexing strategies

**Checklist:**

- [ ] Schema changes follow naming conventions
- [ ] Migrations are properly structured
- [ ] Foreign keys have proper `onDelete` behavior
- [ ] Indexes added for frequently queried fields
- [ ] No N+1 query problems
- [ ] Queries use `select` to limit fields
- [ ] Proper use of transactions where needed
- [ ] Data validation at database level

### Security Expert

**Focus Areas:**

- ✅ Authentication implementation
- ✅ Authorization and access control
- ✅ Input validation and sanitization
- ✅ Security headers
- ✅ Environment variable usage
- ✅ API security
- ✅ Data protection

**Checklist:**

- [ ] No secrets or credentials in code
- [ ] Input validation on all user inputs
- [ ] Proper authentication checks
- [ ] Authorization rules enforced
- [ ] CSRF protection implemented
- [ ] XSS prevention measures
- [ ] Security headers configured
- [ ] Rate limiting on public endpoints
- [ ] Sensitive data properly encrypted/hashed

### Testing & QA Expert

**Focus Areas:**

- ✅ Test files (`__tests__/**`, `**/*.test.ts`, `**/*.spec.ts`)
- ✅ Test coverage
- ✅ E2E tests (`e2e/**`)
- ✅ Test quality and completeness
- ✅ Mocking strategies

**Checklist:**

- [ ] New features have corresponding tests
- [ ] Test coverage meets 80% threshold
- [ ] Tests cover edge cases and error scenarios
- [ ] E2E tests for critical user flows
- [ ] Tests are meaningful (not just happy paths)
- [ ] Mocks are properly implemented
- [ ] Test names are descriptive
- [ ] No skipped or pending tests without justification

### Performance Optimization Expert

**Focus Areas:**

- ✅ Bundle size changes
- ✅ Image optimization
- ✅ Code splitting
- ✅ Caching strategies
- ✅ Core Web Vitals impact
- ✅ Database query performance

**Checklist:**

- [ ] No unnecessary large dependencies added
- [ ] Images use Next.js Image component
- [ ] Code splitting implemented where appropriate
- [ ] Caching strategies are appropriate
- [ ] No performance regressions
- [ ] Database queries are optimized
- [ ] Bundle size impact is reasonable

### UI/UX Design System Expert

**Focus Areas:**

- ✅ Component design and consistency
- ✅ Accessibility (WCAG 2.1 AA)
- ✅ Responsive design
- ✅ Design system compliance
- ✅ User experience

**Checklist:**

- [ ] Components follow design system patterns
- [ ] Proper semantic HTML elements
- [ ] Keyboard navigation works
- [ ] Screen reader support (ARIA labels)
- [ ] Color contrast meets WCAG standards
- [ ] Responsive design tested
- [ ] Loading and error states are user-friendly
- [ ] Form validation messages are clear

### Technical Lead / Engineering Manager

**Focus Areas:**

- ✅ Overall code quality
- ✅ Architecture alignment
- ✅ Code review standards
- ✅ Technical debt
- ✅ Cross-cutting concerns

**Checklist:**

- [ ] Code follows project conventions
- [ ] Architecture decisions are sound
- [ ] No obvious technical debt introduced
- [ ] Code is maintainable and readable
- [ ] Documentation is adequate
- [ ] All expert reviews are addressed
- [ ] PR description is complete
- [ ] Related issues are linked

### Solution Architecture Expert

**Focus Areas:**

- ✅ System architecture alignment
- ✅ Integration points
- ✅ Scalability considerations
- ✅ Technology choices
- ✅ System design patterns

**Checklist:**

- [ ] Changes align with system architecture
- [ ] Integration points are properly designed
- [ ] Scalability is considered
- [ ] Technology choices are appropriate
- [ ] No architectural violations
- [ ] Error handling is consistent
- [ ] Monitoring and observability considered

### Requirements Engineering Expert

**Focus Areas:**

- ✅ Requirements alignment
- ✅ User story completeness
- ✅ Acceptance criteria met
- ✅ Feature completeness

**Checklist:**

- [ ] Changes meet stated requirements
- [ ] User stories are complete
- [ ] Acceptance criteria are met
- [ ] Edge cases are handled
- [ ] Documentation reflects requirements

### Git Workflow Enforcement

**Focus Areas:**

- ✅ Commit message format
- ✅ Branch naming
- ✅ PR title format
- ✅ PR description completeness

**Checklist:**

- [ ] Commit messages follow Conventional Commits
- [ ] Branch name follows convention
- [ ] PR title follows format: `<type>(<scope>): <subject>`
- [ ] PR description is complete
- [ ] All commits are related to the PR
- [ ] No merge commits in feature branches

## Review Output Format & GitHub Submission

After reviewing, you MUST post your review to GitHub using one of these methods:

### Option 1: Submit PR Review (Recommended)

Post a formal PR review with approval, request changes, or comment:

```bash
# Get PR number
PR_NUMBER=$(gh pr view --json number --jq '.number')

# Format your review body
REVIEW_BODY="## Review Summary

**Reviewer**: [Your Agent Name]

### Strengths
- [List what was done well]

### Issues Found

**Critical:**
- [Critical issues]

**High:**
- [High priority issues]

**Medium:**
- [Medium priority issues]

**Low:**
- [Low priority issues / suggestions]

### Suggestions
- [Recommendations for improvement]

### Checklist Status
[Mark relevant checklist items from your domain]"

# Submit review - APPROVE (if no blocking issues)
gh pr review $PR_NUMBER --approve --body "$REVIEW_BODY"

# Submit review - REQUEST CHANGES (if blocking issues found)
gh pr review $PR_NUMBER --request-changes --body "$REVIEW_BODY"

# Submit review - COMMENT (if review without approval/request)
gh pr review $PR_NUMBER --comment --body "$REVIEW_BODY"
```

### Option 2: Add Line-Specific Comments

For detailed code-level feedback, add comments on specific lines. Note: GitHub CLI doesn't directly support line-specific comments via `gh pr comment`. Use the PR review API or add comments as part of a review:

```bash
# Get PR number
PR_NUMBER=$(gh pr view --json number --jq '.number')

# View the diff to identify line numbers
gh pr diff $PR_NUMBER

# Add a general comment referencing specific lines
gh pr comment $PR_NUMBER --body "Comment on line 42 in path/to/file.ts:

Your detailed feedback here with code reference."
```

**Alternative**: Use GitHub's web interface for line-specific comments, or use the GitHub API directly for more precise control.

### Option 3: Add General PR Comment

For general feedback or questions:

```bash
# Get PR number
PR_NUMBER=$(gh pr view --json number --jq '.number')

# Add general comment
gh pr comment $PR_NUMBER --body "## [Agent Name] Review

[Your review content here]"
```

## Review Commands Reference

```bash
# View PR details
gh pr view

# View PR diff
gh pr diff

# View PR files with change stats
gh pr view --json files --jq '.files[] | "\(.path) (\(.additions)+ \(.deletions)-)"'

# View CI/CD status
gh pr checks

# View existing reviews
gh pr view --json reviews --jq '.reviews[] | "\(.author.login): \(.state) - \(.body)"'

# Submit PR review (REQUIRED)
gh pr review <PR_NUMBER> --approve --body "Review content"
gh pr review <PR_NUMBER> --request-changes --body "Review content"
gh pr review <PR_NUMBER> --comment --body "Review content"

# Add PR comment
gh pr comment <PR_NUMBER> --body "Comment text"

# View PR timeline (comments, reviews, events)
gh pr view --json comments,reviews,timelineItems
```

## GitHub Documentation References

### Official GitHub Documentation

- **[About Pull Request Reviews](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/reviewing-changes-in-pull-requests/about-pull-request-reviews)**: Overview of PR review process
- **[Reviewing Proposed Changes](https://docs.github.com/articles/reviewing-proposed-changes-in-a-pull-request)**: How to review PRs on GitHub
- **[Approving a Pull Request](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/reviewing-changes-in-pull-requests/approving-a-pull-request-with-required-reviews)**: Approving PRs with required reviews
- **[Commenting on a Pull Request](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/reviewing-changes-in-pull-requests/commenting-on-a-pull-request)**: Adding comments to PRs

### GitHub CLI Documentation

- **[GitHub CLI: `gh pr review`](https://cli.github.com/manual/gh_pr_review)**: Official documentation for `gh pr review` command
- **[GitHub CLI: `gh pr comment`](https://cli.github.com/manual/gh_pr_comment)**: Official documentation for `gh pr comment` command
- **[GitHub CLI: `gh pr view`](https://cli.github.com/manual/gh_pr_view)**: Official documentation for `gh pr view` command
- **[GitHub CLI: `gh pr diff`](https://cli.github.com/manual/gh_pr_diff)**: Official documentation for `gh pr diff` command
- **[GitHub CLI Manual](https://cli.github.com/manual/)**: Complete GitHub CLI reference

### Review Best Practices

- **[Best Practices for Code Review](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/reviewing-changes-in-pull-requests/about-pull-request-reviews#best-practices-for-pull-request-reviews)**: GitHub's recommended review practices
- **[Required Reviews](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches#require-pull-request-reviews-before-merging)**: Setting up required reviews

## Review Decision Guidelines

**Approve** (`--approve`):

- No blocking issues found
- Code meets quality standards
- Tests are adequate
- Documentation is complete
- All domain-specific checks pass

**Request Changes** (`--request-changes`):

- Critical or high-priority issues found
- Security vulnerabilities
- Test coverage below threshold
- Breaking changes without migration
- Architecture violations

**Comment** (`--comment`):

- Minor suggestions or questions
- Non-blocking improvements
- Clarifications needed
- General feedback

## Best Practices

- **Post to GitHub**: Always submit your review to GitHub, never just provide local feedback
- **Be constructive**: Provide actionable feedback with specific file/line references
- **Focus on your domain**: Don't review outside your expertise unless critical
- **Check for patterns**: Look for consistency with existing codebase
- **Verify tests**: Ensure adequate test coverage
- **Check documentation**: Verify docs are updated if needed
- **Security first**: Always check for security implications
- **Performance matters**: Consider performance impact
- **Accessibility**: Ensure UI changes are accessible
- **Use proper review type**: Choose approve/request-changes/comment appropriately
- **Reference specific code**: Use file paths and line numbers in comments
- **Be timely**: Complete reviews within 24 hours when possible
- **Follow GitHub guidelines**: See [GitHub's review best practices](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/reviewing-changes-in-pull-requests/about-pull-request-reviews#best-practices-for-pull-request-reviews)

## Additional Resources

- **[GitHub Pull Request Reviews Guide](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/reviewing-changes-in-pull-requests)**: Complete guide to PR reviews
- **[GitHub CLI Manual](https://cli.github.com/manual/)**: Full GitHub CLI command reference
- **[Project Git Workflow](./docs/GIT_WORKFLOW.md)**: Project-specific Git workflow documentation
