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

## Optimized Command Flow

The RCA process uses conditional logic to focus investigation and reduce execution time:

1. **Get PR info and review previous RCAs** (always)
2. **Extract error details** (always)
3. **IF workflow failure**: Try act reproduction (optional - failing job first, then full workflow)
4. **Causal Analysis (5 Whys)** (always - structured methodology)
5. **Validate Root Cause** (always - combines documentation, CLI tools, construction analysis)
6. **IF connection/auth error**: Check network/permissions (conditional)
7. **Identify Failure Point** (always - simplified, focus on exact failure location)
8. **IF root cause unclear**: Compare with working examples (optional)
9. **Generate minimal RCA comment** (following industry best practices)
10. **Post to PR**

**Optimization Strategies**:

- Skip unnecessary steps based on error type
- Use conditional logic to focus investigation
- Cache CLI tool results to avoid repeated calls
- Parallelize independent checks where possible
- Focus on validated findings, not assumptions

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

### Step 1.5: Reproduce Locally with Act (Optional)

**Goal**: Reproduce the exact failure locally using `act` to validate root cause. Try failing job first, then full workflow if needed.

**Prerequisites Check**:

```bash
# Check if act is installed
if command -v act &> /dev/null; then
  echo "✅ act is installed"
  ACT_VERSION=$(act --version)
  echo "   Version: $ACT_VERSION"
  USE_ACT=true
else
  echo "⚠️  act is not installed - skipping local reproduction"
  echo "   Install: https://github.com/nektos/act#installation"
  USE_ACT=false
fi
```

**Reproduce Failing Job First**:

```bash
if [ "$USE_ACT" = true ]; then
  # Extract failing job name from workflow run
  FAILING_JOB=$(gh run view $FAILED_RUN --json jobs --jq '.jobs[] | select(.conclusion == "failure") | .name' | head -1)

  # Get workflow file name
  WORKFLOW_FILE=$(gh run view $FAILED_RUN --json workflowName --jq '.workflowName' | tr ' ' '-' | tr '[:upper:]' '[:lower:]')
  WORKFLOW_PATH=".github/workflows/${WORKFLOW_FILE}.yml"

  # Check if workflow file exists
  if [ ! -f "$WORKFLOW_PATH" ]; then
    WORKFLOW_PATH=$(find .github/workflows -name "*.yml" -o -name "*.yaml" | head -1)
  fi

  # Try failing job first (faster)
  echo "🔬 Reproducing failing job '$FAILING_JOB' locally with act..."
  act -j "$FAILING_JOB" -W "$WORKFLOW_PATH" --secret-file .env.local 2>&1 | tee /tmp/act-job.log

  # Check if reproduction succeeded
  if grep -qi "error\|failed\|fatal" /tmp/act-job.log; then
    echo "✅ Reproduced error in failing job"
    ACT_ERROR=$(grep -i "error\|failed\|fatal" /tmp/act-job.log | tail -3)
    echo "$ACT_ERROR"
    ACT_REPRODUCED=true
  else
    echo "⚠️  Failing job didn't reproduce - trying full workflow..."
    # Try full workflow if job-specific reproduction didn't work
    act -W "$WORKFLOW_PATH" --secret-file .env.local 2>&1 | tee /tmp/act-workflow.log
    if grep -qi "error\|failed\|fatal" /tmp/act-workflow.log; then
      echo "✅ Reproduced error in full workflow"
      ACT_ERROR=$(grep -i "error\|failed\|fatal" /tmp/act-workflow.log | tail -3)
      ACT_REPRODUCED=true
    else
      echo "⚠️  Could not reproduce locally - may be environment-specific"
      ACT_REPRODUCED=false
    fi
  fi
else
  ACT_REPRODUCED=false
fi
```

**Document**:

- Whether error was reproduced locally (yes/no)
- Exact error message from act (if reproduced)
- Differences between local and CI environment (if not reproduced)
- Validation: Error matches CI logs (yes/no)

### Step 2: Causal Analysis (5 Whys)

**Goal**: Use structured methodology to identify root cause, not just symptoms.

**Process**:

1. Start with the failure symptom
2. Ask "Why did this happen?" 5 times
3. Each answer becomes the next question
4. Stop when you reach a fundamental cause (root cause)

**Example**:

