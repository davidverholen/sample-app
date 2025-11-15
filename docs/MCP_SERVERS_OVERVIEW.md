# MCP Servers Overview

This document provides an overview of available MCP (Model Context Protocol) server configurations for this project. MCP servers enable programmatic access to external services through Cursor IDE.

## Available MCP Servers

### GitHub MCP Server

**Purpose**: Automated GitHub repository management, issue tracking, and pull request management.

**Setup Guide**: See [GITHUB_MCP_SETUP.md](./GITHUB_MCP_SETUP.md)

**Key Features**:

- Create and manage issues
- Create and manage pull requests
- Repository administration
- Branch and commit management
- Code search across repositories

**Use Cases**:

- Automated issue creation from code analysis
- PR creation and management
- Repository administration tasks
- Code search and analysis

## Quick Setup Checklist

### GitHub MCP Server

- [ ] Create GitHub Personal Access Token
- [ ] Configure MCP server in Cursor
- [ ] Restart Cursor
- [ ] Verify GitHub operations work

## Configuration File Location

MCP server configurations are typically stored in:

- **Linux**: `~/.config/Cursor/User/globalStorage/rooveterinaryinc.roo-cline/settings/cline_mcp_settings.json`
- **macOS**: `~/Library/Application Support/Cursor/User/globalStorage/rooveterinaryinc.roo-cline/settings/cline_mcp_settings.json`
- **Windows**: `%APPDATA%\Cursor\User\globalStorage\rooveterinaryinc.roo-cline\settings\cline_mcp_settings.json`

## Example Configuration

```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "your-github-token-here"
      }
    }
  }
}
```

## Security Best Practices

### General Security

- ✅ Never commit API tokens or keys to version control
- ✅ Use environment variables when possible
- ✅ Set token expiration dates
- ✅ Rotate tokens regularly
- ✅ Use minimum required permissions
- ✅ Revoke tokens if compromised
- ✅ Monitor token usage

### GitHub Token Security

- Use tokens with minimum required scopes
- Set expiration dates (recommended: 90 days)
- Revoke unused tokens
- Monitor token usage in GitHub settings

## Troubleshooting

### Common Issues

1. **MCP Server Not Appearing**
   - Ensure Cursor is fully restarted
   - Check configuration syntax
   - Verify credentials are correct
   - Check Cursor logs for errors

2. **Authentication Errors**
   - Verify tokens/keys are valid
   - Check token expiration dates
   - Ensure correct permissions/scopes
   - Regenerate tokens if needed

3. **Package Not Found**
   - Check for alternative packages
   - Use service APIs directly if needed
   - Wait for official MCP server support

4. **Connection Issues**
   - Check internet connectivity
   - Verify service status pages
   - Check firewall/proxy settings
   - Verify credentials haven't been revoked

## Alternative Approaches

If MCP servers are not available or not working:

1. **Use Official CLIs**:
   - GitHub CLI (`gh`)
   - Vercel CLI (`vercel`)
   - Supabase CLI (`supabase`)

2. **Use REST APIs Directly**:
   - GitHub REST API
   - Vercel REST API
   - Supabase REST API

3. **Use SDKs**:
   - GitHub SDK
   - Vercel SDK
   - Supabase JavaScript Client

## Need Help?

For specific setup instructions, see:

- [GitHub MCP Setup](./GITHUB_MCP_SETUP.md)

For general MCP information:

- [Model Context Protocol Documentation](https://modelcontextprotocol.io/)
- [Cursor MCP Documentation](https://cursor.sh/docs/mcp)

## References

- [GitHub MCP Setup Guide](./GITHUB_MCP_SETUP.md)
- [Model Context Protocol](https://modelcontextprotocol.io/)
