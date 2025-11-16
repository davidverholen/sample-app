# Root Cause Analysis for GitHub Pull Request

Perform a comprehensive root cause analysis (RCA) of failures in the current open GitHub pull request. This command focuses on investigation and documentation only - it does NOT implement fixes.

## CRITICAL: RCA Process

**MANDATORY**: Follow a systematic investigation approach. Document all findings and post them directly to the PR as a comment. Do NOT create local files. Do NOT implement fixes - only investigate and document.

**IMPORTANT**: This command automatically reviews all previous RCA comments in the PR before starting investigation. This ensures:

- Previous solutions that didn't work are not repeated
- New investigation builds on previous findings
- Why previous attempts failed is documented
- The new RCA comment references and explains differences from previous attempts

## Output Location

**RCA findings MUST be posted directly to the PR as a comment** - do not create local files in `docs/rca/`.

- **PR Comment** (default and required) - Post concise RCA findings directly to the PR
- **GitHub Issue** - Only for system-wide issues that affect multiple PRs (rare)

**Keep RCA concise and precise** - Focus on root cause, recommended solution, and files requiring changes.

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

### 2. Review Previous RCA Comments

**CRITICAL**: Before starting investigation, review all previous RCA comments in this PR to understand what solutions have already been attempted and why they didn't work. This prevents repeating failed solutions.

```bash
# Get all PR comments
echo "🔍 Reviewing previous RCA comments for PR #${PR_NUMBER}..."

# Fetch all comments and filter for RCA comments
PREVIOUS_RCA_COMMENTS=$(gh pr view $PR_NUMBER --json comments --jq '.comments[] | select(.body | contains("🔍 Root Cause Analysis") or contains("## 🔍 Root Cause Analysis") or contains("Root Cause Analysis")) | {
  id: .id,
  author: .author.login,
  createdAt: .createdAt,
  body: .body
}')

# Count previous RCA comments
RCA_COUNT=$(echo "$PREVIOUS_RCA_COMMENTS" | jq -s 'length')
echo "📋 Found ${RCA_COUNT} previous RCA comment(s)"

# Extract attempted solutions from each RCA comment
if [ "$RCA_COUNT" -gt 0 ]; then
  echo ""
  echo "📝 Previous RCA Attempts:"
  echo "=========================="

  # Process each RCA comment
  echo "$PREVIOUS_RCA_COMMENTS" | jq -r -s '.[] | "
  ---
  RCA Comment #\(.id) by @\(.author) at \(.createdAt)
  ---
  "'

  # Extract root causes and solutions from each comment
  # Use a more robust extraction method
  ATTEMPTED_SOLUTIONS=$(echo "$PREVIOUS_RCA_COMMENTS" | jq -r -s '.[] |
    "## Previous Attempt #\(.id) by @\(.author) at \(.createdAt):

**Root Cause Identified:**
\(.body | split("### Root Cause")[1] // "" | split("###")[0] // "Not found" | gsub("^[\\s]*"; "") | gsub("[\\s]*$"; ""))

**Recommended Solution:**
\(.body | split("### Recommended Solution")[1] // "" | split("###")[0] // "Not found" | gsub("^[\\s]*"; "") | gsub("[\\s]*$"; ""))

**Files Changed:**
\(.body | split("### Files Requiring Changes")[1] // "" | split("###")[0] // "Not found" | gsub("^[\\s]*"; "") | gsub("[\\s]*$"; ""))
"')

  # Save to temporary file for reference during investigation
  echo "$ATTEMPTED_SOLUTIONS" > /tmp/previous_rca_attempts.md

  echo ""
  echo "📄 Previous attempts saved to /tmp/previous_rca_attempts.md"
  echo ""
  echo "⚠️  IMPORTANT: Review previous attempts and ensure new investigation:"
  echo "   - Does NOT repeat solutions that were already tried"
  echo "   - Addresses why previous solutions didn't work"
  echo "   - Builds on previous findings"
  echo ""

  # Display summary of attempted solutions
  echo "📊 Summary of Previous Attempts:"
  echo "$ATTEMPTED_SOLUTIONS" | grep -E "## Previous Attempt|Root Cause Identified:|Recommended Solution:" | head -20
else
  echo "✅ No previous RCA comments found - this is the first investigation"
fi
```