```
Why 1: Why did the workflow fail?
  → Job "Deploy Preview" failed with connection error

Why 2: Why did the connection error occur?
  → Database connection string was invalid

Why 3: Why was the connection string invalid?
  → Password encoding was missing special characters

Why 4: Why was password encoding missing?
  → Script doesn't URL-encode passwords

Why 5: Why doesn't the script encode passwords?
  → Script assumes passwords don't contain special characters (ROOT CAUSE)
```

**Document**:

- 5 Whys chain (all 5 questions and answers)
- Root cause (the fundamental factor)
- Contributing factors (not root causes, but relevant)

### Step 3: Validate Root Cause

**Goal**: Verify the root cause identified in Step 2 using documentation, CLI tools, and validation tests. This combines the previous Steps 2-3 (Connection/Format + Construction).

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

**3. Analyze Construction Logic**:

```bash
# View relevant script files
gh pr diff --name-only | grep -E "scripts/|\.config\.|\.env"

# Read the actual files to understand construction
cat scripts/create-supabase-preview.sh
cat scripts/create-schema.js

# Check how connection strings are constructed
grep -r "DATABASE_URL\|connection.*string" scripts/ --include="*.sh" --include="*.js" -A 5 -B 5

# Trace environment variables through the execution
gh pr diff .github/workflows/review-apps.yml | grep -A 10 -B 10 "env:\|DATABASE_URL"

# Test password encoding (if applicable)
node -e "console.log(encodeURIComponent('test@password#123'))"

# Test host extraction (if applicable)
curl -H "Authorization: Bearer $TOKEN" "$API_URL" | jq '.database.host'
```

**4. Research Official Documentation**:

- Search official documentation for correct formats
- Compare with what's being used
- Note any discrepancies

**5. Update Agent Specs if Gap Found**:

- If documentation is missing, add it immediately
- Include examples, common mistakes, references
- Continue investigation with updated knowledge

**Document**:

- Expected format/requirements (from official docs)
- Actual format being used (from code/logs)
- How the connection string/config is constructed (line by line)
- Source of each component (env vars, API responses, etc.)
- Any transformations applied (encoding, concatenation, etc.)
- Validation results (what was tested, what passed/failed)
- Differences identified (validated with tools)
- Official documentation references
- Any agent spec updates made

### Step 4: Check Network Access and Permissions (Conditional)

**Goal**: Determine if network access, firewall rules, or permissions are blocking the operation. **ONLY run this step if connection/auth issues are identified**. **Validate with tools, don't assume**.

**When to Run**: Only if Step 3 indicates connection or authentication issues.

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

### Step 5: Identify Failure Point (Simplified)

**Goal**: Understand the exact failure point in the execution flow. Focus only on where the failure occurs.

```bash
# View workflow file
gh pr diff .github/workflows/

# Check script dependencies
grep -r "export\|require\|import" scripts/ --include="*.sh" --include="*.js"
```

**Document**:

- Exact failure point (file, line, function)
- Environment variable passing at failure point
- Script dependencies at failure point
- Timing of failure (when in execution flow)

### Step 6: Compare with Working Examples (Optional)

**Goal**: Compare the failing implementation with known working examples. **ONLY run this step if root cause is still unclear after Steps 1-5**. **Validate differences with tools**.

**When to Run**: Only if root cause is not clear after completing Steps 1-5.

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

Create a minimal RCA comment following industry best practices (Problem → Root Cause → Corrective → Preventive). Keep it under 300 words total.

```markdown
## 🔍 Root Cause Analysis

### Problem Statement

[1 sentence: What failed, when, where, impact]

### Root Cause

**PRIMARY**: [1-2 sentences: Fundamental root cause identified via 5 Whys]

**Validation**:

- ✅ Reproduced locally: [Yes/No - act result]
- ✅ Validated: [CLI tool result or doc reference]

### Corrective Action

[2-3 sentences: Specific fix with file:line numbers]

### Preventive Measure

[1 sentence: How to prevent recurrence]

### Files Requiring Changes

- `path/to/file:line` - [1 sentence: what to change]

### Next Steps

1. [Action item]
2. [Action item]
```

**Key Principles**:

