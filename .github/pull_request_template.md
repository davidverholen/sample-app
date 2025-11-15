## Description

<!-- Provide a clear and concise description of what this PR does -->

## Type of Change

<!-- Mark the relevant option with an 'x' -->

- [ ] 🎉 Feature (non-breaking change which adds functionality)
- [ ] 🐛 Bug fix (non-breaking change which fixes an issue)
- [ ] 💥 Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] 📚 Documentation update
- [ ] 🎨 Style/formatting changes (no code changes)
- [ ] ♻️ Code refactoring (no functional changes)
- [ ] ⚡ Performance improvement
- [ ] ✅ Test addition or update
- [ ] 🔧 Build/config changes
- [ ] 🔒 Security fix

## Related Issue

<!-- Link to the related issue -->

Closes #<!-- issue number -->

## Changes Made

<!-- Describe the changes in detail -->

## Testing

<!-- Describe how you tested your changes -->

- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] E2E tests added/updated
- [ ] Manual testing performed
- [ ] All existing tests pass

### Test Coverage

<!-- If applicable, mention test coverage -->

## Screenshots

<!-- If UI changes, add screenshots here -->

## Checklist

<!-- Mark completed items with an 'x' -->

### Code Quality

- [ ] Code follows project style guidelines
- [ ] **Self-review completed** (MANDATORY for solo developers - see Self-Review Checklist below)
- [ ] Code is commented, particularly in hard-to-understand areas
- [ ] No console.log or debug code
- [ ] No commented-out code
- [ ] No TODO comments without issue references

### Self-Review Checklist (Solo Developers)

**⚠️ MANDATORY**: Complete this checklist before merging:

- [ ] **Code Review**: Reviewed all changed files line-by-line
- [ ] **Functionality**: Verified the code works as intended
- [ ] **Testing**: All tests pass and coverage meets threshold (80%+)
- [ ] **Code Quality**: No linting errors, proper formatting, TypeScript strict mode
- [ ] **Documentation**: Updated README/CHANGELOG/docs if needed
- [ ] **Security**: No secrets committed, input validation implemented
- [ ] **Performance**: No obvious performance issues
- [ ] **Accessibility**: UI changes are accessible (WCAG 2.1 AA)
- [ ] **Error Handling**: Error cases are handled appropriately
- [ ] **Edge Cases**: Edge cases are considered and tested
- [ ] **CI Checks**: All CI/CD checks pass
- [ ] **Git Standards**: Commit messages and branch name follow conventions
- [ ] **Wait Time**: Waited at least 1 hour after creating PR (fresh eyes)

### Documentation

- [ ] Documentation updated (README, API docs, etc.)
- [ ] CHANGELOG.md updated (for user-facing changes)
- [ ] Code comments added for complex logic
- [ ] JSDoc added for public APIs

### Git

- [ ] Commit messages follow [Conventional Commits](https://www.conventionalcommits.org/) specification
- [ ] Branch name follows convention (`feature/123-description`, `bugfix/123-description`, etc.)
- [ ] Branch is up to date with target branch
- [ ] No merge conflicts

### Pre-submission Checks

- [ ] `npm run lint` passes
- [ ] `npm run type-check` passes
- [ ] `npm test` passes
- [ ] `npm run build` succeeds
- [ ] `npm run test:coverage` shows adequate coverage (80%+)

### Security

- [ ] No secrets or sensitive data committed
- [ ] Input validation implemented
- [ ] Security best practices followed
- [ ] Dependencies reviewed for vulnerabilities

### Performance

- [ ] Performance impact considered
- [ ] No unnecessary re-renders
- [ ] Database queries optimized
- [ ] Bundle size impact considered

## Additional Notes

<!-- Any additional information, context, or notes for reviewers -->

## Reviewers

<!-- Tag relevant reviewers -->

@<!-- reviewer username -->

## Deployment Notes

<!-- If applicable, describe any special deployment considerations -->