**Document Previous Attempts**:

When reviewing previous RCA comments, extract and document:

- **Root causes identified** in each previous RCA
- **Solutions recommended** in each previous RCA
- **Files that were changed** based on each previous RCA
- **Why previous solutions didn't work** (if mentioned in follow-up comments or if the issue persists)
- **What new information is available** that wasn't available before

**Use This Information**:

- **Avoid repeating solutions**: If a solution was already tried, don't recommend it again unless new information suggests it should work
- **Build on previous findings**: Use previous root cause analysis as a starting point
- **Address why previous attempts failed**: If a solution was tried but didn't work, investigate why it failed
- **Reference previous attempts**: In the new RCA comment, reference previous attempts and explain why the new approach is different

### 3. Check CI/CD Status

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

**MANDATORY**: Read documentation and validate with tools before making assumptions.

**1. Check Codebase Documentation**:

```bash
# Read relevant documentation files
find docs/ -name "*.md" -exec grep -l "connection\|database\|api" {} \;
cat docs/REVIEW_APPS.md
cat docs/SUPABASE_SETUP.md

# Check agent specs for relevant information
grep -r "connection.*string\|DATABASE_URL\|API.*format" .cursor/rules/ --include="*.mdc"
```

**2. Validate with CLI Tools**:

**For Database Issues**:

```bash
# Test connection string format (if possible)
# Extract connection string from error/logs
# Test with actual database client
psql "$CONNECTION_STRING" -c "SELECT 1;" 2>&1

# Check Supabase CLI for connection info
supabase projects list
supabase db ping

# Verify against official docs
# Search web for official documentation
```

**For API Issues**:

```bash
# Test API endpoint with actual call
curl -v -H "Authorization: Bearer $TOKEN" "$API_URL"

# Check API documentation
gh api /repos/:owner/:repo --jq '.'
vercel project ls
supabase projects list
```

**For Configuration Issues**:

```bash
# Validate configuration syntax
node -c config.js 2>&1
yaml lint config.yml 2>&1

# Check environment variables (without exposing secrets)
gh secret list
vercel env ls
```

**3. Research Official Documentation**:

- Search official documentation for correct formats
- Compare with what's being used
- Note any discrepancies

**4. Update Agent Specs if Gap Found**:

- If documentation is missing, add it immediately
- Include examples, common mistakes, references
- Continue investigation with updated knowledge

**Document**:

- Expected format/requirements (from official docs)
- Actual format being used (from code/logs)
- Differences identified (validated with tools)
- Official documentation references
- Any agent spec updates made

### Step 3: Analyze Connection/Configuration Construction

**Goal**: Understand how the connection string or configuration is built and validate each component.

**1. Read Relevant Files**:

```bash
# View relevant script files
gh pr diff --name-only | grep -E "scripts/|\.config\.|\.env"

# Read the actual files to understand construction
cat scripts/create-supabase-preview.sh
cat scripts/create-schema.js

# Check how connection strings are constructed
grep -r "DATABASE_URL\|connection.*string" scripts/ --include="*.sh" --include="*.js" -A 5 -B 5
```

**2. Trace Variable Flow**:

```bash
# Trace environment variables through the execution
# Check workflow file for env var passing
gh pr diff .github/workflows/review-apps.yml | grep -A 10 -B 10 "env:\|DATABASE_URL"

# Check script for variable usage
grep -n "DATABASE_URL\|ENCODED_PASSWORD\|DB_HOST" scripts/create-supabase-preview.sh
```

**3. Validate Construction Logic**:

```bash
# Test password encoding (if applicable)
node -e "console.log(encodeURIComponent('test@password#123'))"

# Test host extraction (if applicable)
# Extract from API response and verify format
curl -H "Authorization: Bearer $TOKEN" "$API_URL" | jq '.database.host'

# Verify each component is constructed correctly
# Compare with expected format from Step 2
```

**4. Test Construction Output**:

```bash
# If possible, run script in dry-run mode or extract constructed value
# Compare constructed value with expected format
# Validate against official documentation
```

**Document**:

- How the connection string/config is constructed (line by line)
- Source of each component (env vars, API responses, etc.)
- Any transformations applied (encoding, concatenation, etc.)
- Validation results (what was tested, what passed/failed)
- Potential issues in construction logic (validated, not assumed)