- Follows industry structure (Problem → Root Cause → Corrective → Preventive)
- Minimal format (2-3 sentences per section)
- Includes validation evidence (act reproduction OR CLI tools OR docs)
- Removes verbose sections
- Focuses on actionable items
- Total word count: < 300 words

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
2. **Use 5 Whys Methodology**: Use structured causal analysis (5 Whys) to identify root cause, not just symptoms. Stop when you reach a fundamental cause.
3. **Reproduce Locally with Act** (if available): Try to reproduce the failure locally using `act` to validate root cause. Start with failing job, then full workflow if needed.
4. **Validate Assumptions with Tooling**: Use CLI tools to test assumptions, don't just read code
5. **Read Documentation First**: Check `docs/` directory and agent specs for relevant information
6. **Update Agent Specs Immediately**: If knowledge gaps are found, add documentation to agent specs right away
7. **Be Systematic**: Follow the investigation steps in order, but skip conditional steps if not applicable
8. **Verify with CLI Tools**: Test connection strings, API calls, configurations using actual tools
9. **Compare with Working Examples**: Only if root cause is unclear after Steps 1-5
10. **Research Official Documentation**: Check official documentation for requirements
11. **Identify Root Cause**: Don't just identify symptoms - find the fundamental root cause using 5 Whys
12. **Avoid Repeating Failed Solutions**: If a solution was already tried in a previous RCA, don't recommend it again unless you have new information that suggests it should work
13. **Explain Why Previous Attempts Failed**: If previous RCA comments exist, investigate why those solutions didn't work and address those issues in your new analysis
14. **No Fixes Yet**: This command is investigation only - document findings for the `debug-pr` command
15. **Keep Reports Minimal**: Follow industry best practices format, keep under 300 words total

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

## Act Setup (Optional but Recommended)

To enable local reproduction with `act`:

**1. Install act**:

```bash
# macOS
brew install act

# Linux (using install script)
curl https://raw.githubusercontent.com/nektos/act/master/install.sh | sudo bash

# Or download from: https://github.com/nektos/act/releases
```

**2. Configure secrets** (if needed):

```bash
# Create .env.local with required secrets (gitignored)
# Format: SECRET_NAME=value
# Example:
# DATABASE_URL=postgres://...
# SUPABASE_ACCESS_TOKEN=...
```

**3. Test act**:

```bash
# List workflows
act -l

# Run specific job
act -j "Job Name" -W .github/workflows/ci.yml

# Run with secrets file
act -j "Job Name" -W .github/workflows/ci.yml --secret-file .env.local
```

**Note**: Act may not perfectly replicate GitHub Actions environment, but it helps validate most issues. If act is not installed, the RCA process will continue with log-based investigation.

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

## Validation Checklist (MANDATORY Before Posting)

**CRITICAL**: Before posting RCA, verify all items below. All findings must be evidence-based, not assumptions.

- [ ] Problem statement is clear (what, when, where, impact)
- [ ] 5 Whys analysis completed (root cause identified, not symptom)
- [ ] Root cause validated (act reproduction OR CLI tools OR docs)
- [ ] Corrective action is specific (file:line, exact change)
- [ ] Preventive measure identified (how to prevent recurrence)
- [ ] No assumptions - all findings are evidence-based
- [ ] Report is minimal (< 300 words total)

**If any item is unchecked, complete the investigation before posting.**

## Posting RCA Findings

**MANDATORY**: After completing the investigation and validation checklist, post findings directly to the PR as a comment. Do NOT create local files.

### Post as PR Comment (Default and Required)

```bash
# Post minimal RCA directly to PR (following industry best practices format)
# Format: Problem → Root Cause → Corrective → Preventive

gh pr comment $PR_NUMBER --body "## 🔍 Root Cause Analysis

### Problem Statement
[1 sentence: What failed, when, where, impact]

### Root Cause
**PRIMARY**: [1-2 sentences: Fundamental root cause identified via 5 Whys]

**Validation**:
- ✅ Reproduced locally: [Yes/No - act result]
- ✅ Validated: [CLI tool result or doc reference]

### Corrective Action
[2-3 sentences: Specific fix with file:line numbers]

### Preventive Measure
[1 sentence: How to prevent recurrence]

### Files Requiring Changes
- \`path/to/file:line\` - [1 sentence: what to change]

### Next Steps
1. [Action item]
2. [Action item]"
```

**Key Requirements**:

- Keep total word count under 300 words
- Follow industry structure (Problem → Root Cause → Corrective → Preventive)
- Include validation evidence (act reproduction OR CLI tools OR docs)
- Use specific file:line references
- Focus on actionable items

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
