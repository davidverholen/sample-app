# GitHub MCP Server Setup Guide

This guide will help you set up the GitHub MCP server to work with your GitHub remote repository.

## Prerequisites

- A GitHub account
- Cursor IDE installed
- Access to create Personal Access Tokens on GitHub

## Step 1: Create a GitHub Personal Access Token (PAT)

1. **Navigate to GitHub Settings**:
   - Go to https://github.com/settings/tokens
   - Or: Click your profile picture → Settings → Developer settings → Personal access tokens → Tokens (classic)

2. **Generate a New Token**:
   - Click "Generate new token" → "Generate new token (classic)"
   - Give it a descriptive name (e.g., "Cursor MCP Server")
   - Set an expiration (recommended: 90 days or custom)
   - Select the following scopes/permissions:
     - ✅ `repo` (Full control of private repositories)
       - This includes: `repo:status`, `repo_deployment`, `public_repo`, `repo:invite`, `security_events`
     - ✅ `workflow` (Update GitHub Action workflows)
     - ✅ `read:org` (Read org and team membership, read org projects) - if working with organizations
     - ✅ `read:user` (Read user profile data)
     - ✅ `user:email` (Access user email addresses)

3. **Generate and Copy the Token**:
   - Click "Generate token"
   - **IMPORTANT**: Copy the token immediately - you won't be able to see it again!
   - Store it securely (you'll need it in the next step)

## Step 2: Configure MCP Server in Cursor

1. **Open Cursor Settings**:
   - Press `Ctrl+,` (or `Cmd+,` on Mac) to open settings
   - Or: File → Preferences → Settings

2. **Navigate to MCP Settings**:
   - Search for "MCP" in the settings search bar
   - Or navigate to: Extensions → MCP Servers

3. **Add GitHub MCP Server Configuration**:
   
   You'll need to add a configuration entry. The exact format depends on Cursor's MCP configuration, but typically it looks like:

   ```json
   {
     "mcpServers": {
       "github": {
         "command": "npx",
         "args": [
           "-y",
           "@modelcontextprotocol/server-github"
         ],
         "env": {
           "GITHUB_PERSONAL_ACCESS_TOKEN": "your-token-here"
         }
       }
     }
   }
   ```

   **Alternative**: If Cursor uses a different configuration format, you may need to:
   - Add the server through Cursor's UI if available
   - Or edit the configuration file directly (location varies by OS)

4. **Configuration File Locations** (if editing directly):
   - **Linux**: `~/.config/Cursor/User/globalStorage/rooveterinaryinc.roo-cline/settings/cline_mcp_settings.json`
   - **macOS**: `~/Library/Application Support/Cursor/User/globalStorage/rooveterinaryinc.roo-cline/settings/cline_mcp_settings.json`
   - **Windows**: `%APPDATA%\Cursor\User\globalStorage\rooveterinaryinc.roo-cline\settings\cline_mcp_settings.json`

   Note: The exact path may vary. Look for MCP-related configuration files in Cursor's settings directory.

## Step 3: Restart Cursor

After configuring the MCP server:
1. Save the configuration
2. Restart Cursor completely
3. The GitHub MCP server should now be available

## Step 4: Verify Setup

Once Cursor restarts, you should be able to:
- Access GitHub repositories
- Create issues, pull requests
- Manage branches and commits
- And other GitHub operations through MCP

## Step 5: Connect Your Local Repository to GitHub

If you haven't already connected your local repository to GitHub:

1. **Create a GitHub Repository**:
   - Go to https://github.com/new
   - Create a new repository (don't initialize with README, .gitignore, or license)
   - Copy the repository URL

2. **Add Remote to Your Local Repository**:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
   # Or use SSH:
   # git remote add origin git@github.com:YOUR_USERNAME/YOUR_REPO_NAME.git
   ```

3. **Push Your Code**:
   ```bash
   git add .
   git commit -m "feat: initial commit"
   git push -u origin main
   ```

## Security Best Practices

- ✅ Never commit your GitHub token to version control
- ✅ Use environment variables or secure storage for tokens
- ✅ Set token expiration dates
- ✅ Rotate tokens regularly
- ✅ Use the minimum required permissions
- ✅ Revoke tokens if compromised

## Troubleshooting

### MCP Server Not Appearing
- Ensure Cursor is fully restarted
- Check that the configuration syntax is correct
- Verify the token has the correct permissions
- Check Cursor's logs for MCP-related errors

### Authentication Errors
- Verify your token is still valid (not expired)
- Check that the token has the required scopes
- Regenerate the token if needed

### Connection Issues
- Ensure you have internet connectivity
- Check GitHub's status: https://www.githubstatus.com/
- Verify your token hasn't been revoked

## Alternative: Using GitHub CLI (gh)

If the MCP server setup is complex, you can also use GitHub CLI:

```bash
# Install GitHub CLI
# Linux: sudo apt install gh
# macOS: brew install gh
# Or download from: https://cli.github.com/

# Authenticate
gh auth login

# Then use gh commands in terminal
gh repo create
gh issue create
gh pr create
```

## Need Help?

If you encounter issues:
1. Check Cursor's documentation on MCP servers
2. Review the GitHub MCP server documentation
3. Check Cursor's logs for error messages
4. Verify your token permissions on GitHub