### Step 4: Check Network Access and Permissions

**Goal**: Determine if network access, firewall rules, or permissions are blocking the operation. **Validate with tools, don't assume**.

**1. Validate Network Access**:

```bash
# Test network connectivity (if possible)
ping db.project.supabase.co
curl -v https://api.supabase.com/v1/projects

# Check if connection pooling is required
# Read agent specs for connection requirements
grep -r "connection.*pool\|port.*6543\|port.*5432" .cursor/rules/ --include="*.mdc"

# Test connection with different ports/formats
# Compare Transaction Mode vs Session Mode vs Direct
```

**2. Validate Permissions**:

```bash
# Check API token permissions (without exposing token)
gh auth status
vercel whoami
supabase projects list  # Tests access token

# Verify GitHub secrets are set (without exposing values)
gh secret list | grep -i "supabase\|database\|vercel"

# Check if secrets have correct names
gh secret list
```

**3. Validate Configuration**:

```bash
# Check if IP allowlisting is needed
# Read Supabase documentation
# Check agent specs for IP allowlisting requirements

# Verify firewall rules
# Test connection from different contexts
# Compare local vs CI/CD behavior
```

**4. Test Actual Access**:

```bash
# If possible, test actual connection/permission
# Use CLI tools to verify access
supabase db ping
vercel project ls
gh api /repos/:owner/:repo
```

**Document**:

- Network access requirements (from docs, validated)
- Permission requirements (from docs, validated)
- Current configuration (from code/logs, verified)
- Test results (what was tested, what passed/failed)
- Blocking factors identified (validated, not assumed)

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

**Goal**: Compare the failing implementation with known working examples. **Validate differences with tools**.

**1. Find Working Examples**:

```bash
# Find similar working scripts
find scripts/ -name "*.sh" -o -name "*.js" | xargs grep -l "connection\|database" | head -5

# Read working examples
cat scripts/test-db-connection.js
cat scripts/setup-supabase-schema.sh

# Check documentation examples
grep -r "example\|working\|test" docs/ --include="*.md" | grep -i "connection\|database" -A 10 -B 5

# Check agent specs for examples
grep -r "example\|format\|connection" .cursor/rules/ --include="*.mdc" -A 5
```

**2. Compare Formats**:

```bash
# Extract connection string formats from working examples
grep -h "postgres://\|postgresql://" scripts/*.sh scripts/*.js docs/*.md

# Compare with failing implementation
# Identify exact differences (not just "looks different")
```

**3. Validate Differences**:

```bash
# Test if working format actually works
# Test if failing format actually fails
# Document specific differences that matter
```

**Document**:

- Working examples found (with file paths)
- Exact differences from working examples (validated)
- Patterns that work vs patterns that fail (tested)
- Why the difference matters (validated with tools/docs)

## RCA Comment Structure

Create a concise RCA comment with the following structure (keep it short and precise, but include validation evidence):

