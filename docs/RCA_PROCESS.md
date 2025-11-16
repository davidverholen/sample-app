# Root Cause Analysis (RCA) Process

This document describes the process for performing root cause analysis (RCA) for failing GitHub Pull Requests and system issues.

## Overview

When a PR fails or a system issue occurs, we use a two-step process:

1. **`rca-pr`** - Perform root cause analysis and document findings
2. **`debug-pr`** - Implement fixes based on the RCA findings

## When to Use PR Comments vs GitHub Issues

### Use PR Comments (Default)

**Use PR comments when:**

- ✅ The issue is specific to a single PR
- ✅ The issue will be resolved by fixing the PR
- ✅ The issue is not likely to affect other PRs
- ✅ The investigation is straightforward and quick
- ✅ The fix is clear and can be implemented immediately

**Example**: A PR has a syntax error in a workflow file that causes CI to fail. This is PR-specific and will be fixed in that PR.

### Use GitHub Issues

**Use GitHub issues when:**

- ✅ The issue affects multiple PRs or the entire system
- ✅ The root cause is complex and requires ongoing investigation
- ✅ The fix requires architectural changes or significant refactoring
- ✅ The issue needs to be tracked separately from the PR
- ✅ The investigation reveals a broader problem beyond the PR
- ✅ The fix cannot be completed in the current PR
- ✅ The issue needs to be prioritized and scheduled

**Example**: Investigation reveals that all PRs fail because Supabase connection pooling is not configured. This affects the entire system and needs a separate issue to track the fix.

## Decision Flow

```
Is the issue PR-specific?
├─ Yes → Will it be fixed in this PR?
│   ├─ Yes → Use PR Comment
│   └─ No → Use GitHub Issue
└─ No → Use GitHub Issue
```

## RCA Process

### Step 1: Run `rca-pr` Command

```bash
# In Cursor, use:
/rca-pr
```

This command will:

1. Investigate the failing PR
2. Perform systematic root cause analysis
3. Determine whether to use PR comment or GitHub issue
4. Post findings to the appropriate location

### Step 2: Review RCA Findings

**If posted as PR comment:**

- Review the comment on the PR
- The comment contains all investigation findings
- Use the comment to guide fixes

**If posted as GitHub issue:**

- Review the issue created
- The issue contains comprehensive RCA documentation
- Link the issue to the PR
- Use the issue to track the fix

### Step 3: Run `debug-pr` Command

```bash
# In Cursor, use:
/debug-pr
```

This command will:

1. Load RCA findings from PR comment or GitHub issue
2. Implement fixes based on RCA recommendations
3. Test and verify fixes
4. Update the PR or issue with fix status

## PR Comment Format

When RCA is posted as a PR comment, it follows this structure:

```markdown
## 🔍 Root Cause Analysis

### Problem Summary

[Brief description]

### Root Cause

[Clear statement of root cause]

### Recommended Solution

[Solution description]

### Files Requiring Changes

- `path/to/file1` - [reason]
- `path/to/file2` - [reason]

### Next Steps

1. [Action item 1]
2. [Action item 2]

---

_Full investigation details available in [GitHub Issue #X](#) if needed_
```

## GitHub Issue Format

When RCA is posted as a GitHub issue, it uses the RCA issue template (`.github/ISSUE_TEMPLATE/rca-root-cause-analysis.md`) which includes:

- Problem Summary
- Investigation Results (6 sections)
- Root Cause Conclusion
- Recommended Solutions
- Next Steps
- Related PRs/Issues

## Issue Labels

RCA issues should be labeled with:

- `rca` - Root cause analysis
- `investigation` - Under investigation
- Domain-specific labels (e.g., `devops`, `database`, `security`)
- Priority labels if applicable

## Linking PRs and Issues

**When creating an issue from a PR:**

- Link the PR in the issue: `Related PR: #123`
- Add a comment to the PR: `RCA documented in #456`

**When referencing an issue in a PR:**

- Link the issue in PR description or comments
- Reference the issue number in commit messages if applicable

## Best Practices

1. **Always run `rca-pr` first** - Don't skip investigation
2. **Choose the right format** - PR comment for simple issues, GitHub issue for complex ones
3. **Be thorough** - Document all findings, even if they seem unrelated
4. **Link related items** - Connect PRs, issues, and documentation
5. **Update status** - Keep PR comments and issues updated as investigation progresses
6. **Close when resolved** - Close issues when the root cause is fixed
7. **Reference in fixes** - Reference RCA in commit messages and PR descriptions

## Examples

### Example 1: PR Comment (Simple Issue)

**Scenario**: PR fails because of a typo in a workflow file.

**Action**: `rca-pr` posts a comment on the PR:

- Problem: Typo in workflow file
- Root Cause: Missing closing bracket
- Solution: Fix the typo
- Files: `.github/workflows/ci.yml`

**Result**: Quick fix, resolved in the same PR.

### Example 2: GitHub Issue (Complex Issue)

**Scenario**: PR fails because Supabase connection pooling is not configured, affecting all PRs.

**Action**: `rca-pr` creates a GitHub issue:

- Problem: All PRs fail with database connection errors
- Root Cause: Supabase blocks direct connections from external IPs
- Solution: Configure connection pooling for all environments
- Files: Multiple files across the codebase
- Impact: Affects entire system

**Result**: Separate issue to track the fix, PR can be merged after workaround, full fix tracked in issue.

## Command Reference

### `/rca-pr`

Performs root cause analysis and posts findings to:

- PR comment (default for PR-specific issues)
- GitHub issue (for system-wide or complex issues)

**Outputs**:

- PR comment with RCA summary, OR
- GitHub issue with full RCA documentation

### `/debug-pr`

Implements fixes based on RCA findings from:

- PR comment (reads latest RCA comment)
- GitHub issue (reads issue by number or linked issue)

**Process**:

1. Loads RCA findings
2. Implements recommended solution
3. Tests fixes
4. Updates PR/issue with status

## Issue Template

RCA issues use the template at `.github/ISSUE_TEMPLATE/rca-root-cause-analysis.md` which provides a structured format for documenting:

- Problem summary
- Investigation results (6 sections)
- Root cause conclusion
- Recommended solutions
- Next steps
- Files requiring changes

The template is automatically available when creating a new issue in GitHub.

## Related Documentation

- [Git Workflow](./GIT_WORKFLOW.md) - Git and PR workflow
- [Review Apps](./REVIEW_APPS.md) - Review apps setup and troubleshooting
- [Supabase Setup](./SUPABASE_SETUP.md) - Supabase configuration
