# Root Cause Analysis for GitHub Pull Request

Perform a comprehensive root cause analysis (RCA) of failures in the current open GitHub pull request. This command focuses on investigation and documentation only - it does NOT implement fixes.

## CRITICAL: RCA Process

**MANDATORY**: Follow a systematic investigation approach. Document all findings and post them to GitHub (PR comment or issue). Do NOT implement fixes - only investigate and document.

## Output Location

RCA findings are posted to:

- **PR Comment** (default) - For PR-specific issues that will be fixed in the PR
- **GitHub Issue** - For system-wide issues or complex problems requiring separate tracking

See `docs/RCA_PROCESS.md` for guidance on when to use PR comments vs issues.

## Initial Setup

### 1. Get PR Information

```bash
# Get current branch and PR number
gh pr view --json number,title,body,headRefName,baseRefName,state,isDraft

# Get PR number for commands
PR_NUMBER=$(gh pr view --json number --jq '.number')
BRANCH_NAME=$(gh pr view --json headRefName --jq '.headRefName')

# Get repository owner and name
REPO_OWNER=$(gh repo view --json owner --jq '.owner.login')
REPO_NAME=$(gh repo view --json name --jq '.name')
```

### 2. Check CI/CD Status

```bash
# View all checks for the PR
gh pr checks

# View detailed check status with conclusions
gh pr view --json statusCheckRollup --jq '.statusCheckRollup[] | "\(.name): \(.status) - \(.conclusion // "pending")"'

# List all workflow runs for this PR
gh run list --branch "$BRANCH_NAME" --limit 10

# Get the latest failed run
FAILED_RUN=$(gh run list --branch "$BRANCH_NAME" --json databaseId,conclusion,status --jq '.[] | select(.conclusion == "failure" or .status == "in_progress") | .databaseId' | head -1)
```

## Investigation Steps

### Step 1: Extract Error Details

**Goal**: Understand the exact error, when it occurs, and what it means.

```bash
# View failed run logs
gh run view $FAILED_RUN --log-failed

# Get detailed error information
gh run view $FAILED_RUN --json jobs --jq '.jobs[] | select(.conclusion == "failure") | {
  name: .name,
  conclusion: .conclusion,
  startedAt: .startedAt,
  completedAt: .completedAt,
  steps: [.steps[] | select(.conclusion == "failure") | {
    name: .name,
    conclusion: .conclusion,
    number: .number
  }]
}'
```

**Document**:

- Exact error message
- Error location (file, line, function)
- Error type (network, authentication, validation, etc.)
- When error occurs (initialization, connection, query execution, etc.)

### Step 2: Research Connection/Format Requirements

**Goal**: Verify if the connection string format, API usage, or configuration matches requirements.

**For Database Issues**:

- Research correct connection string format
- Check if direct connection vs connection pooling is required
- Verify port numbers and SSL requirements
- Check IP allowlisting requirements

**For API Issues**:

- Verify API endpoint format
- Check authentication requirements
- Verify request/response formats
- Check rate limiting or quota issues

**For Configuration Issues**:

- Verify environment variable formats
- Check secret requirements
- Verify configuration file syntax

**Document**:

- Expected format/requirements
- Actual format being used
- Differences identified
- Official documentation references

### Step 3: Analyze Connection/Configuration Construction

**Goal**: Understand how the connection string or configuration is built.

```bash
# View relevant script files
gh pr diff --name-only | grep -E "scripts/|\.config\.|\.env"

# Check how connection strings are constructed
grep -r "DATABASE_URL\|connection.*string" scripts/ --include="*.sh" --include="*.js"
```

**Document**:

- How the connection string/config is constructed
- Source of each component (env vars, API responses, etc.)
- Any transformations applied
- Potential issues in construction logic

### Step 4: Check Network Access and Permissions

**Goal**: Determine if network access, firewall rules, or permissions are blocking the operation.

**For Network Issues**:

- Check if external IPs are blocked
- Verify if connection pooling is required vs direct connection
- Check if IP allowlisting is needed
- Verify firewall rules

**For Permission Issues**:

- Check API token permissions
- Verify database user permissions
- Check file system permissions
- Verify GitHub secrets are set correctly

**Document**:

- Network access requirements
- Permission requirements
- Current configuration
- Blocking factors identified

### Step 5: Review Script Execution Flow

**Goal**: Understand the complete execution flow and identify where failures occur.

```bash
# View workflow file
gh pr diff .github/workflows/

# Check script dependencies
grep -r "export\|require\|import" scripts/ --include="*.sh" --include="*.js"
```

**Document**:

- Complete execution flow (step by step)
- Environment variable passing
- Script dependencies
- Timing of operations
- Failure point in the flow

### Step 6: Compare with Working Examples

**Goal**: Compare the failing implementation with known working examples.

```bash
# Find similar working scripts
find scripts/ -name "*.sh" -o -name "*.js" | xargs grep -l "connection\|database" | head -5

# Check documentation examples
grep -r "example\|working\|test" docs/ --include="*.md" | grep -i "connection\|database"
```