```markdown
## 🔍 Root Cause Analysis

### Problem Summary

[Brief description of the failure - 1-2 sentences]

### Previous Attempts

[If previous RCA comments exist, include this section:]

**Previous RCA Comments Found**: [Number] previous investigation(s)

**What Was Tried Before**:

- [Previous attempt 1]: [Solution that was attempted] - **Why it didn't work**: [Reason or "Still investigating"]
- [Previous attempt 2]: [Solution that was attempted] - **Why it didn't work**: [Reason or "Still investigating"]

**Why This Investigation Is Different**:

- [New information discovered]
- [Different approach based on previous findings]
- [What changed since last attempt]

[If no previous RCA comments exist, omit this section]

### Root Cause

**PRIMARY**: [Clear statement of the root cause - 1-2 sentences]

**Evidence** (validated with tools/docs):

- [Key evidence point 1 - what was tested/validated]
- [Key evidence point 2 - what was tested/validated]
- [Reference to official documentation or agent spec]

**Why Previous Solutions Didn't Work** (if applicable):

- [Previous solution 1]: [Why it failed - specific reason]
- [Previous solution 2]: [Why it failed - specific reason]

### Recommended Solution

[Solution description with implementation steps - be specific]
[Include exact format/configuration needed]

**Why This Solution Will Work** (if previous attempts exist):

- [How this differs from previous attempts]
- [What new information supports this approach]
- [Why previous solutions failed and this won't]

### Files Requiring Changes

- `path/to/file1` - [reason - what needs to change and why]
- `path/to/file2` - [reason - what needs to change and why]

### Documentation Updates

[If agent specs were updated, note what was added and where]

### Next Steps

1. [Action item 1]
2. [Action item 2]
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

1. **Review Previous RCA Comments First**: Always check for previous RCA comments in the PR before starting investigation. This prevents repeating failed solutions and helps build on previous findings.
2. **Validate Assumptions with Tooling**: Use CLI tools to test assumptions, don't just read code
3. **Read Documentation First**: Check `docs/` directory and agent specs for relevant information
4. **Update Agent Specs Immediately**: If knowledge gaps are found, add documentation to agent specs right away
5. **Be Systematic**: Follow the investigation steps in order
6. **Verify with CLI Tools**: Test connection strings, API calls, configurations using actual tools
7. **Compare with Working Examples**: Always compare with known working code
8. **Research Official Documentation**: Check official documentation for requirements
9. **Identify Root Cause**: Don't just identify symptoms - find the root cause
10. **Avoid Repeating Failed Solutions**: If a solution was already tried in a previous RCA, don't recommend it again unless you have new information that suggests it should work
11. **Explain Why Previous Attempts Failed**: If previous RCA comments exist, investigate why those solutions didn't work and address those issues in your new analysis
12. **No Fixes Yet**: This command is investigation only - document findings for the `debug-pr` command

## Validation and Testing

**CRITICAL**: Always validate assumptions using CLI tools and actual testing, not just code inspection.

### For Database Connection Issues

```bash
# Test connection string format
# Extract connection string from script/logs
CONNECTION_STRING="postgres://postgres:password@db.project.supabase.co:6543/postgres"

# Test with psql (if available)
psql "$CONNECTION_STRING" -c "SELECT 1;" || echo "Connection failed"

# Test with Prisma (if project has Prisma)
DATABASE_URL="$CONNECTION_STRING" npx prisma db execute --stdin <<< "SELECT 1;"

# Check Supabase CLI documentation
supabase --help | grep -i connection

# Verify connection string format against Supabase docs
# Check agent specs for connection string documentation
grep -r "connection.*string\|DATABASE_URL" .cursor/rules/ --include="*.mdc"
```

### For API Issues

```bash
# Test API endpoint
curl -H "Authorization: Bearer $TOKEN" "https://api.example.com/endpoint"

# Verify API documentation
# Check agent specs for API documentation
grep -r "API\|endpoint\|authentication" .cursor/rules/ --include="*.mdc"

# Test with actual CLI tools (gh, vercel, supabase, etc.)
gh api /repos/:owner/:repo
vercel env ls
supabase projects list
```

### For Configuration Issues

```bash
# Validate configuration files
# Check syntax
node -c config.js
yaml lint config.yml

# Test environment variable access
echo "$ENV_VAR"

# Verify secrets are set (without exposing values)
gh secret list
vercel env ls
```

### For Workflow/CI Issues

```bash
# Validate workflow syntax
gh workflow view workflow.yml

# Check workflow runs
gh run list --limit 5

# View workflow logs
gh run view $RUN_ID --log

# Test workflow locally (if possible)
act -l  # List workflows
```

## Knowledge Gap Protocol

**MANDATORY**: If you identify a knowledge gap during investigation:

1. **Immediately check agent specs** for relevant documentation:

   ```bash
   # Search agent specs for relevant information
   grep -r "keyword" .cursor/rules/ --include="*.mdc"
   ```

2. **If gap exists, add documentation immediately**:
   - Read official documentation
   - Add relevant section to appropriate agent spec
   - Include examples, common mistakes, and references
   - Update the spec before continuing investigation

3. **Document the gap in RCA**:
   - Note what was missing
   - Reference where documentation was added

**Example**: If investigating Supabase connection issues and find agent spec doesn't have connection string formats:

- Search official Supabase docs
- Add connection string documentation to DevOps Expert spec
- Add connection string documentation to Database Expert spec
- Continue investigation with new knowledge

## Posting RCA Findings

**MANDATORY**: After completing the investigation, post findings directly to the PR as a comment. Do NOT create local files.

### Post as PR Comment (Default and Required)

```bash
# Post concise RCA directly to PR
# Include previous attempts section if previous RCA comments exist

