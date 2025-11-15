# Infrastructure Tools Setup

## Executive Summary

**Use MCP server for GitHub** (works great), **use CLI tools for Vercel and Supabase** (MCP packages don't exist yet).

## Current Setup

### ✅ GitHub MCP Server

**Package**: `@modelcontextprotocol/server-github` - ✅ Available and working

**Features**:

- Automated issue management
- PR creation and management
- Repository administration
- Code search

**Configuration**: See [GITHUB_MCP_SETUP.md](./GITHUB_MCP_SETUP.md)

### ✅ Vercel CLI

**Tool**: `vercel` CLI - ✅ Installed and configured

**Common Commands**:

```bash
# Deploy to preview
vercel

# Deploy to production
vercel --prod

# Pull environment variables
vercel env pull .env.local

# View deployments
vercel ls

# View logs
vercel logs

# Manage environment variables
vercel env add DATABASE_URL
vercel env ls
vercel env rm DATABASE_URL
```

**Documentation**: [Vercel CLI Docs](https://vercel.com/docs/cli)

### ✅ Supabase CLI

**Tool**: `supabase` CLI - ✅ Installed and configured

**Common Commands**:

```bash
# Pull database schema
supabase db pull

# Push migrations
supabase db push

# Generate TypeScript types
supabase gen types typescript --local > types/supabase.ts

# Start local development
supabase start

# View database
supabase db diff
```

**Documentation**: [Supabase CLI Docs](https://supabase.com/docs/reference/cli)

## How DevOps Expert Can Use These

The DevOps & Infrastructure Expert can use CLI tools through Cursor in two ways:

### Option A: Direct Terminal Commands

The expert can run CLI commands directly in Cursor's terminal:

- `vercel --prod` to deploy
- `supabase db push` to run migrations
- `vercel env add` to manage environment variables

### Option B: Scripts and Automation

Create helper scripts that the expert can reference:

```bash
# scripts/deploy.sh
#!/bin/bash
vercel --prod

# scripts/migrate.sh
#!/bin/bash
supabase db push
```

## Workflow Examples

### Deploying to Vercel

```bash
# In Cursor terminal or via DevOps expert
cd /home/dave/src/sample-app
vercel --prod
```

### Running Database Migrations

```bash
# In Cursor terminal or via DevOps expert
cd /home/dave/src/sample-app
supabase db push
```

### Managing Environment Variables

```bash
# Add a new environment variable
vercel env add DATABASE_URL production

# Pull all environment variables locally
vercel env pull .env.local
```

## Best Practices

### 1. Document Your Setup

- Keep notes on which tools you're using
- Document common commands in your project README
- Update this document when things change

### 2. Use CLI Tools for Infrastructure

- **CLI for deployments** - `vercel --prod`
- **CLI for database operations** - `supabase db push`
- **CLI for environment management** - `vercel env add`
- **CLI for automation and scripts**

### 3. Version Control CLI Configs

- Commit `.vercel/project.json` (safe to commit)
- Don't commit `.vercel/.env.local` (contains secrets)
- Document required CLI tools in `package.json` or README

### 4. Security

- Store API tokens securely (use environment variables)
- Use different tokens for different environments
- Rotate tokens regularly
- Never commit tokens to version control

## Summary

**Current State:**

- ✅ GitHub MCP: Use it (works great)
- ✅ Vercel CLI: Use it (installed and linked)
- ✅ Supabase CLI: Use it (installed and linked)

**Action Items:**

1. ✅ GitHub MCP server configured
2. ✅ Vercel CLI installed and linked
3. ✅ Supabase CLI installed and linked
4. ✅ Projects linked with both CLIs

**Bottom Line:** Use GitHub MCP for GitHub operations, and CLI tools for Vercel and Supabase infrastructure management. CLI tools are reliable, well-documented, and provide full feature support.