**Document**:

- Working examples found
- Differences from working examples
- Patterns that work vs patterns that fail

## RCA Document Structure

Create a comprehensive RCA document with the following structure:

```markdown
# Root Cause Analysis: PR #{PR_NUMBER}

## Problem Summary

[Brief description of the failure]

## Investigation Results

### 1. Error Details Analysis

[Detailed error information]

### 2. Connection/Format Requirements Analysis

[Format requirements vs actual usage]

### 3. Configuration Construction Analysis

[How configuration is built]

### 4. Network Access and Permissions Analysis

[Network and permission requirements]

### 5. Script Execution Flow Analysis

[Complete execution flow]

### 6. Comparison with Working Examples

[Working examples vs failing implementation]

## Root Cause Conclusion

**PRIMARY ROOT CAUSE**:
[Clear statement of the root cause]

**SECONDARY FACTORS**:
[Contributing factors]

## Recommended Solutions

### Option 1: [Solution Name] (RECOMMENDED)

[Description and rationale]

### Option 2: [Alternative Solution]

[Description and rationale]

## Next Steps

1. [Action item 1]
2. [Action item 2]
3. [Action item 3]

## Files Requiring Changes

1. `path/to/file1` - [Reason for change]
2. `path/to/file2` - [Reason for change]

## Investigation Status

✅ **COMPLETE** - Root cause identified: [Summary]
```

## Agent-Specific Investigation Focus

### DevOps & Infrastructure Expert

**Focus Areas:**

- Workflow file syntax and configuration
- Secret and environment variable management
- Network connectivity and firewall rules
- Resource limits and timeouts
- Script execution and dependencies

### Backend/API Expert

**Focus Areas:**

- API endpoint format and authentication
- Request/response validation
- Connection string formats
- Error handling patterns

### Database & Schema Expert

**Focus Areas:**

- Database connection string format
- Connection pooling vs direct connection
- Schema creation and migration issues
- Prisma configuration

### Security Expert

**Focus Areas:**

- Authentication and authorization failures
- Secret management issues
- Network security and IP allowlisting
- Permission and access control

## Investigation Best Practices

1. **Document Everything**: Record all findings, even if they seem unrelated
2. **Be Systematic**: Follow the investigation steps in order
3. **Verify Assumptions**: Don't assume - verify each component
4. **Compare with Working Examples**: Always compare with known working code
5. **Research Requirements**: Check official documentation for requirements
6. **Identify Root Cause**: Don't just identify symptoms - find the root cause
7. **No Fixes Yet**: This command is investigation only - document findings for the `debug-pr` command

## Posting RCA Findings

After completing the investigation, post findings to GitHub:

### Decision: PR Comment vs GitHub Issue

**Use PR Comment when:**

- Issue is PR-specific and will be fixed in this PR
- Investigation is straightforward
- Fix is clear and can be implemented immediately

**Use GitHub Issue when:**

- Issue affects multiple PRs or the entire system
- Root cause is complex and requires ongoing investigation
- Fix requires architectural changes
- Issue needs separate tracking from the PR

### Post as PR Comment

```bash
# Create RCA comment body
RCA_COMMENT=$(cat << 'EOF'
## 🔍 Root Cause Analysis

### Problem Summary
[Brief description of the failure]

### Root Cause
[Clear statement of the root cause]

### Recommended Solution
[Solution description with implementation steps]

### Files Requiring Changes
- `path/to/file1` - [reason]
- `path/to/file2` - [reason]

### Next Steps
1. [Action item 1]
2. [Action item 2]

---
*Full investigation details: [Link to issue if created](#)*
EOF
)

# Post comment to PR
gh pr comment $PR_NUMBER --body "$RCA_COMMENT"
```

### Create GitHub Issue

```bash
# Create issue using template
gh issue create \
  --title "[RCA] PR #${PR_NUMBER}: [Brief description]" \
  --body-file <(cat << EOF
## Problem Summary

**PR Number**: #${PR_NUMBER}
**Failing Job/Check**: [Job name]
**Error Message**:
\`\`\`
[Error message]
\`\`\`

[Continue with full RCA document using issue template structure]
EOF
) \
  --label "rca,investigation" \
  --assignee "@me"

# Get issue number
ISSUE_NUMBER=$(gh issue list --limit 1 --json number --jq '.[0].number')

# Link issue in PR comment
gh pr comment $PR_NUMBER --body "RCA documented in issue #${ISSUE_NUMBER}: https://github.com/${REPO_OWNER}/${REPO_NAME}/issues/${ISSUE_NUMBER}"
```

### Update Existing Issue

If an issue already exists for this problem:

```bash
# Add comment to existing issue with RCA findings
gh issue comment $ISSUE_NUMBER --body "$RCA_FINDINGS"

# Link PR to issue
gh issue comment $ISSUE_NUMBER --body "Related PR: #${PR_NUMBER}"
```

The `debug-pr` command will read from the PR comment or GitHub issue to implement fixes.