# Check if previous RCA comments exist
PREVIOUS_RCA_COUNT=$(gh pr view $PR_NUMBER --json comments --jq '.comments[] | select(.body | contains("🔍 Root Cause Analysis") or contains("Root Cause Analysis")) | .id' | wc -l | tr -d ' ')

if [ "$PREVIOUS_RCA_COUNT" -gt 0 ]; then
  # Build previous attempts section from /tmp/previous_rca_attempts.md
  PREVIOUS_ATTEMPTS_SECTION=$(cat /tmp/previous_rca_attempts.md 2>/dev/null || echo "")

  gh pr comment $PR_NUMBER --body "## 🔍 Root Cause Analysis

### Problem Summary
[Brief description - 1-2 sentences]

### Previous Attempts

**Previous RCA Comments Found**: ${PREVIOUS_RCA_COUNT} previous investigation(s)

**What Was Tried Before**:
${PREVIOUS_ATTEMPTS_SECTION}

**Why This Investigation Is Different**:
- [New information discovered]
- [Different approach based on previous findings]
- [What changed since last attempt]

### Root Cause
**PRIMARY**: [Clear statement - 1-2 sentences]

**Evidence** (validated):
- [Key evidence point 1 - what was tested/validated]
- [Key evidence point 2 - what was tested/validated]
- [Reference to official docs or agent spec]

**Why Previous Solutions Didn't Work**:
- [Previous solution 1]: [Why it failed - specific reason]
- [Previous solution 2]: [Why it failed - specific reason]

### Recommended Solution
[Solution with specific implementation steps and exact formats]

**Why This Solution Will Work**:
- [How this differs from previous attempts]
- [What new information supports this approach]
- [Why previous solutions failed and this won't]

### Files Requiring Changes
- \`path/to/file1\` - [reason - what needs to change]
- \`path/to/file2\` - [reason - what needs to change]

### Documentation Updates
[If agent specs were updated: Added [topic] to [agent spec] - see [section]]

### Next Steps
1. [Action item 1]
2. [Action item 2]"
else
  # No previous RCA comments - use standard format
  gh pr comment $PR_NUMBER --body "## 🔍 Root Cause Analysis

### Problem Summary
[Brief description - 1-2 sentences]

### Root Cause
**PRIMARY**: [Clear statement - 1-2 sentences]

**Evidence** (validated):
- [Key evidence point 1 - what was tested/validated]
- [Key evidence point 2 - what was tested/validated]
- [Reference to official docs or agent spec]

### Recommended Solution
[Solution with specific implementation steps and exact formats]

### Files Requiring Changes
- \`path/to/file1\` - [reason - what needs to change]
- \`path/to/file2\` - [reason - what needs to change]

### Documentation Updates
[If agent specs were updated: Added [topic] to [agent spec] - see [section]]

### Next Steps
1. [Action item 1]
2. [Action item 2]"
fi
```

**Keep it concise but precise** - Focus on root cause (validated), solution (with exact formats), and actionable next steps. Include validation evidence, not assumptions. **Always reference previous attempts** if they exist to avoid repeating failed solutions.

### Create GitHub Issue (Rare - Only for System-Wide Issues)

Only create a GitHub issue if the problem affects multiple PRs or the entire system:

```bash
# Create issue for system-wide problems
gh issue create \
  --title "[RCA] System-wide issue: [Brief description]" \
  --body "## Problem Summary
[Description affecting multiple PRs]

## Root Cause
[Root cause analysis]

## Impact
- Affects PRs: [List]
- System-wide impact: [Description]

## Recommended Solution
[Solution]"

# Link issue in PR comment
gh pr comment $PR_NUMBER --body "RCA documented in issue #${ISSUE_NUMBER}: https://github.com/${REPO_OWNER}/${REPO_NAME}/issues/${ISSUE_NUMBER}"
```

**Note**: For PR-specific issues (99% of cases), post directly to PR comment. The `debug-pr` command reads from PR comments to implement fixes.
