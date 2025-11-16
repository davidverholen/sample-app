---
name: Root Cause Analysis (RCA)
about: Document root cause analysis for a failing PR or system issue
title: '[RCA] '
labels: 'rca, investigation'
assignees: ''
---

## Problem Summary

**PR Number**: #<!-- PR number if applicable -->
**Failing Job/Check**: <!-- e.g., "Deploy Preview", "Build", "Test" -->
**Error Message**:

```
<!-- Paste the main error message here -->
```

**When does this occur?**

- [ ] On every PR
- [ ] On specific PRs only
- [ ] Intermittently
- [ ] After specific changes

## Investigation Results

### 1. Error Details Analysis

**Error Location**:

- File: `<!-- file path -->`
- Line: `<!-- line number -->`
- Function/Method: `<!-- function name -->`

**Error Type**:

- [ ] Network connectivity
- [ ] Authentication/authorization
- [ ] Configuration/format
- [ ] Code logic
- [ ] Dependency/environment
- [ ] Other: <!-- specify -->

**When Error Occurs**:

- [ ] During initialization
- [ ] During connection attempt
- [ ] During query/operation execution
- [ ] During cleanup
- [ ] Other: <!-- specify -->

**Full Error Stack**:

```
<!-- Paste full error stack trace if available -->
```

### 2. Connection/Format Requirements Analysis

**Expected Format/Requirements**:

<!-- Document what the correct format or requirements should be -->

**Actual Format/Configuration Used**:

<!-- Document what is currently being used -->

**Differences Identified**:

<!-- List any differences between expected and actual -->

**Documentation References**:

<!-- Links to official documentation -->

### 3. Configuration Construction Analysis

**How Configuration is Built**:

<!-- Explain how the connection string, config, etc. is constructed -->

**Source of Components**:

<!-- Where each component comes from (env vars, API responses, etc.) -->

**Potential Issues**:

<!-- Any issues identified in the construction logic -->

### 4. Network Access and Permissions Analysis

**Network Requirements**:

<!-- What network access is required -->

**Permission Requirements**:

<!-- What permissions are required -->

**Current Configuration**:

<!-- What is currently configured -->

**Blocking Factors**:

<!-- What is preventing access/permissions -->

### 5. Script Execution Flow Analysis

**Complete Execution Flow**:

1. <!-- Step 1 -->
2. <!-- Step 2 -->
3. <!-- Step 3 -->
<!-- Add more steps as needed -->

**Environment Variables**:

<!-- List environment variables and their sources -->

**Script Dependencies**:

<!-- List script dependencies and order -->

**Failure Point**:

<!-- Where exactly in the flow does it fail -->

### 6. Comparison with Working Examples

**Working Examples Found**:

<!-- List working examples or patterns -->

**Differences from Working Examples**:

<!-- What's different in the failing implementation -->

**Patterns That Work vs Fail**:

<!-- Document patterns that work vs those that fail -->

## Root Cause Conclusion

**PRIMARY ROOT CAUSE**:

<!-- Clear, concise statement of the root cause -->

**SECONDARY FACTORS**:

<!-- Contributing factors that made the issue worse or harder to diagnose -->

**Confidence Level**:

- [ ] High - Root cause clearly identified
- [ ] Medium - Root cause likely identified, needs verification
- [ ] Low - Hypothesis, needs more investigation

## Recommended Solutions

### Option 1: <!-- Solution Name --> (RECOMMENDED)

**Description**:

<!-- Detailed description of the solution -->

**Rationale**:

<!-- Why this is the recommended approach -->

**Implementation Steps**:

1. <!-- Step 1 -->
2. <!-- Step 2 -->
3. <!-- Step 3 -->

**Files to Modify**:

- `<!-- file path -->` - <!-- reason -->
- `<!-- file path -->` - <!-- reason -->

**Testing Required**:

<!-- What testing is needed to verify the fix -->

### Option 2: <!-- Alternative Solution -->

**Description**:

<!-- Description of alternative -->

**Rationale**:

<!-- Why this might be used instead -->

**Trade-offs**:

<!-- What are the trade-offs vs Option 1 -->

## Next Steps

- [ ] <!-- Action item 1 -->
- [ ] <!-- Action item 2 -->
- [ ] <!-- Action item 3 -->

## Related

- Related PR: #<!-- PR number -->
- Related Issues: #<!-- Issue numbers -->
- Related Documentation: <!-- Links -->

## Additional Context

<!-- Add any other context, screenshots, or information that might be helpful -->
