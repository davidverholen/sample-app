# Root Cause Analysis (RCA) Documentation

This directory contains root cause analysis documents for GitHub Pull Request failures, organized by PR number.

## Directory Structure

```
docs/rca/
├── README.md (this file)
├── pr-7/
│   └── INVESTIGATION_FINDINGS.md
├── pr-12/
│   └── INVESTIGATION_FINDINGS.md
└── ...
```

Each PR has its own subdirectory (`pr-{PR_NUMBER}/`) containing:

- `INVESTIGATION_FINDINGS.md` - Comprehensive root cause analysis document

## Usage

### Performing Root Cause Analysis

Use the `rca-pr` command to investigate and document failures:

```bash
# In Cursor, use the command:
/rca-pr
```

This will:

1. Investigate the failing PR
2. Document findings systematically
3. Save the RCA document to `docs/rca/pr-{PR_NUMBER}/INVESTIGATION_FINDINGS.md`

### Using RCA to Fix Issues

After the RCA is complete, use the `debug-pr` command to implement fixes:

```bash
# In Cursor, use the command:
/debug-pr
```

This will:

1. Load the RCA document for the current PR
2. Implement fixes based on the RCA recommendations
3. Test and verify the fixes

## RCA Document Structure

Each `INVESTIGATION_FINDINGS.md` document contains:

1. **Problem Summary** - Brief description of the failure
2. **Investigation Results** - Detailed analysis of:
   - Error details
   - Connection/format requirements
   - Configuration construction
   - Network access and permissions
   - Script execution flow
   - Comparison with working examples
3. **Root Cause Conclusion** - Clear statement of the root cause
4. **Recommended Solutions** - Options for fixing the issue
5. **Next Steps** - Action items for implementation
6. **Files Requiring Changes** - List of files that need modification

## Best Practices

1. **Always run `rca-pr` first** - Don't skip the investigation phase
2. **Review RCA before fixing** - Understand the root cause before implementing
3. **Follow recommended solutions** - The RCA document provides tested approaches
4. **Update RCA if needed** - If new information is discovered during debugging, update the RCA
5. **Keep RCA documents** - They serve as valuable reference for similar issues

## Related Commands

- `/rca-pr` - Perform root cause analysis (investigation only)
- `/debug-pr` - Implement fixes based on RCA document

## Examples

### Example 1: Database Connection Failure

**RCA Location**: `docs/rca/pr-7/INVESTIGATION_FINDINGS.md`

**Root Cause**: Supabase blocks direct database connections (port 5432) from external IPs. Connection pooling (port 6543) is required.

**Solution**: Update connection strings to use port 6543 (connection pooling) instead of port 5432.

### Example 2: Missing Environment Variable

**RCA Location**: `docs/rca/pr-12/INVESTIGATION_FINDINGS.md`

**Root Cause**: Required environment variable not set in GitHub Actions workflow.

**Solution**: Add missing environment variable to workflow file.

## Maintenance

- RCA documents are kept for historical reference
- Old RCA documents can be archived but should not be deleted
- Update RCA documents if additional information is discovered
- Link related RCA documents when issues are similar
